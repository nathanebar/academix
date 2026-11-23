const ffmpeg = require("fluent-ffmpeg");
const logger = require("./logger");
// FFMPEG_PATH : binaire fourni manuellement (réseau fermé). Sinon @ffmpeg-installer.
ffmpeg.setFfmpegPath(
  process.env.FFMPEG_PATH || require("@ffmpeg-installer/ffmpeg").path
);

function encodeBuffer(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const fs = require("fs").promises;
      const tmp = require("tmp-promise");
      tmp
        .file({ postfix: ".mp4" })
        .then(async (inputFile) => {
          try {
            await fs.writeFile(inputFile.path, buffer);
            const outputPath = inputFile.path + ".out.mp4";
            ffmpeg(inputFile.path)
              .inputOptions(["-f", "mp4"])
              .outputOptions(["-movflags", "+faststart"])
              .output(outputPath)
              .on("end", async () => {
                try {
                  const resultBuffer = await fs.readFile(outputPath);
                  try {
                    await fs.unlink(inputFile.path);
                  } catch (unlinkErr) {
                    logger.warn("encodeVideo: failed to delete the input temp file", { originalError: unlinkErr.message });
                  }
                  try {
                    await fs.unlink(outputPath);
                  } catch (unlinkErr) {
                    logger.warn("encodeVideo: failed to delete the output temp file", { originalError: unlinkErr.message });
                  }
                  resolve(resultBuffer);
                } catch (cleanupErr) {
                  reject(cleanupErr);
                }
              })
              .on("error", async (err) => {
                await fs.unlink(inputFile.path).catch(() => {});
                await fs.unlink(outputPath).catch(() => {});
                reject(err);
              })
              .run();
          } catch (err) {
            reject(err);
          }
        })
        .catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  encodeBuffer,
};
