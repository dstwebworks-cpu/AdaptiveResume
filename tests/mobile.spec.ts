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

});
