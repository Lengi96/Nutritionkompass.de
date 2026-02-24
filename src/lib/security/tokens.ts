import { createHash, randomBytes } from "node:crypto";

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createOpaqueTokenPair(): {
  plainToken: string;
  storedTokenHash: string;
} {
  // URL-safe token for verification/reset/invitation links.
  const plainToken = randomBytes(32).toString("base64url");
  return {
    plainToken,
    storedTokenHash: hashOpaqueToken(plainToken),
  };
}

