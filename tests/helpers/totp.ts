import { createHmac } from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32Decode = (text: string): Buffer => {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of text.replace(/\s/g, "").toUpperCase()) {
    value = (value << 5) | BASE32.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
};

/** The code of an authenticator app, `steps` periods of 30 s ahead. */
export const totp = (secret: string, steps = 0): string => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + steps));
  const hmac = createHmac("sha1", base32Decode(secret))
    .update(counter)
    .digest();
  const offset = (hmac[hmac.length - 1] as number) & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1_000_000).padStart(6, "0");
};
