import { test, expect } from "@playwright/test";

/**
 * Founder 11/17/2026: "at least 10 fonts sizes and families, on one page. It looks like Ai garbage and not like a
 * professionally built, highly competitive website." The live home page showed 22 text sizes at 1440 wide and 23 at 390,
 * in four weights. Every page now uses one family, at most the six sizes of the scale in src/styles/global.css, and the
 * weights 400, 700 and 800. scripts/type-scale-check.mjs checks the source; this checks what a visitor actually sees,
 * including browser defaults (form fields, small, sup) that the source check cannot read.
 */
// Site review F5 (11/18/2026): every kind of page, at normal and 200% text (it measured 4 pages at normal text only).
const PAGES = ["/", "/guides/military-to-civilian-resume/", "/guides/", "/nurses/", "/veterans/", "/business/", "/resume-writing-service/",
  "/resume-editing-service/", "/resume-makeover/", "/rewrite-my-resume/", "/update-my-resume/", "/fix/", "/career-change/", "/laid-off/", "/demo/", "/privacy/"];

for (const path of PAGES) {
  for (const [width, height, zoom] of [[1440, 900, 1], [390, 844, 1], [390, 844, 2]] as const) {
    test(`type scale on ${path} at ${width} wide, ${zoom * 100}% text`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 500, hasTouch: width < 500 });
      const page = await ctx.newPage();
      await page.goto(path);
      if (zoom !== 1) await page.addStyleTag({ content: `html{font-size:${zoom * 100}% !important}` });
      const r = await page.evaluate(() => {
        // The six token sizes as this browser computes them at this width.
        const probe = document.createElement("span"); document.body.appendChild(probe);
        const tokens = ["small", "body", "lead", "h3", "h2", "h1"].map((t) => { probe.style.fontSize = `var(--fs-${t})`; return getComputedStyle(probe).fontSize; });
        probe.remove();
        const sizes = new Map<string, string>(), weights = new Map<string, string>(), families = new Set<string>();
        document.querySelectorAll("body *").forEach((e) => {
          const el = e as HTMLElement;
          if (!el.offsetParent && getComputedStyle(el).position !== "fixed") return;
          if (el.closest("svg")) return;
          // The logo (the "AR" square and the wordmark) keeps its own fixed size; scripts/type-scale-check.mjs limits those tokens to it.
          if (el.closest(".brand")) return;
          if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) return;
          const c = getComputedStyle(el), what = `${el.tagName.toLowerCase()} "${el.textContent!.trim().slice(0, 40)}"`;
          if (!sizes.has(c.fontSize)) sizes.set(c.fontSize, what);
          if (!weights.has(c.fontWeight)) weights.set(c.fontWeight, what);
          families.add(c.fontFamily);
        });
        return { tokens, sizes: [...sizes], weights: [...weights], families: [...families] };
      });
      const off = r.sizes.filter(([s]) => !r.tokens.includes(s)).map(([s, w]) => `${s} ${w}`);
      expect(off, `text sizes outside the scale (${r.tokens.join(", ")}): ${off.join(" | ")}`).toEqual([]);
      expect(r.sizes.length, `distinct sizes: ${r.sizes.map(([s]) => s).join(", ")}`).toBeLessThanOrEqual(6);
      const heavy = r.weights.filter(([w]) => !["400", "700", "800"].includes(w)).map(([w, x]) => `${w} ${x}`);
      expect(heavy, `weights other than 400, 700 and 800: ${heavy.join(" | ")}`).toEqual([]);
      expect(r.families, "one font family").toHaveLength(1);
      await ctx.close();
    });
  }
}
