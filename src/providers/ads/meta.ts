import type { AdCampaign, AdsProvider, AdSetStatus, MetaCredentials } from "./types";

const GRAPH = "https://graph.facebook.com/v21.0";

async function graphFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const url = new URL(`${GRAPH}${path}`);
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url, init);
  const json = (await res.json()) as T & { error?: { message: string } };
  if (!res.ok || json.error) {
    throw new Error(`Meta API error: ${json.error?.message ?? res.status}`);
  }
  return json;
}

interface CampaignsResponse {
  data: Array<{
    id: string;
    name: string;
    status: string;
    adsets?: {
      data: Array<{ id: string; name: string; status: string }>;
    };
  }>;
}

/** Real Meta Marketing API provider — used when ADS_GUARD_ENABLED and the app is approved. */
export class MetaProvider implements AdsProvider {
  constructor(
    private accountRef: string, // "act_..."
    private credentials: MetaCredentials,
  ) {}

  async listCampaigns(): Promise<AdCampaign[]> {
    const res = await graphFetch<CampaignsResponse>(
      `/${this.accountRef}/campaigns?fields=id,name,status,adsets{id,name,status}&limit=100`,
      this.credentials.accessToken,
    );
    return res.data.map((c) => ({
      ref: c.id,
      name: c.name,
      status: c.status,
      adsets: (c.adsets?.data ?? []).map((a) => ({
        ref: a.id,
        name: a.name,
        status: (a.status === "ACTIVE" ? "ACTIVE" : "PAUSED") as AdSetStatus,
      })),
    }));
  }

  async pauseAdSet(ref: string): Promise<void> {
    await graphFetch(`/${ref}`, this.credentials.accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ status: "PAUSED" }),
    });
  }

  async resumeAdSet(ref: string): Promise<void> {
    await graphFetch(`/${ref}`, this.credentials.accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ status: "ACTIVE" }),
    });
  }
}

export function buildMetaAuthUrl(state: string): string {
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  url.searchParams.set(
    "redirect_uri",
    `${process.env.APP_URL}/api/meta/callback`,
  );
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "ads_management,ads_read");
  return url.toString();
}

export async function exchangeMetaCode(code: string): Promise<MetaCredentials> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  url.searchParams.set("client_secret", process.env.META_APP_SECRET ?? "");
  url.searchParams.set(
    "redirect_uri",
    `${process.env.APP_URL}/api/meta/callback`,
  );
  url.searchParams.set("code", code);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Meta token exchange failed (${res.status})`);
  const json = (await res.json()) as { access_token: string };
  return { accessToken: json.access_token };
}

export async function fetchFirstAdAccount(
  credentials: MetaCredentials,
): Promise<string | null> {
  const res = await graphFetch<{ data: Array<{ id: string }> }>(
    "/me/adaccounts?limit=1",
    credentials.accessToken,
  );
  return res.data[0]?.id ?? null;
}
