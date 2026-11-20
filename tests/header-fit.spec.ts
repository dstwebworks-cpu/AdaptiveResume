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
      // Founder 11/14/2026: the brand name is always shown, never only the "AR" square.
      await expect(page.locator(".site-header .brand .word"), "brand name shown").toBeVisible();
      expect(boxes.menu, "menu button shown").not.toBeNull();
      // Review of 11/14/2026: the logo and the menu share the first row, and neither touches the top edge of the header.
      expect(boxes.menu!.t, "menu on the logo's row").toBeLessThan(boxes.brand!.b);
      const top = await page.evaluate(() => (document.querySelector(".site-header .bar") as HTMLElement).getBoundingClientRect().top);
      expect(Math.min(boxes.menu!.t, boxes.brand!.t) - top, "space above the first row").toBeGreaterThanOrEqual(6);
      // Founder 11/14/2026 ("we can tighten it slightly to 113 px"): the phone bar is at most 112px (113px with the header's border).
      if (zoom === 1 && width >= 320 && width <= 430) {
        const h = await page.evaluate(() => (document.querySelector(".site-header .bar") as HTMLElement).getBoundingClientRect().height);
        expect(h, "phone header height").toBeLessThanOrEqual(112.5);
      }
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

// Re-check of 11/14/2026 (FIX E): the phone changes leave the desktop header on one row at its live height.
// Limits sit just above the live height of the header bar (.bar, without the header's 1px bottom border), measured by
// re-check 4 (11/14/2026): 71.19px from 900 to 1060 wide and 64px above that. A bar that grows even a little past live fails.
for (const [width, maxH] of [[900, 71.5], [1024, 71.5], [1280, 64.5]] as const) {
  test(`desktop header stays on one row at ${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/guides/cna-resume/");
    const m = await page.evaluate(() => {
      const r = (s: string) => { const e = document.querySelector(s) as HTMLElement | null; return e && getComputedStyle(e).display !== "none" ? e.getBoundingClientRect() : null; };
      return { bar: r(".site-header .bar"), brand: r(".site-header .brand"), cta: r(".site-header a.btn.cta-desktop") };
    });
    expect(m.bar!.height, "desktop header height").toBeLessThanOrEqual(maxH);
    if (m.cta) expect(m.cta.top, "desktop button on the logo row").toBeLessThan(m.brand!.bottom);
    await ctx.close();
  });
}

// Site review 11/18/2026 (N1): with 200% text the desktop row ran 13 to 97 px off screen at 940 to 1080 px (and the 11/14 short-logo
// rule only covered 900 to 920). The header now keeps the menu layout until the whole desktop row fits, decided by its own width in
// rem. At these desktop widths with 200% text: the menu layout, with the name, the Buy now button and the menu all inside the bar,
// not overlapping, and nothing past the right edge.
for (const width of [900, 920, 1024, 1080, 1280, 1440]) {
  test(`desktop header at ${width}px, 200% text, keeps everything inside the bar`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/guides/cna-resume/");
    await page.addStyleTag({ content: "html{font-size:200% !important}" });
    await page.waitForTimeout(100);
    const r = await page.evaluate(() => {
      const box = (sel: string) => { const e = document.querySelector(sel) as HTMLElement | null; if (!e || getComputedStyle(e).display === "none") return null;
        const q = e.getBoundingClientRect(); return q.width ? { l: q.left, r: q.right, t: q.top, b: q.bottom } : null; };
      const bar = (document.querySelector(".site-header .bar") as HTMLElement).getBoundingClientRect();
      const right = Math.max(...[...document.querySelectorAll(".site-header .bar > *")].map((e) => { const q = (e as HTMLElement).getBoundingClientRect(); return q.width ? q.right : 0; }));
      return { brand: box(".site-header .brand"), word: box(".site-header .brand .word"), menu: box(".site-header .hamburger"), btn: box(".site-header .cta-phone"), right, barRight: bar.right, vw: window.innerWidth };
    });
    expect(r.menu, "menu button shown").not.toBeNull();
    expect(r.word, "brand name shown").not.toBeNull();
    expect(r.right, "nothing past the bar's right edge").toBeLessThanOrEqual(r.barRight + 0.5);
    expect(r.barRight, "bar inside the screen").toBeLessThanOrEqual(r.vw + 0.5);
    type B = { l: number; r: number; t: number; b: number } | null;
    const overlap = (a: B, z: B) => !!a && !!z && a.l < z.r - 0.5 && z.l < a.r - 0.5 && a.t < z.b - 0.5 && z.t < a.b - 0.5;
    expect(overlap(r.brand, r.menu) || overlap(r.brand, r.btn) || overlap(r.btn, r.menu), "name, button and menu do not overlap").toBe(false);
    await ctx.close();
  });
}

/**
 * Site re-check R4 (11/18/2026): at 150% text from 1350 px and 200% text from 1800 px every header label wrapped ("Buy / now"),
 * because the desktop row was switched on by the window's width while the bar is capped at 1120 px. Every visible header
 * label, button and link sits on one line, at desktop widths and text sizes, and the bar stays on screen.
 */
for (const zoom of [1, 1.25, 1.5, 2]) {
  for (const width of [900, 1280, 1440, 1800, 2400]) {
    test(`header labels never wrap at ${width}px, ${zoom * 100}% text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      if (zoom !== 1) await page.addStyleTag({ content: `html{font-size:${zoom * 100}% !important}` });
      await page.waitForTimeout(100);
      const r = await page.evaluate(`(() => {
        const out = [];
        document.querySelectorAll(".site-header .bar a:not(.brand), .site-header .bar button").forEach((e) => {
          if (!e.offsetParent || !e.textContent.trim()) return;
          const g = document.createRange(); g.selectNodeContents(e);
          const tops = new Set([...g.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top)));
          if (tops.size > 1) out.push(e.textContent.trim().replace(/\\s+/g, " "));
          const bb = document.querySelector(".site-header .bar").getBoundingClientRect(), r = e.getBoundingClientRect();
          if (r.right > bb.right + 0.5 || r.left < bb.left - 0.5) out.push("outside the bar: " + e.textContent.trim());
        });
        const bar = document.querySelector(".site-header .bar").getBoundingClientRect();
        return { wrapped: out, right: bar.right };
      })()`) as { wrapped: string[]; right: number };
      expect(r.wrapped, `labels on two lines: ${r.wrapped.join(" | ")}`).toHaveLength(0);
      expect(r.right, "header bar on screen").toBeLessThanOrEqual(width + 0.5);
    });
  }
}

/** Re-check 2 H1 (11/18/2026): a menu opened on a narrow screen closes when the screen turns or widens into the desktop row. */
test("an open menu closes when the screen widens into the desktop row", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await page.locator(".site-header .hamburger").click();
  await expect(page.locator(".site-header")).toHaveClass(/menu-open/);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator(".site-header")).not.toHaveClass(/menu-open/);
  await expect(page.locator(".site-header .mobile-menu")).toBeHidden();
  expect(await page.locator(".site-header").evaluate((h) => h.getBoundingClientRect().height), "one-row header height").toBeLessThan(110);
});

/** Re-check 2 H2/H3: the desktop row shows from 56.25rem of bar (about 944 px at normal text). Part of the row is fixed
 *  pixels, so one rem switch point is cautious at 120% to 130% text: the row would fit there (re-check 3 measured 986 px
 *  needed at 120% against 1076 px of bar), but the menu layout is used instead. Nothing overflows either way. */
for (const [width, zoom] of [[1024, 1], [1280, 1], [1920, 1]] as const) {
  test(`the desktop row shows at ${width}px, ${zoom * 100}% text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    if (zoom !== 1) await page.addStyleTag({ content: `html{font-size:${zoom * 100}% !important}` });
    await page.waitForTimeout(100);
    await expect(page.locator(".site-header .nav.desktop")).toBeVisible();
    await expect(page.locator(".site-header .hamburger")).toBeHidden();
  });
}

/** Re-check 1 R10 and re-check 2 H4: the page loads only the three Inter weights the type scale uses. */
test("only the 400, 700 and 800 font weights are loaded", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page.locator('link[href*="fonts.googleapis.com/css2"]').evaluateAll((ls) => ls.map((l) => (l as HTMLLinkElement).href));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) expect(decodeURIComponent(h)).toContain("wght@400;700;800&");
});

/** Re-check 3 H1b (11/18/2026): a menu opened at large text closes when text is set back to normal on a wide screen. */
for (const [width, height, from, to] of [[1440, 900, 1.25, 1], [1366, 768, 1.25, 1], [1920, 1080, 1.5, 1], [1440, 900, 1.2, 1.1]] as const) {
  test(`an open menu closes when text goes from ${Math.round(from * 100)}% to ${Math.round(to * 100)}% at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const size = await page.addStyleTag({ content: `html{font-size:${from * 100}% !important}` });
    await page.locator(".site-header .hamburger").click();
    await expect(page.locator(".site-header")).toHaveClass(/menu-open/);
    await size.evaluate((el) => el.remove());
    if (to !== 1) await page.addStyleTag({ content: `html{font-size:${to * 100}% !important}` });
    await expect(page.locator(".site-header")).not.toHaveClass(/menu-open/);
    await expect(page.locator(".site-header .mobile-menu")).toBeHidden();
    await expect(page.locator(".site-header .nav.desktop")).toBeVisible();
  });
}

/** Re-check 3 F2c: "no auto-renewal." stays together in the hero line (launch build only). */
test("the hero price line keeps \"no auto-renewal.\" together", async ({ page }) => {
  await page.goto("/");
  const line = page.locator(".step-line", { hasText: "auto-renewal" });
  test.skip((await line.count()) === 0, "the price line shows only on the launch build");
  expect(await line.first().textContent()).toContain("no\u00a0auto-renewal.");
});

// Option C (founder 11/20/2026: "there are two buy now buttons within 1 scroll of each other"): on the home page the header shows
// Sign in until the hero's Buy now has scrolled away, then Buy now, and no header Buy now while the prices are on screen.
for (const width of [360, 390, 1280]) {
  test(`home page: one Buy now on screen at a time at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    test.skip((await page.locator("[data-hero-buy]").count()) === 0, "pre-launch build: no Buy now on the page");
    const headerBuy = () => page.evaluate(() => [...document.querySelectorAll(".site-header .hdr-buy")].some((e) => (e as HTMLElement).offsetParent !== null && getComputedStyle(e).display !== "none"));
    const signIn = () => page.evaluate(() => [...document.querySelectorAll(".site-header .signin")].some((e) => (e as HTMLElement).offsetParent !== null && getComputedStyle(e).display !== "none"));
    expect(await headerBuy(), "no header Buy now at the top").toBe(false);
    expect(await signIn(), "Sign in shows at the top").toBe(true);
    // Where the hero's Buy now has scrolled away and the prices are not yet on screen (if this screen size has such a spot).
    const gap = await page.evaluate(() => {
      const hero = (document.querySelector("[data-hero-buy]") as HTMLElement).getBoundingClientRect();
      const prices = (document.querySelector("#pricing") as HTMLElement).getBoundingClientRect();
      const y = scrollY + hero.bottom + 8;
      return scrollY + prices.top - 64 > y + innerHeight ? y : null;
    });
    if (gap !== null) {
      await page.evaluate((y) => scrollTo(0, y), gap);
      await expect.poll(headerBuy, { message: "header Buy now once the hero's has scrolled away" }).toBe(true);
    }
    await page.evaluate(() => scrollTo(0, (document.querySelector("#pricing") as HTMLElement).offsetTop));
    await expect.poll(headerBuy, { message: "no header Buy now while the prices are on screen" }).toBe(false);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(headerBuy, { message: "header Buy now again below the prices" }).toBe(true);
  });
}

// Homepage review FIX 7 (11/20/2026): scroll the whole home page in steps at phone, tablet and desktop widths, at normal and
// larger text. At every step, at most one "Buy now" is on screen (the founder's complaint was two within one scroll), and a
// purchase button is always on screen or in the header (FIX 3 and 4: never a stretch with nothing to tap).
for (const [width, zoom] of [[320, 1], [360, 1], [390, 1], [390, 1.25], [768, 1], [1440, 1]] as const) {
  test(`home page at ${width}px, ${zoom * 100}% text: never two Buy now buttons, always one to tap`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: width < 700, hasTouch: width < 700 });
    const page = await ctx.newPage();
    await page.goto("/");
    test.skip((await page.locator("[data-hero-buy]").count()) === 0, "pre-launch build: no Buy now on the page");
    if (zoom !== 1) await page.evaluate((z) => { document.documentElement.style.fontSize = `${z * 100}%`; }, zoom);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const bad: string[] = [];
    for (let y = 0; y < total; y += 120) {
      await page.evaluate((yy) => scrollTo(0, yy), y);
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => {
        // Under the see-through sticky header is not on screen; the header's own links count where they show.
        const hh = (document.querySelector(".site-header") as HTMLElement).getBoundingClientRect().bottom;
        const onScreen = (e: Element) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.display !== "none" && cs.visibility !== "hidden" && b.width > 0 && b.height > 0 && b.bottom > hh && b.top < innerHeight; };
        const inHeader = (e: Element) => !!e.closest(".site-header");
        const all = [...document.querySelectorAll("a")].filter((a) => (inHeader(a) ? getComputedStyle(a).display !== "none" && (a as HTMLElement).offsetHeight > 0 : onScreen(a)));
        const buyNow = all.filter((a) => a.textContent!.trim() === "Buy now").length;
        const purchase = all.filter((a) => /\/buy(\?|$)/.test(a.href) && a.classList.contains("btn")).length;
        return { buyNow, purchase, y: scrollY };
      });
      if (r.buyNow > 1) bad.push(`${r.y}: ${r.buyNow} Buy now buttons on screen`);
      if (r.purchase === 0) bad.push(`${r.y}: no purchase button on screen`);
    }
    expect(bad).toEqual([]);
    await ctx.close();
  });
}

// Homepage review FIX 7: at normal text on common phones the header is one slim row (the two-row header was 113 px).
for (const width of [360, 375, 390, 412, 430]) {
  test(`phone header is one row at ${width}px, 100% text`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto("/guides/cna-resume/");
    const h = await page.evaluate(() => (document.querySelector(".site-header") as HTMLElement).getBoundingClientRect().height);
    expect(h, "one-row phone header height").toBeLessThan(72);
    await ctx.close();
  });
}

// Homepage re-check FIX A and FIX B (11/20/2026): at every width and text size, scrolling the home page or a guide, the header
// keeps one height (it never grows or shrinks under the reader), and it always offers one tap: Buy now, or Sign in while the
// page's own Buy now is on screen.
for (const path of ["/", "/guides/cna-resume/"]) {
  for (const [width, zoom] of [[320, 1], [360, 1.5], [390, 1.25], [390, 2], [412, 1.5], [430, 2]] as const) {
    test(`header keeps one height and offers one tap on ${path} at ${width}px, ${zoom * 100}% text`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      await page.goto(path);
      test.skip((await page.locator(".site-header .cta-phone").count()) === 0, "pre-launch build: no Buy now in the header");
      if (zoom !== 1) await page.evaluate((z) => { document.documentElement.style.fontSize = `${z * 100}%`; }, zoom);
      await page.addStyleTag({ content: "html{scroll-behavior:auto !important}" });
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      const heights = new Set<number>(), noTap: number[] = [];
      for (let y = 0; y < total; y += 150) {
        await page.evaluate((yy) => scrollTo(0, yy), y);
        await page.waitForTimeout(50);
        const r = await page.evaluate(() => {
          const h = document.querySelector(".site-header") as HTMLElement;
          const shown = (sel: string) => [...h.querySelectorAll(sel)].some((e) => getComputedStyle(e).display !== "none" && (e as HTMLElement).offsetHeight > 0);
          return { h: Math.round(h.getBoundingClientRect().height), tap: shown(".cta-phone") || shown(".signin-phone") };
        });
        heights.add(r.h);
        if (!r.tap) noTap.push(y);
      }
      expect([...heights], "header heights seen while scrolling").toHaveLength(1);
      expect(noTap, "scroll positions with neither Buy now nor Sign in in the header").toEqual([]);
      await ctx.close();
    });
  }
}

// Buy now on every guide (founder 11/20/2026): a job-seeker guide leads with Buy now in its top box, its box after the
// article and its closing card; the free check is a text link. Scrolling the whole guide, never two Buy now buttons on
// screen, and always a purchase button on screen or in the header.
for (const [width, zoom] of [[360, 1], [390, 1], [390, 1.5], [1440, 1]] as const) {
  test(`guide page at ${width}px, ${zoom * 100}% text: never two Buy now buttons, always one to tap`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: width < 700, hasTouch: width < 700 });
    const page = await ctx.newPage();
    await page.goto("/guides/cna-resume/");
    test.skip((await page.locator(".site-header .cta-phone").count()) === 0, "pre-launch build: no Buy now on the page");
    await expect(page.locator("#fd-t1 a.btn")).toHaveText("Buy now");
    await expect(page.locator("#fd-t2 a.btn")).toHaveText("Buy now");
    await expect(page.locator("#fd-end a.btn")).toHaveText("Buy now");
    for (const sel of ["#fd-t1 a.btn", "#fd-t2 a.btn", "#fd-end a.btn"]) expect(await page.locator(sel).getAttribute("href")).toMatch(/\/buy$/);
    expect(await page.locator("#fd-t1 a[href*='start=check']").getAttribute("class")).toBeNull(); // the free check is a text link
    if (zoom !== 1) await page.evaluate((z) => { document.documentElement.style.fontSize = `${z * 100}%`; }, zoom);
    await page.addStyleTag({ content: "html{scroll-behavior:auto !important}" });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const bad: string[] = [];
    for (let y = 0; y < total; y += 150) {
      await page.evaluate((yy) => scrollTo(0, yy), y);
      await page.waitForTimeout(50);
      const r = await page.evaluate(() => {
        const hh = (document.querySelector(".site-header") as HTMLElement).getBoundingClientRect().height;
        const onScreen = (e: Element) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.display !== "none" && cs.visibility !== "hidden" && b.width > 0 && b.height > 0 && b.bottom > hh && b.top < innerHeight; };
        const inHeader = (e: Element) => !!e.closest(".site-header");
        const all = [...document.querySelectorAll("a")].filter((a) => (inHeader(a) ? getComputedStyle(a).display !== "none" && (a as HTMLElement).offsetHeight > 0 : onScreen(a)));
        return { buyNow: all.filter((a) => a.textContent!.trim() === "Buy now").length, purchase: all.filter((a) => /\/buy(\?|$)/.test(a.href) && a.classList.contains("btn")).length };
      });
      if (r.buyNow > 1) bad.push(`${y}: ${r.buyNow} Buy now buttons`);
      if (r.purchase === 0) bad.push(`${y}: no purchase button`);
    }
    expect(bad).toEqual([]);
    await ctx.close();
  });
}
