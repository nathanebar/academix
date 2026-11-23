const ntlm = require("express-ntlm");
const logger = require("../utils/logger");

// Middleware créé une seule fois (la négociation NTLM se fait en plusieurs requêtes).
const domainControllers = (process.env.NTLM_DOMAIN_CONTROLLER || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ntlmMiddleware = ntlm({
  domain: process.env.NTLM_DOMAIN || "",
  domaincontroller: domainControllers,
  badrequest: (req, res) => res.status(400).json({ error: "NTLM bad request" }),
  internalservererror: (req, res) => res.status(500).json({ error: "NTLM server error" }),
  forbidden: (req, res) => res.status(403).json({ error: "NTLM forbidden" }),
  prefix: "ntlm-auth",
  debug: process.env.NTLM_DEBUG === "true" ? (...args) => logger.info("ntlm", { details: args.join(" ") }) : () => {},
});

exports.ntlmAuth = (req, res, next) => {
  ntlmMiddleware(req, res, () => {
    if (req.ntlm != null) {
      req.ntlm.username = req.ntlm.UserName;
      req.ntlm.domain = req.ntlm.DomainName;
      req.ntlm.workstation = req.ntlm.Workstation;
      req.ntlm.authenticated = req.ntlm.Authenticated;
    }
    next();
  });
};
