import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeSiteUrl,
  validateWooCredentials,
  WooProvider,
} from "@/providers/stores/woocommerce";

const CREDS = {
  siteUrl: "https://shop.example.com",
  consumerKey: "ck_test",
  consumerSecret: "cs_test",
};

afterEach(() => vi.unstubAllGlobals());

describe("normalizeSiteUrl", () => {
  it("normalizes bare domains to https origins", () => {
    expect(normalizeSiteUrl("shop.example.com")).toBe("https://shop.example.com");
    expect(normalizeSiteUrl("https://shop.example.com/wp-admin/")).toBe(
      "https://shop.example.com",
    );
  });

  it("rejects http and garbage", () => {
    expect(normalizeSiteUrl("http://insecure.example.com")).toBeNull();
    expect(normalizeSiteUrl("not a url at all //")).toBeNull();
  });
});

describe("WooProvider.fetchProducts", () => {
  it("maps managed and unmanaged stock", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            { id: 1, name: "Managed", sku: "M-1", manage_stock: true, stock_quantity: 7, stock_status: "instock" },
            { id: 2, name: "Unmanaged In", sku: "", manage_stock: false, stock_quantity: null, stock_status: "instock" },
            { id: 3, name: "Unmanaged Out", sku: "U-3", manage_stock: false, stock_quantity: null, stock_status: "outofstock" },
          ]),
          { status: 200 },
        ),
      ),
    );

    const products = await new WooProvider(CREDS).fetchProducts();
    expect(products).toEqual([
      { externalId: "1", title: "Managed", sku: "M-1", inventoryQty: 7 },
      { externalId: "2", title: "Unmanaged In", sku: null, inventoryQty: 1 },
      { externalId: "3", title: "Unmanaged Out", sku: "U-3", inventoryQty: 0 },
    ]);

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const url = call[0] as URL;
    expect(url.toString()).toContain("https://shop.example.com/wp-json/wc/v3/products");
    expect((call[1] as RequestInit).headers).toMatchObject({
      Authorization: expect.stringContaining("Basic "),
    });
  });

  it("follows pagination until a short page", async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `P${i}`,
      sku: "",
      manage_stock: true,
      stock_quantity: 1,
      stock_status: "instock",
    }));
    const mock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(fullPage), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", mock);

    const products = await new WooProvider(CREDS).fetchProducts();
    expect(products).toHaveLength(100);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("throws on API errors so the store flips to error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 500 })),
    );
    await expect(new WooProvider(CREDS).fetchProducts()).rejects.toThrow(
      "WooCommerce API 500",
    );
  });
});

describe("validateWooCredentials", () => {
  it("flags rejected keys", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
    );
    const result = await validateWooCredentials(CREDS);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toContain("rejected");
  });

  it("accepts a working connection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("[]", { status: 200 })),
    );
    expect(await validateWooCredentials(CREDS)).toEqual({ ok: true });
  });
});
