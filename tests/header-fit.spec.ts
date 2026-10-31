import { test, expect } from "@playwright/test";

// Founder QA bar (10/30/2026): on phone-sized screens the header free-check button never overlaps the logo or the menu,
// the menu opens and closes, nothing is pushed off screen, and the header causes no sideways scroll. Checked at each
// width and at 200% text. The phone button only exists in launch builds (PUBLIC_LAUNCHED=1); in pre-launch builds the
// test still guards the logo and menu. Run the launch version locally with: PUBLIC_LAUNCHED=1 npx playwright test header-fit
const WIDTHS = [280, 320, 360, 375, 390, 412, 430, 600, 899];

for (const zoom of [1, 2]) {
  for (const width of WIDTHS) {
    test(`header fits at ${width}px, ${zoom * 100}% text`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      await page.goto("/guides/cna-resume/");
      if (zoom === 2) await page.addStyleTag({ content: "html{font-size:200% !important}" });
      await page.waitForTimeout(100);

      const boxes = await page.evaluate(() => {
        const box = (sel: string) => {
          const e = document.querySelector(sel) as HTMLElement | null;
          if (!e || getComputedStyle(e).display === "none") return null;
          const r = e.getBoundingClientRect();
          return r.width && r.height ? { l: r.left, r: r.right, t: r.top, b: r.bottom } : null;
        };
        // Measure against the header bar itself: at 200% text other page content can widen the page (a separate issue).
        const bar = (document.querySelector(".site-header .bar") as HTMLElement).getBoundingClientRect();
        return { brand: box(".site-header .brand"), btn: box(".site-header .cta-phone"), menu: box(".site-header .hamburger"), left: bar.left, vw: bar.right };
      });
      type B = { l: number; r: number; t: number; b: number } | null;
      const overlap = (a: B, z: B) => !!a && !!z && a.l < z.r - 0.5 && z.l < a.r - 0.5 && a.t < z.b - 0.5 && z.t < a.b - 0.5;

      expect(boxes.left, "header starts on screen").toBeGreaterThanOrEqual(-0.5);
      expect(boxes.vw, "header ends on screen").toBeLessThanOrEqual(width + 0.5);
      if (zoom === 1 && width >= 320) {
        const wide = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(wide, "no sideways scroll at normal text").toBeLessThanOrEqual(width + 1);
      }
      expect(boxes.brand, "logo shown").not.toBeNull();
      expect(boxes.menu, "menu button shown").not.toBeNull();
      expect(overlap(boxes.brand, boxes.btn), "button overlaps logo").toBe(false);
      expect(overlap(boxes.btn, boxes.menu), "button overlaps menu").toBe(false);
      expect(overlap(boxes.brand, boxes.menu), "logo overlaps menu").toBe(false);
      for (const b of [boxes.brand, boxes.btn, boxes.menu]) if (b) expect(b.l >= boxes.left - 0.5 && b.r <= boxes.vw + 0.5, "header item outside the header").toBe(true);
      // The menu sits at the right edge, whether or not the phone button is shown (recheck 10/31 F3).
      expect(boxes.vw - boxes.menu!.r, "menu at the right edge").toBeLessThan(40);

      const menu = page.locator(".site-header .hamburger");
      await menu.click();
      await expect(page.locator(".mobile-menu")).toBeVisible();
      await menu.click();
      await expect(page.locator(".mobile-menu")).toBeHidden();
      await ctx.close();
    });
  }
}
