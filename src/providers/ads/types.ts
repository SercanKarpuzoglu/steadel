export type AdSetStatus = "ACTIVE" | "PAUSED";

export interface AdSet {
  ref: string;
  name: string;
  status: AdSetStatus;
}

export interface AdCampaign {
  ref: string;
  name: string;
  status: string;
  adsets: AdSet[];
}

/**
 * Provider interface for ad platforms (SPEC §5.3). Keeping it this small is
 * deliberate — Google Ads (v2) must slot in without changes.
 */
export interface AdsProvider {
  listCampaigns(): Promise<AdCampaign[]>;
  pauseAdSet(ref: string): Promise<void>;
  resumeAdSet(ref: string): Promise<void>;
}

export interface MetaCredentials {
  accessToken: string;
}

export function isMockAccountRef(ref: string | null): boolean {
  return !!ref?.startsWith("mock-");
}

export function adsGuardEnabled(): boolean {
  return process.env.ADS_GUARD_ENABLED === "true" || process.env.ADS_GUARD_ENABLED === "1";
}
