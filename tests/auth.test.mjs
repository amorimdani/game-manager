import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  return derived.length === keyBuf.length && crypto.timingSafeEqual(derived, keyBuf);
}

test("password hashing verifies matching password and rejects wrong password", () => {
  const hash = hashPassword("ludus1234");
  assert.equal(verifyPassword("ludus1234", hash), true);
  assert.equal(verifyPassword("wrongpass", hash), false);
});
