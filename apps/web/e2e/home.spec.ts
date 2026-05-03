import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
	test("should display the main heading", async ({ page }) => {
		await page.goto("/");

		const heading = page.getByRole("heading", { level: 1 });
		await expect(heading).toBeVisible();
	});

	test("should have a working navigation", async ({ page }) => {
		await page.goto("/");

		const nav = page.getByRole("navigation");
		await expect(nav).toBeVisible();
	});
});
