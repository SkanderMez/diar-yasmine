import { test, expect } from "@playwright/test";

test.describe("Public site smoke", () => {
  test("home redirects to /fr", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    expect(page.url()).toMatch(/\/fr$/);
    await expect(
      page.getByRole("heading", { name: /Diar Yasmine/i }).first(),
    ).toBeVisible();
  });

  test("chalets listing displays at least one property card", async ({
    page,
  }) => {
    await page.goto("/fr/chalets");
    await expect(
      page.getByRole("heading", { name: "Chalets" }).first(),
    ).toBeVisible();
    const cards = page.locator("a[href*='/chalets/']");
    await expect(cards.first()).toBeVisible();
  });

  test("locale switcher sets html lang", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("api/health returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBeLessThan(600);
    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("db");
  });

  test("sitemap.xml is served", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/fr/chalets");
  });
});
