import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("Smoke", () => {
  test("home renders stake tabs and connect button", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /your stake/i }).or(page.getByText(/your stake/i))).toBeVisible()
    await expect(page.getByRole("tab", { name: /^stake$/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /initiate withdrawal/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /claim withdrawal/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible()
  })

  test("navigates to validators page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /^validators$/i }).click()
    await expect(page).toHaveURL(/\/validators/)
    await expect(page.getByText(/Independent operator view/i)).toBeVisible()
  })

  test("navigates to rewards page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /^rewards$/i }).click()
    await expect(page).toHaveURL(/\/rewards/)
    await expect(page.getByText(/Merkle drop|Connect a wallet/i)).toBeVisible()
  })

  test("a11y baseline on home page", async ({ page }) => {
    await page.goto("/")
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    )
    expect(serious).toEqual([])
  })

  test("tab switching updates aria-selected", async ({ page }) => {
    await page.goto("/")
    const unstakeTab = page.getByRole("tab", { name: /initiate withdrawal/i })
    await unstakeTab.click()
    await expect(unstakeTab).toHaveAttribute("aria-selected", "true")
  })
})
