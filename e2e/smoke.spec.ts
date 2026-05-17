import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("Smoke", () => {
  test("home renders validators heading + table + connect", async ({ page }) => {
    await page.goto("/")
    // Page heading
    await expect(
      page.getByRole("heading", { name: /^validators$/i, level: 1 })
    ).toBeVisible()
    // KPI strip
    await expect(page.getByText(/total safe staked/i)).toBeVisible()
    await expect(page.getByText(/active validators/i)).toBeVisible()
    // Header connect button (top-right)
    await expect(page.getByRole("button", { name: /^connect$/i })).toBeVisible()
    // At least one Stake action button in the table (per-row)
    await expect(page.getByRole("button", { name: /^stake$/i }).first()).toBeVisible()
  })

  test("header nav routes to /withdrawals", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /^withdrawals$/i }).click()
    await expect(page).toHaveURL(/\/withdrawals$/)
    await expect(
      page.getByRole("heading", { name: /^withdrawals$/i, level: 1 })
    ).toBeVisible()
    await expect(
      page.getByText("Pending withdrawals", { exact: true })
    ).toBeVisible()
  })

  test("header nav routes to /rewards", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /^rewards$/i }).click()
    await expect(page).toHaveURL(/\/rewards$/)
    await expect(
      page.getByRole("heading", { name: /your rewards/i, level: 1 })
    ).toBeVisible()
    await expect(page.getByText(/claimable safe/i)).toBeVisible()
  })

  test("legacy /validators 308-redirects to home", async ({ page }) => {
    await page.goto("/validators", { waitUntil: "load" })
    await expect(page).toHaveURL(/\/$/)
  })

  test("theme toggle + settings buttons are present", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("button", { name: /toggle theme/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /open settings/i })).toBeVisible()
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

  test("a11y baseline on rewards page", async ({ page }) => {
    await page.goto("/rewards")
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    )
    expect(serious).toEqual([])
  })
})
