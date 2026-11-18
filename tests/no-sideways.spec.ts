import { test, expect } from "@playwright/test";

/**
 * Site review F1 to F3 (11/18/2026): body text now grows with the visitor's text-size setting, and at 200% text every page
 * scrolled sideways at tablet widths (the footer's Legal column ran off the screen), /nurses/, /veterans/ and /guides/ did on
 * phones, and the home page's Buy now button pushed the headline off the screen ("You've earned mor"). The legal pages and the
 * home page already did on phones on live. No page may scroll sideways at any of these widths, at normal or 200% text.
 * A phone browser widens its layout to fit wide content, so the page is measured against the screen width itself. A layout can
 * also hide the fault by squeezing a column until its words spill out of it, so no block of text may be wider inside than its box.
 */
// Re-check R9 (11/18/2026): the ad landing pages and the other entry pages are measured too.
const PAGES = ["/", "/guides/icu-nurse-resume/", "/nurses/", "/veterans/", "/guides/", "/business/", "/privacy/", "/terms/", "/disclaimer/", "/acceptable-use/", "/resume-writing-service/", "/rewrite-my-resume/", "/update-my-resume/", "/resume-editing-service/", "/resume-makeover/", "/fix/", "/career-change/", "/demo/", "/laid-off/"];
const WIDTHS = [320, 390, 768, 900, 1440];

for (const path of PAGES) {
  for (const zoom of [1, 2]) {
    test(`no sideways scroll on ${path} at ${zoom * 100}% text`, async ({ browser }) => {
      const wide: string[] = [];
      for (const width of WIDTHS) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 500, hasTouch: width < 500 });
        const page = await ctx.newPage();
        await page.goto(path);
        if (zoom !== 1) await page.addStyleTag({ content: `html{font-size:${zoom * 100}% !important}` });
        await page.waitForTimeout(100);
        const r = await page.evaluate((w) => {
          const over = Math.max(document.documentElement.scrollWidth, window.innerWidth) - w;
          if (over <= 0) return { over, what: "" };
          const offender = [...document.querySelectorAll("body *")].map((e) => ({ e, r: e.getBoundingClientRect().right }))
            .filter((x) => x.r > w + 1).sort((a, b) => b.r - a.r)[0];
          return { over, what: offender ? `${offender.e.tagName.toLowerCase()} "${(offender.e.textContent || "").trim().slice(0, 40)}"` : "" };
        }, width);
        if (r.over > 0) wide.push(`${width} px: ${r.over} px too wide (${r.what})`);
        const spill = await page.evaluate(() => [...document.querySelectorAll("main p, main li, main h1, main h2, main h3, main .btn, .site-footer a, .site-footer h4, .site-footer p, .site-header a")]
          .filter((e) => { const el = e as HTMLElement; if (!el.offsetParent || getComputedStyle(el).display === "inline") return false;
            let a = el.parentElement; while (a) { const ox = getComputedStyle(a).overflowX; if (ox === "auto" || ox === "scroll") return false; a = a.parentElement; }
            return el.scrollWidth > el.clientWidth + 1; })
          .slice(0, 3).map((e) => `${e.tagName.toLowerCase()} "${(e.textContent || "").trim().slice(0, 30)}" (${(e as HTMLElement).scrollWidth} in ${(e as HTMLElement).clientWidth})`));
        if (spill.length) wide.push(`${width} px: text wider than its box: ${spill.join(", ")}`);
        await ctx.close();
      }
      expect(wide, wide.join(" | ")).toEqual([]);
    });
  }
}
