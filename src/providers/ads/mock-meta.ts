import type { AdCampaign, AdsProvider, AdSetStatus } from "./types";

/**
 * In-memory Meta provider for development and tests (SPEC §5.3 reality
 * note: real Meta app review takes time, the engine must work without it).
 */
const accounts = new Map<string, AdCampaign[]>();

function defaultCampaigns(): AdCampaign[] {
  return [
    {
      ref: "camp-1",
      name: "Summer Sale",
      status: "ACTIVE",
      adsets: [
        { ref: "adset-1", name: "Blankets — Prospecting", status: "ACTIVE" },
        { ref: "adset-2", name: "Blankets — Retargeting", status: "ACTIVE" },
      ],
    },
    {
      ref: "camp-2",
      name: "Evergreen",
      status: "ACTIVE",
      adsets: [
        { ref: "adset-3", name: "Coffee Sets", status: "ACTIVE" },
      ],
    },
  ];
}

export function getMockAccount(accountRef: string): AdCampaign[] {
  if (!accounts.has(accountRef)) {
    accounts.set(accountRef, defaultCampaigns());
  }
  return accounts.get(accountRef)!;
}

/** Test/dev helper — e.g. simulate a human pausing an ad set in Ads Manager. */
export function setMockAdSetStatus(
  accountRef: string,
  adsetRef: string,
  status: AdSetStatus,
): void {
  for (const campaign of getMockAccount(accountRef)) {
    for (const adset of campaign.adsets) {
      if (adset.ref === adsetRef) adset.status = status;
    }
  }
}

export function getMockAdSetStatus(
  accountRef: string,
  adsetRef: string,
): AdSetStatus | null {
  for (const campaign of getMockAccount(accountRef)) {
    for (const adset of campaign.adsets) {
      if (adset.ref === adsetRef) return adset.status;
    }
  }
  return null;
}

export class MockMetaProvider implements AdsProvider {
  constructor(private accountRef: string) {}

  async listCampaigns(): Promise<AdCampaign[]> {
    return getMockAccount(this.accountRef).map((c) => ({
      ...c,
      adsets: c.adsets.map((a) => ({ ...a })),
    }));
  }

  async pauseAdSet(ref: string): Promise<void> {
    setMockAdSetStatus(this.accountRef, ref, "PAUSED");
  }

  async resumeAdSet(ref: string): Promise<void> {
    setMockAdSetStatus(this.accountRef, ref, "ACTIVE");
  }
}
