import { describe, expect, it } from "vitest";
import { decryptJson, encryptJson } from "@/lib/crypto";

describe("crypto helpers", () => {
  it("round-trips JSON values", () => {
    const secret = { accessToken: "shpat_abc123", shop: "demo.myshopify.com" };
    const encrypted = encryptJson(secret);
    expect(decryptJson(encrypted)).toEqual(secret);
  });

  it("produces a different ciphertext per call (random IV)", () => {
    const a = encryptJson({ v: 1 });
    const b = encryptJson({ v: 1 });
    expect(a.data).not.toEqual(b.data);
    expect(a.iv).not.toEqual(b.iv);
  });

  it("does not contain the plaintext in the payload", () => {
    const encrypted = encryptJson({ accessToken: "super-secret-token" });
    expect(JSON.stringify(encrypted)).not.toContain("super-secret-token");
  });

  it("fails on tampered ciphertext (GCM auth)", () => {
    const encrypted = encryptJson({ ok: true });
    const tampered = {
      ...encrypted,
      data: Buffer.from("tampered-data").toString("base64"),
    };
    expect(() => decryptJson(tampered)).toThrow();
  });
});
