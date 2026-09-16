import { expect, test } from "@playwright/test";

test.describe("strawberry cocoa cake designer", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (error) => console.error("PAGE_ERROR", error.message));
    page.on("console", (message) => { if (message.type() === "error") console.error("BROWSER_ERROR", message.text()); });
    await page.goto("/designer");
    await expect(page.getByText("LayerZ Cake Studio")).toBeVisible();
  });

  test("renders and captures the five projections plus Beauty Preview", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop fixture captures the complete six-view comparison.");
    const workspace = page.getByRole("region", { name: "Không gian thiết kế" });
    for (const view of ["Từ trên", "Mặt trước", "Bên phải", "Mặt sau", "Bên trái"] as const) {
      await page.getByRole("button", { name: view, exact: true }).click();
      await expect(page.getByRole("button", { name: view, exact: true })).toHaveAttribute("data-active", "true");
      await workspace.screenshot({ path: `output/playwright/${view.toLocaleLowerCase("vi").replaceAll(" ", "-")}.png`, animations: "disabled" });
    }
    await page.getByRole("button", { name: "Beauty Preview" }).click();
    await expect(page.getByRole("region", { name: "Beauty Preview" })).toBeVisible();
    await expect(page.getByLabel("Beauty Preview bánh sinh nhật dâu cacao")).toBeVisible();
    await page.waitForTimeout(500);
    await workspace.screenshot({ path: "output/playwright/beauty-preview.png", animations: "disabled" });
  });

  test("edits a seeded radial rule and detaches its instances", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop fixture covers detailed radial controls.");
    await page.getByRole("button", { name: "Từ trên" }).click();
    await page.getByRole("button", { name: "Múi kem xoắn 01" }).click();
    await page.getByRole("button", { name: "Vòng 8" }).click();
    await expect(page.getByText("Lặp theo vòng")).toBeVisible();
    await page.getByLabel("Số lượng").fill("20");
    await page.getByRole("button", { name: "Tách để chỉnh riêng" }).click();
    await expect(page.getByText("Lặp & đối xứng")).toBeVisible();
  });

  test("moves a newly selected decoration in the first drag gesture", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop fixture verifies the precise first pointer gesture.");
    await page.getByRole("button", { name: "Mặt trước", exact: true }).click();
    await page.getByRole("button", { name: "Múi kem cạnh" }).click();
    await expect(page.getByRole("heading", { name: "Múi kem cạnh" })).toBeVisible();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Mặt trước", exact: true }).click();
    const canvas = page.locator("canvas.upper-canvas");
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x + 110, center.y - 24, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByText("Đã cập nhật vị trí chi tiết.", { exact: true })).toBeVisible();
  });

  test("keeps the canvas primary and opens properties on demand on mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile-only bottom-sheet behavior.");
    await page.getByRole("button", { name: "Từ trên" }).click();
    await page.getByRole("button", { name: "Múi kem xoắn 01" }).click();
    await page.getByRole("button", { name: "Mở thuộc tính" }).click();
    await expect(page.getByRole("heading", { name: "Múi kem xoắn 01" })).toBeInViewport();
    await page.screenshot({ path: "output/playwright/mobile-properties.png", animations: "disabled" });
  });
});
