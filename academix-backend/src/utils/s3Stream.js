const { pipeline } = require("stream");
const { GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const logger = require("./logger");

// A single byte range ("bytes=0-1023", "bytes=1024-", "bytes=-500"). Multi-range requests
// are answered with the full file (200), which RFC 9110 allows.
const SINGLE_RANGE = /^bytes=(\d+-\d*|-\d+)$/;

/**
 * Sends an S3 / MinIO object to the client, with HTTP Range support:
 * - `Range: bytes=...` → 206 Partial Content + Content-Range (video / audio seeking);
 * - a range outside the file → 416 with `Content-Range: bytes * /<size>`;
 * - always Content-Length and Accept-Ranges, so players know the size and can seek.
 * The S3 stream is piped with stream.pipeline(): when the client aborts (players abort a
 * request on every seek), the S3 connection is released instead of staying open.
 */
const sendS3Object = async (s3Client, req, res, { bucket, key, headers = {} }) => {
  const range = SINGLE_RANGE.test(req.headers.range || "") ? req.headers.range : undefined;

  let object;
  try {
    object = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: range }));
  } catch (error) {
    if (range && (error.name === "InvalidRange" || error.$metadata?.httpStatusCode === 416)) {
      const head = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      res.status(416).set("Content-Range", `bytes */${head.ContentLength}`).end();
      return;
    }
    throw error;
  }

  res.status(range && object.ContentRange ? 206 : 200);
  res.set({
    "Accept-Ranges": "bytes",
    "Content-Type": object.ContentType || "application/octet-stream",
    ...headers,
  });
  if (object.ContentLength !== undefined) res.set("Content-Length", String(object.ContentLength));
  if (object.ContentRange) res.set("Content-Range", object.ContentRange);
  if (object.LastModified) res.set("Last-Modified", object.LastModified.toUTCString());

  if (!object.Body) {
    res.end();
    return;
  }
  pipeline(object.Body, res, (error) => {
    if (error && error.code !== "ERR_STREAM_PREMATURE_CLOSE") {
      logger.warn("S3 stream interrupted", { bucket, key, originalError: error.message });
    }
  });
};

module.exports = { sendS3Object };
