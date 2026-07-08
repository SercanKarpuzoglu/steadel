import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["trial", "starter", "growth", "agency"]);
export const orgRoleEnum = pgEnum("org_role", ["owner", "member"]);
export const platformEnum = pgEnum("platform", ["shopify", "woocommerce"]);
export const storeStatusEnum = pgEnum("store_status", [
  "connected",
  "error",
  "disconnected",
]);
export const adsProviderEnum = pgEnum("ads_provider", ["meta", "google"]);
export const adLinkModeEnum = pgEnum("ad_link_mode", [
  "pause_on_zero",
  "pause_below_threshold",
]);
export const adLinkStateEnum = pgEnum("ad_link_state", [
  "active",
  "paused_by_steadel",
  "unknown",
]);
export const automationTypeEnum = pgEnum("automation_type", [
  "low_stock_alert",
  "scheduled_report",
  "ads_guard",
]);
export const authTokenTypeEnum = pgEnum("auth_token_type", [
  "email_verify",
  "password_reset",
  "magic_link",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id),
  plan: planEnum("plan").notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  paddleCustomerId: text("paddle_customer_id"),
  paddleSubscriptionId: text("paddle_subscription_id"),
  subscriptionStatus: text("subscription_status"),
  whiteLabelName: text("white_label_name"),
  slackWebhookUrl: text("slack_webhook_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orgMembers = pgTable(
  "org_members",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: orgRoleEnum("role").notNull().default("member"),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.userId] })],
);

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    name: text("name").notNull(),
    domain: text("domain").notNull(),
    status: storeStatusEnum("status").notNull().default("connected"),
    credentialsEncrypted: jsonb("credentials_encrypted"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("stores_org_id_idx").on(t.orgId)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    sku: text("sku"),
    inventoryQty: integer("inventory_qty").notNull().default(0),
    tracked: boolean("tracked").notNull().default(false),
    thresholdQty: integer("threshold_qty"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("products_store_id_idx").on(t.storeId),
    uniqueIndex("products_store_external_idx").on(t.storeId, t.externalId),
  ],
);

export const adConnections = pgTable(
  "ad_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: adsProviderEnum("provider").notNull(),
    status: text("status").notNull().default("connected"),
    credentialsEncrypted: jsonb("credentials_encrypted"),
    accountRef: text("account_ref"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("ad_connections_org_id_idx").on(t.orgId)],
);

export const adLinks = pgTable(
  "ad_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    adConnectionId: uuid("ad_connection_id")
      .notNull()
      .references(() => adConnections.id, { onDelete: "cascade" }),
    externalCampaignRef: text("external_campaign_ref"),
    externalAdsetRef: text("external_adset_ref").notNull(),
    mode: adLinkModeEnum("mode").notNull().default("pause_on_zero"),
    thresholdQty: integer("threshold_qty"),
    state: adLinkStateEnum("state").notNull().default("unknown"),
    lastActionAt: timestamp("last_action_at", { withTimezone: true }),
  },
  (t) => [index("ad_links_product_id_idx").on(t.productId)],
);

export const automationRules = pgTable(
  "automation_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    type: automationTypeEnum("type").notNull(),
    config: jsonb("config").notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("automation_rules_store_id_idx").on(t.storeId)],
);

export const alertsLog = pgTable(
  "alerts_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull().default({}),
    deliveredVia: text("delivered_via"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("alerts_log_org_id_idx").on(t.orgId)],
);

export const eventsAudit = pgTable(
  "events_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("events_audit_org_id_idx").on(t.orgId)],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: authTokenTypeEnum("type").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("auth_tokens_user_id_idx").on(t.userId)],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    prefix: text("prefix").notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("api_keys_org_id_idx").on(t.orgId)],
);

export const processedWebhooks = pgTable(
  "processed_webhooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull(),
    externalId: text("external_id").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("processed_webhooks_source_ext_idx").on(t.source, t.externalId)],
);

export const deadLetters = pgTable("dead_letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  reason: text("reason").notNull(),
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
