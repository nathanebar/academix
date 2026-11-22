// HTTP client for the closed network's directory API ("people API": user search, badges,
// photos), on Node's native http / https modules. Replaces the deprecated `request` package.
//
// TLS: certificates are verified by default. The directory server may use a certificate
// signed by an internal authority:
// - PEOPLE_API_CA_FILE=<path to a PEM file>: trust that CA for this API (recommended);
//   alternatively, NODE_EXTRA_CA_CERTS adds a CA for the whole Node process;
// - PEOPLE_API_INSECURE_TLS=true: do NOT verify the certificate (the previous behavior,
//   `rejectUnauthorized: false`). Only as a fallback if the CA cannot be provided.
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const logger = require("./logger");

const intEnv = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isNaN(value) ? fallback : value;
};

const PEOPLE_API_URL = (process.env.PEOPLE_API_URL || "").replace(/\/$/, "");
const INSECURE_TLS = process.env.PEOPLE_API_INSECURE_TLS === "true";
const CA_FILE = process.env.PEOPLE_API_CA_FILE;
const TIMEOUT_MS = intEnv("PEOPLE_API_TIMEOUT_MS", 15000);
const MAX_REDIRECTS = 10;

let httpsAgent;
const getHttpsAgent = () => {
  if (!httpsAgent) {
    const options = { keepAlive: true };
    if (CA_FILE) options.ca = fs.readFileSync(path.resolve(CA_FILE));
    if (INSECURE_TLS) {
      options.rejectUnauthorized = false;
      logger.warn("PEOPLE_API_INSECURE_TLS=true: the directory API certificate is not verified");
    }
    httpsAgent = new https.Agent(options);
  }
  return httpsAgent;
};
const httpAgent = new http.Agent({ keepAlive: true });

/**
 * Calls the directory API. Resolves with { response: { statusCode, statusMessage, headers },
 * body } (body: string, or Buffer when `binary` is true), like the `request` callback did;
 * rejects on network / TLS errors and timeouts.
 * As with `request`, redirects are followed only for GET when `followRedirect` is true, and
 * the body is returned as received (no decompression).
 */
const peopleRequest = ({ method = "GET", path: apiPath, headers = {}, body, followRedirect = false, binary = false }) => {
  const send = (url, redirectsLeft) =>
    new Promise((resolve, reject) => {
      const target = new URL(url);
      const isHttps = target.protocol === "https:";
      const payload = body === undefined ? undefined : Buffer.from(body);
      const req = (isHttps ? https : http).request(
        target,
        {
          method,
          agent: isHttps ? getHttpsAgent() : httpAgent,
          headers: payload ? { ...headers, "Content-Length": payload.length } : headers,
          timeout: TIMEOUT_MS,
        },
        (res) => {
          const isRedirect = res.statusCode >= 300 && res.statusCode < 400 && res.headers.location;
          if (followRedirect && isRedirect && method === "GET" && redirectsLeft > 0) {
            res.resume();
            resolve(send(new URL(res.headers.location, target).toString(), redirectsLeft - 1));
            return;
          }
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const raw = Buffer.concat(chunks);
            resolve({
              response: { statusCode: res.statusCode, statusMessage: res.statusMessage, headers: res.headers },
              body: binary ? raw : raw.toString("utf8"),
            });
          });
          res.on("error", reject);
        }
      );
      req.on("timeout", () => req.destroy(new Error(`Directory API timeout after ${TIMEOUT_MS} ms`)));
      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });

  return send(`${PEOPLE_API_URL}${apiPath}`, MAX_REDIRECTS);
};

module.exports = { PEOPLE_API_URL, peopleRequest };
