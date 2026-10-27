import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// llms.txt guards (10/27/2026). The hand-written file used bare paths instead of the standard "[Title](address): note"
// list and silently missed 25 guides; the build now generates it (src/lib/llms.ts). These tests read the served file.
const SITE = "https://adaptiveresume.com";
const published = readdirSync("src/content/guides")
  .filter((f) => f.endsWith(".md"))
  .filter((f) => !/^draft:\s*true/m.test(readFileSync(join("src/content/guides", f), "utf8")))
  .map((f) => f.replace(/\.md$/, ""));

test.describe("llms.txt (10/27/2026)", () => {
  test("THE guard: every published guide has a full-address, standard-format entry with its title and description", async ({ request }) => {
    const txt = await (await request.get("/llms.txt")).text();
    for (const slug of published) {
      const src = readFileSync(join("src/content/guides", slug + ".md"), "utf8");
      const title = (src.match(/^title:\s*"(.*)"\s*$/m) || [])[1];
      expect(txt, `${slug}: missing from llms.txt`).toContain(`](${SITE}/guides/${slug}/): `);
      expect(txt, `${slug}: entry does not carry the guide's own title`).toContain(`- [${title}](${SITE}/guides/${slug}/)`);
    }
    expect(txt).toContain(`## Guides by topic (${published.length} free guides`);
  });

  test("THE guard: no link line is a bare path, and every key page's note is that page's own description", async ({ request }) => {
    const txt = await (await request.get("/llms.txt")).text();
    const bare = txt.split("\n").filter((l) => /^- [^[].*: \/[a-z#]/.test(l) || / · \/[a-z]/.test(l));
    expect(bare, "bare relative-path link lines").toEqual([]);
    for (const m of txt.matchAll(/^- \[[^\]]+\]\(https:\/\/adaptiveresume\.com(\/[a-z0-9-]*\/?)\): (.*)$/gm)) {
      const [, path, note] = m;
      if (path.startsWith("/guides/") && path !== "/guides/") continue;
      const html = await (await request.get(path)).text();
      const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1]?.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
      expect(note, `${path}: llms.txt note differs from the page's meta description`).toBe(desc);
    }
  });

  test("llms-full.txt serves every published guide's text with its address", async ({ request }) => {
    const r = await request.get("/llms-full.txt");
    expect(r.status()).toBe(200);
    const txt = await r.text();
    for (const slug of published) expect(txt, `${slug}: missing from llms-full.txt`).toContain(`Address: ${SITE}/guides/${slug}/`);
  });
});
