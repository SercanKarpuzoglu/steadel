import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  isValidShopDomain,
  verifyOAuthHmac,
  verifyWebhookHmac,
} from "@/providers/stores/shopify-auth";

const SECRET = "shpss_test_secret";

describe("isValidShopDomain", () => {
  it("accepts real myshopify domains", () => {
    expect(isValidShopDomain("my-shop.myshopify.com")).toBe(true);
    expect(isValidShopDomain("shop123.myshopify.com")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isValidShopDomain("evil.com")).toBe(false);
    expect(isValidShopDomain("my-shop.myshopify.com.evil.com")).toBe(false);
    expect(isValidShopDomain("https://my-shop.myshopify.com")).toBe(false);
    expect(isValidShopDomain("")).toBe(false);
  });
});

describe("verifyOAuthHmac", () => {
  function sign(params: Record<string, string>): string {
    const message = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    return createHmac("sha256", SECRET).update(message).digest("hex");
  }

  it("accepts a correctly signed callback query", () => {
    const params = {
      code: "abc",
      shop: "my-shop.myshopify.com",
      state: "nonce",
      timestamp: "1700000000",
    };
    const hmac = sign(params);
    expect(verifyOAuthHmac({ ...params, hmac }, SECRET)).toBe(true);
  });

  it("rejects tampered parameters", () => {
    const params = {
      code: "abc",
      shop: "my-shop.myshopify.com",
      state: "nonce",
      timestamp: "1700000000",
    };
    const hmac = sign(params);
    expect(
      verifyOAuthHmac({ ...params, shop: "evil.myshopify.com", hmac }, SECRET),
    ).toBe(false);
  });

  it("rejects missing hmac", () => {
    expect(verifyOAuthHmac({ code: "abc" }, SECRET)).toBe(false);
  });
});

describe("verifyWebhookHmac", () => {
  it("accepts a correctly signed body", () => {
    const body = JSON.stringify({ id: 1, title: "Product" });
    const digest = createHmac("sha256", SECRET).update(body, "utf8").digest("base64");
    expect(verifyWebhookHmac(body, digest, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ id: 1 });
    const digest = createHmac("sha256", SECRET).update(body, "utf8").digest("base64");
    expect(verifyWebhookHmac(body + "x", digest, SECRET)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(verifyWebhookHmac("{}", null, SECRET)).toBe(false);
  });
});
