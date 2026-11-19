const crypto = require("crypto");

const KEYLEN = 64;

// Format stocké : scrypt$<salt hex>$<hash hex>
exports.hashPassword = (plain) =>
  new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(plain, salt, KEYLEN, (err, key) => {
      if (err) return reject(err);
      resolve(`scrypt$${salt}$${key.toString("hex")}`);
    });
  });

exports.verifyPassword = (plain, stored) =>
  new Promise((resolve) => {
    if (!stored || typeof stored !== "string") return resolve(false);
    const [algo, salt, hash] = stored.split("$");
    if (algo !== "scrypt" || !salt || !hash) return resolve(false);
    crypto.scrypt(plain, salt, KEYLEN, (err, key) => {
      if (err) return resolve(false);
      const expected = Buffer.from(hash, "hex");
      resolve(expected.length === key.length && crypto.timingSafeEqual(expected, key));
    });
  });
