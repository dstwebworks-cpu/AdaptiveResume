import { test, expect, type Page } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";

/**
 * MOBILE/TABLET SUITE for the marketing site. Founder directive 09/01/2026:
 * mobile is ~80% of traffic and rising; the capture form is the funnel. Every
 * signed-out marketing surface is loaded at real device widths and checked for:
 *   1. NO horizontal overflow (document.scrollWidth > client width = unwrapped
 *      text or a too-wide element — the automated signature of a broken layout).
 *   2. Zero JS exceptions.
 *   3. On the capture pages: the email field + submit button are visible and are
 *      real tap targets (>=44px, the Apple/WCAG floor) — a cramped or clipped
 *      form on a phone is the silent conversion killer this suite exists to catch.
 */

const VIEWPORTS = [
  { name: "small-phone", width: 360, height: 800 },  // compact Android
  { name: "phone", width: 390, height: 844 },        // iPhone class
  { name: "tablet", width: 768, height: 1024 },      // iPad class
] as const;

// Every signed-out marketing surface — overflow + JS-error checked on ALL.
const PAGES = [
  { path: "/", label: "home" },
  { path: "/demo/", label: "demo" },
  { path: "/fix/", label: "fix" },
  { path: "/career-change/", label: "career-change" },
  { path: "/business/", label: "business" },
  { path: "/guides/", label: "guides index" },
  { path: "/guides/emt-resume/", label: "guide (emt)" },
  // Wave 4 (09/02): five service landing pages + one of the five new guides.
  { path: "/resume-writing-service/", label: "resume-writing-service" },
  { path: "/rewrite-my-resume/", label: "rewrite-my-resume" },
  { path: "/update-my-resume/", label: "update-my-resume" },
  { path: "/resume-makeover/", label: "resume-makeover" },
  { path: "/nurses/", label: "nurses" },
  // Wave 8 (09/09): editing-service landing page + one of the three new guides.
  { path: "/resume-editing-service/", label: "resume-editing-service" },
  { path: "/veterans/", label: "veterans" },
  { path: "/guides/soc-analyst-resume/", label: "guide (soc-analyst)" },
  { path: "/guides/warehouse-supervisor-resume/", label: "guide (warehouse-supervisor)" },
  { path: "/terms/", label: "terms" },
  { path: "/privacy/", label: "privacy" },
  { path: "/disclaimer/", label: "disclaimer" },
  { path: "/acceptable-use/", label: "acceptable-use" },
] as const;

// Pages whose primary CTA is the email-capture form (the revenue funnel).
const CAPTURE_PAGES = [
  { path: "/", label: "home hero" },
  { path: "/fix/", label: "fix" },
  { path: "/career-change/", label: "career-change" },
  { path: "/resume-writing-service/", label: "resume-writing-service" },
  { path: "/rewrite-my-resume/", label: "rewrite-my-resume" },
  { path: "/update-my-resume/", label: "update-my-resume" },
  { path: "/resume-makeover/", label: "resume-makeover" },
  { path: "/nurses/", label: "nurses" },
  { path: "/resume-editing-service/", label: "resume-editing-service" },
  { path: "/veterans/", label: "veterans" },
] as const;

function trapPageErrors(page: Page, errors: string[]) {
  page.on("pageerror", (e) => errors.push(String(e)));
}

/** Fails when anything renders wider than the screen. 1px subpixel tolerance. */
async function expectNoSideScroll(page: Page, label: string) {
  const m = await page.evaluate(() => {
    const doc = document.scrollingElement ?? document.documentElement;
    return { scrollW: doc.scrollWidth, clientW: doc.clientWidth };
  });
  expect(
    m.scrollW,
    `${label}: horizontal overflow — ${m.scrollW - m.clientW}px wider than the screen`,
  ).toBeLessThanOrEqual(m.clientW + 1);
}

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const p of PAGES) {
      test(`${p.label} fits the screen with no JS errors`, async ({ page }) => {
        const errors: string[] = [];
        trapPageErrors(page, errors);
        const resp = await page.goto(p.path);
        expect(resp?.status() ?? 0, `${p.label} HTTP status`).toBeLessThan(400);
        await expectNoSideScroll(page, p.label);
        expect(errors, `${p.label} JS errors: ${errors.join(" | ")}`).toHaveLength(0);
      });
    }

    for (const p of CAPTURE_PAGES) {
      test(`${p.label} capture form is visible and tappable`, async ({ page }) => {
        await page.goto(p.path);
        const form = page.locator("form.capture-form").first();
        await expect(form, `${p.label}: capture form present`).toBeVisible();

        const email = form.locator('input[type="email"]');
        const submit = form.locator('button[type="submit"]');
        await expect(email, `${p.label}: email field visible`).toBeVisible();
        await expect(submit, `${p.label}: submit button visible`).toBeVisible();

        const eb = await email.boundingBox();
        const sb = await submit.boundingBox();
        expect(eb, `${p.label}: email has a box`).not.toBeNull();
        expect(sb, `${p.label}: submit has a box`).not.toBeNull();
        // Tap-target floor (Apple/WCAG 2.5.5): 44px.
        expect(eb!.height, `${p.label}: email tap height`).toBeGreaterThanOrEqual(44);
        expect(sb!.height, `${p.label}: submit tap height`).toBeGreaterThanOrEqual(44);
        // The email field must not be clipped to a sliver or pushed off-screen.
        expect(eb!.width, `${p.label}: email width sane`).toBeGreaterThanOrEqual(180);
        expect(eb!.x, `${p.label}: email starts on-screen`).toBeGreaterThanOrEqual(0);
      });
    }

    // The demo must actually RUN client-side (no server), and reveal the post-demo
    // capture form — the free-value-first path. Proves it works, not just renders.
    test("demo runs end-to-end and reveals the capture form", async ({ page }) => {
      const errors: string[] = [];
      trapPageErrors(page, errors);
      await page.goto("/demo/");
      await expect(page.locator("#review")).toBeVisible();          // default profile preselected
      await page.locator(".pick-add").first().click();              // keep a finding
      await page.getByRole("button", { name: /Build the sample resume/ }).click();
      await expect(page.locator("#built")).toBeVisible();           // sample build appears
      await expect(page.locator(".resume li.new").first()).toBeVisible(); // a kept (green) line landed
      await expect(page.locator('form.capture-form input[type="email"]')).toBeVisible(); // capture revealed
      await expectNoSideScroll(page, "demo built state");
      expect(errors, `demo JS errors: ${errors.join(" | ")}`).toHaveLength(0);
    });
  });
}

// Site walk 10/25/2026, loss points 9 and 10.
/** The text of word/document.xml inside a .docx (a zip), read with Node alone. */
function docxText(buf: Buffer): string {
  for (let i = 0; i + 30 < buf.length; i++) {
    if (buf.readUInt32LE(i) !== 0x04034b50) continue; // local file header
    const method = buf.readUInt16LE(i + 8), size = buf.readUInt32LE(i + 18), nameLen = buf.readUInt16LE(i + 26), extra = buf.readUInt16LE(i + 28);
    const name = buf.toString("utf8", i + 30, i + 30 + nameLen);
    if (name !== "word/document.xml") continue;
    const start = i + 30 + nameLen + extra;
    const data = buf.subarray(start, start + size);
    const xml = method === 8 ? inflateRawSync(data).toString("utf8") : data.toString("utf8");
    return xml.replace(/<[^>]+>/g, "");
  }
  throw new Error("word/document.xml not found");
}

test.describe("site walk fixes (10/26/2026)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("THE guard (loss point 9): the demo's answer buttons are full-size tap targets and show the choice", async ({ page }) => {
    await page.goto("/demo/");
    const add = page.locator(".pick-add").first();
    const box = await add.boundingBox();
    expect(box!.height, "Add this is a real tap target").toBeGreaterThanOrEqual(44);
    await add.tap();
    await expect(add).toHaveClass(/\bon\b/);
    expect(await add.evaluate((b) => getComputedStyle(b).backgroundColor), "a tapped Add this fills green").toBe("rgb(28, 122, 67)");
    await expect(page.locator(".finding").first()).toHaveCSS("border-top-color", "rgb(127, 176, 138)");
  });

  test("THE guard (site-walk review NOTE-9): a skipped demo card fades its text, never the chosen answer button", async ({ page }) => {
    await page.goto("/demo/");
    const skip = page.locator(".pick-skip").first();
    await skip.tap();
    await expect(page.locator(".finding").first()).toHaveClass(/skipped/);
    expect(await page.locator(".finding").first().evaluate((c) => getComputedStyle(c).opacity), "the card itself is not faded").toBe("1");
    expect(await page.locator(".finding .why").first().evaluate((c) => getComputedStyle(c).opacity), "the reason text fades").toBe("0.55");
  });

  for (const p of ["/rewrite-my-resume/", "/resume-writing-service/"]) {
    test(`THE guard (#5, founder yes 10/26/2026): the main button sits in the first phone screen on ${p}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 664 });
      await page.goto(p);
      const btn = await page.locator(".hero .cta-row .btn-amber").first().boundingBox();
      expect(btn!.y + btn!.height, "the main button ends inside a 664-pixel screen").toBeLessThanOrEqual(664);
      const order = await page.evaluate(() => { const h = document.querySelector(".hero")!; const kids = [...h.querySelectorAll(".cta-row, .pills, .lede")]; return kids.map((k) => k.className.split(" ")[0]); });
      expect(order, "the gray paragraph comes after the buttons and the pills").toEqual(["cta-row", "pills", "lede"]);
    });
  }

  // Founder rule 10/01/2026: never say "new line(s)"; it contradicts "we don't make anything up". The 158 uses left on the
  // site were rewritten on 10/27/2026 with the approved framing (we ask, you confirm). This keeps them from coming back.
  test("THE guard (founder rule 10/01/2026): no page, guide, template or llms.txt source says \"new line\"", async () => {
    const dirs = ["src/pages", "src/components", "src/layouts", "src/content/guides", "src/data/llms", "public/templates"];
    const files = dirs.flatMap((d) => readdirSync(d).filter((x) => /\.(astro|md|json)$/.test(x)).map((x) => join(d, x)));
    const hits = files.filter((f) => /\bnew (lines?|items?)\b/i.test(readFileSync(f, "utf8")));
    // The Word downloads too (review FIX 7, 10/27/2026): read word/document.xml out of each .docx.
    const docx = readdirSync("public/templates").filter((x) => x.endsWith(".docx")).map((x) => join("public/templates", x));
    for (const d of docx) if (/\bnew (lines?|items?)\b/i.test(docxText(readFileSync(d)))) hits.push(d);
    expect(docx.length, "template Word files found").toBeGreaterThan(10);
    expect(hits, "files that say \"new line\" or \"new item\"").toEqual([]);
  });

  // Founder rule 10/25 and 10/27/2026: the resume's human readers are hiring managers and recruiters, never a vague
  // "person after it" or "person who reads it next" ("very low-value and not accurate to what we expect").
  test("THE guard (founder rule 10/27/2026): copy names hiring managers and recruiters, never a vague later reader", async () => {
    const dirs = ["src/pages", "src/components", "src/layouts", "src/content/guides", "src/data/llms"];
    const files = dirs.flatMap((d) => readdirSync(d).filter((x) => /\.(astro|md|json)$/.test(x)).map((x) => join(d, x)));
    const vague = /\b(person|people) (after it|who reads? it (next|after))\b/i;
    expect(files.filter((f) => vague.test(readFileSync(f, "utf8"))), "files with a vague later reader").toEqual([]);
  });

  // The suite builds the pre-launch site (PUBLIC_LAUNCHED unset), where these buttons do not render, so this reads the source.
  test("THE guard (loss point 10): no button sends a visitor to the account-first front door, and no line says to create an account first", async () => {
    const files = ["src/pages", "src/components", "src/layouts"].flatMap((d) => readdirSync(d).filter((x) => x.endsWith(".astro")).map((x) => join(d, x)));
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src.includes("href={appUrl}") || src.includes("href={LAUNCHED ? appUrl :"), `${f}: a button points at the bare app address`).toBe(false);
      expect(/Create your account, upload/.test(src), `${f}: says to create an account before the free check`).toBe(false);
      // Site-walk review FIX-C: /?start=base and /?start=targeted are the after-payment landings and can start a review with no payment.
      expect(src.includes("start=base") || src.includes("start=targeted"), `${f}: a button uses the after-payment link`).toBe(false);
      // Site-walk review NOTE-11: "free" is never followed straight by the review; the account and the build are named first.
      expect(src.includes("with no sign-up. Then we'll"), `${f}: the free check runs straight into the paid review`).toBe(false);
    }
  });

  // Founder 11/17/2026: "The goal is ALWAYS PROFIT" and "Buy now should only offer the two purchase options". A button that
  // offers a purchase goes to the app's buy page, never to the free check, and a buy link names only one of the two products.
  // Site review F5 (11/18/2026): every source file is read (the guide template included), links written as plain strings
  // too, a /buy link is never labeled as the free check, and on the home page and in the header the free check is a text
  // link, never a button (the founder's complaint: the amber "Check my resume free" button led the page).
  test("THE guard (buy first, founder 11/17/2026): buy buttons go to /buy, never to the free check, and name only the two products", async () => {
    const files: string[] = [];
    const walk = (d: string) => { for (const x of readdirSync(d, { withFileTypes: true })) { const p = join(d, x.name); if (x.isDirectory()) walk(p); else if (/\.(astro|md|mdx|ts|tsx|js)$/.test(x.name)) files.push(p); } };
    ["src"].forEach(walk);
    // A purchase action starts with Buy or Get ("See what the $29 build includes" is information, not a purchase).
    const buyLabel = /(^|['"{>\s])(Buy\b|Get (your resume build|the AR Pass|the \$29|my resume build))/;
    const freeLabel = /\bfree\b|\bcheck\b/i;
    let buyButtons = 0;
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      const leadPage = /src[\\/](pages[\\/]index\.astro|components[\\/]Header\.astro)$/.test(f);
      for (const m of src.matchAll(/<a\b([^>]*?)href=(?:\{([\s\S]*?)\}(?=[\s>])|"([^"]*)"|'([^']*)')([^>]*)>([\s\S]*?)<\/a>/g)) {
        const attrs = m[1] + m[5], href = m[2] ?? m[3] ?? m[4] ?? "", label = m[6];
        const short = label.replace(/\s+/g, " ").trim().slice(0, 60);
        if (buyLabel.test(label)) {
          buyButtons++;
          expect(href.includes("start=check"), `${f}: buy button "${short}" points at the free check`).toBe(false);
          expect(href.includes("/buy"), `${f}: buy button "${short}" does not go to /buy`).toBe(true);
        }
        if (href.includes("/buy")) expect(freeLabel.test(label.replace(/Buy/g, "")), `${f}: a /buy link labeled as the free check: "${short}"`).toBe(false);
        if (leadPage && href.includes("start=check")) expect(/class=["'{][^"'}]*\bbtn\b/.test(attrs), `${f}: the free check is a button ("${short}"); on the home page and in the header it is a text link`).toBe(false);
      }
      for (const m of src.matchAll(/\/buy\?([^'"`}\s<]*)/g)) expect(m[1], `${f}: a /buy link with an unknown choice`).toMatch(/^pick=(base|targeted)$/);
    }
    // Option C (founder 11/20/2026): the home page keeps one Buy now (the hero) plus the two price cards; the repeated Buy now
    // buttons under "Get started" and "For job seekers" are gone. Header: desktop, phone and menu.
    expect(buyButtons, "buy buttons found (home hero, both price cards, header desktop, phone and menu)").toBeGreaterThanOrEqual(6);
  });

  // As the visitor sees it (launch builds only): the home page's first button and the header button are Buy now to /buy, and
  // no button on the home page goes to the free check.
  test("the home page leads with Buy now, and the free check is never a button there", async ({ page }) => {
    await page.goto("/");
    const r = await page.evaluate(() => {
      const shown = (e: Element) => !!(e as HTMLElement).offsetParent;
      const btns = [...document.querySelectorAll("a.btn")].filter(shown) as HTMLAnchorElement[];
      const hero = [...document.querySelectorAll("main a.btn")].filter(shown)[0] as HTMLAnchorElement | undefined;
      const header = [...document.querySelectorAll(".site-header a.btn")].filter(shown)[0] as HTMLAnchorElement | undefined;
      return { launched: btns.some((a) => a.href.includes("/buy")), hero: hero ? [hero.textContent!.trim(), hero.href] : null, header: header ? [header.textContent!.trim(), header.href] : null,
        freeButtons: btns.filter((a) => a.href.includes("start=check")).map((a) => a.textContent!.trim()) };
    });
    test.skip(!r.launched, "pre-launch build: the page offers the launch list, not a purchase");
    expect(r.hero, "first button on the page").not.toBeNull();
    expect(r.hero![1], `first button "${r.hero![0]}" goes to /buy`).toMatch(/\/buy$/);
    // Option C (founder 11/20/2026): at the top of the home page the header shows Sign in, not a second Buy now.
    expect(r.header, "no header button while the hero's Buy now is on screen").toBeNull();
    expect(r.freeButtons, "free-check buttons on the home page").toEqual([]);
  });

});
