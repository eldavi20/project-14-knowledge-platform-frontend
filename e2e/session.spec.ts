import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_USER_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD || "Password123!";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe("Session behavior (US-86 / Task 91)", () => {
  test("session persists after page reload", async ({ page }) => {
    await login(page);

    await page.reload();

    // Still authenticated: no redirect back to /login, user data still renders
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("user-email")).toHaveText(TEST_EMAIL);
  });

  test("wrong password for an existing user is rejected", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    const alert = page.getByTestId("auth-error-alert");
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/invalid login credentials/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test("authenticated user is not blocked from protected /chat route", async ({
    page,
  }) => {
    await login(page);

    await page.goto("/chat");

    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByRole("heading", { name: "Chat" })).toBeVisible();
  });
});