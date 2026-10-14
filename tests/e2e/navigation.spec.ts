import { test, expect } from "@playwright/test";
test("onboarding, profile, accessibility settings persist, no overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Le direct./ })).toBeVisible();
  await page.getByRole("button", { name: "Explorer librement" }).click();
  await expect(
    page.getByRole("heading", { name: /Trouve ton prochain/ }),
  ).toBeVisible();
  await page
    .locator(".nav-item")
    .filter({ hasText: "Profil" })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole("heading", { name: "Ton espace" })).toBeVisible();
  await page
    .getByRole("link", { name: "Réglages", exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("link", { name: /Apparence et accessibilité/ }).click();
  await page.getByRole("switch", { name: /Contraste renforcé/ }).check();
  await expect(page.locator("html")).toHaveClass(/high-contrast/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/high-contrast/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("empty library and account handoffs describe actual behavior", async ({
  page,
}) => {
  await page.goto("/#/library");
  await expect(
    page.getByRole("heading", { name: "Ta bibliothèque" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ton prochain coup de cœur t’attend" }),
  ).toBeVisible();
  await page.goto("/#/support/example");
  await expect(
    page.getByRole("button", { name: /Continuer sur Twitch/ }),
  ).toBeVisible();
  await expect(page.getByText(/aucune donnée bancaire/)).toBeVisible();
});
test("gallery screenshots for layout review", async ({ page }, info) => {
  await page.goto("/#/profile");
  await expect(page.getByRole("heading", { name: "Ton espace" })).toBeVisible();
  await page.screenshot({
    path: `artifacts/qa/${info.project.name}-profile.png`,
    fullPage: true,
  });
  await page.goto("/#/settings/appearance");
  await page.screenshot({
    path: `artifacts/qa/${info.project.name}-appearance.png`,
    fullPage: true,
  });
});
