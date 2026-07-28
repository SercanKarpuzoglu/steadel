import { describe, it, expect } from "vitest";
import { buildWooAuthorizeUrl } from "@/lib/services/woo-connect-service";

describe("buildWooAuthorizeUrl (wc-auth one-click)", () => {
  it("targets the store's wc-auth endpoint with read scope and our token", () => {
    const raw = buildWooAuthorizeUrl("https://shop.example.com", "tok_123");
    const url = new URL(raw);
    expect(url.origin).toBe("https://shop.example.com");
    expect(url.pathname).toBe("/wc-auth/v1/authorize");
    expect(url.searchParams.get("app_name")).toBe("Steadel");
    expect(url.searchParams.get("scope")).toBe("read");
    expect(url.searchParams.get("user_id")).toBe("tok_123");
    expect(url.searchParams.get("callback_url")).toMatch(/\/api\/woo\/callback$/);
    expect(url.searchParams.get("return_url")).toMatch(/\/stores\?connected=woo$/);
  });
});
