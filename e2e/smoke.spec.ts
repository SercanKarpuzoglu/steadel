import { expect, test } from "@playwright/test";

// Smoke suite (SPEC §10): signup/login/dashboard render.
// Requires a migrated database and `pnpm seed` (demo login).

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /steady operations/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /start free trial/i })).toBeVisible();
});

test("signup page renders the form", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByLabel(/name/i)).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /create account/i }),
  ).toBeVisible();
});

test("login page renders and rejects bad credentials", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

  await page.getByLabel(/email/i).fill("nobody@example.com");
  await page.getByLabel(/password/i).fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
});

test("demo user can sign in and see the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("demo@steadel.com");
  await page.getByLabel(/password/i).fill("demo-password-123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(/tracked products/i).first()).toBeVisible();
});
