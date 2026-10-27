import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_USER_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD || "Password123!";

test.describe("Authentication and Protected Routes (US-110)", () => {
  test("1. Unauthenticated user accessing /dashboard is redirected to login with next param", async ({
    page,
  }) => {
    // Attempt to access protected dashboard directly while unauthenticated
    await page.goto("/dashboard");

    // Must be redirected to /login?next=/dashboard
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);

    // Verify login form is presented
    await expect(page.locator('[data-slot="card-title"]')).toHaveText("Sign in");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("2. Submitting invalid credentials shows error alert and preserves login page", async ({
    page,
  }) => {
    await page.goto("/login");

    // Enter incorrect credentials
    await page.getByLabel("Email").fill("invalid-user@example.com");
    await page.getByLabel("Password").fill("WrongPassword999!");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Verify server error alert banner is displayed
    const alert = page.getByTestId("auth-error-alert");
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/invalid login credentials/i);

    // User remains on the login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("3. Full login flow: Browser -> Home -> Click 'Log in' -> Submit valid credentials -> Protected Dashboard displaying email and role", async ({
    page,
  }) => {
    // 1. User opens the frontend in a browser
    await page.goto("/");

    // 2. Clicks "Log in"
    const loginLink = page.getByRole("link", { name: "Log in" }).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    await expect(page).toHaveURL(/\/login/);

    // 3. Enters valid credentials
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    // 4. Gets redirected to protected dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // 5. Sees their email/name and role
    const userEmail = page.getByTestId("user-email");
    const userRole = page.getByTestId("user-role");

    await expect(userEmail).toBeVisible();
    await expect(userEmail).toHaveText(TEST_EMAIL);

    await expect(userRole).toBeVisible();
    await expect(userRole).toContainText("authenticated");
  });

  test("4. Deep-link preservation: Unauthenticated visit to /chat preserves ?next=/chat and lands on /chat post-login", async ({
    browser,
  }) => {
    // Create an isolated incognito browser context
    const context = await browser.newContext();
    const page = await context.newPage();

    // Directly access protected /chat route
    await page.goto("/chat");

    // Expect redirect to login with ?next=/chat
    await expect(page).toHaveURL(/\/login\?next=%2Fchat/);

    // Enter credentials and log in
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Expect redirect directly to /chat rather than default /dashboard
    await expect(page).toHaveURL(/\/chat/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Chat" })).toBeVisible();

    await context.close();
  });

  test("5. Logout clears session, redirects to /login, and blocks subsequent access to protected routes", async ({
    page,
  }) => {
    // 1. Log in to establish an active session
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    // 2. Confirm user is on /dashboard with authenticated profile
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByTestId("user-email")).toHaveText(TEST_EMAIL);

    // 3. Click "Log out" button
    const logoutBtn = page.getByTestId("logout-button");
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // 4. Verify redirected to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page.locator('[data-slot="card-title"]')).toHaveText("Sign in");

    // 5. Verify auth cookies are cleared (no active supabase auth token)
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );
    expect(authCookies.length).toBe(0);

    // 6. Attempt to navigate back to protected /dashboard
    await page.goto("/dashboard");

    // 7. Verify bounced back to /login with next=/dashboard
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    await expect(page.locator('[data-slot="card-title"]')).toHaveText("Sign in");

    // 8. Test browser back button behavior
    await page.goBack();
    // Verify user cannot see dashboard content
    await expect(page.getByTestId("user-email")).not.toBeVisible();
  });
});
