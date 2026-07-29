// scripts/indexnow-ping.mjs — after each deploy, tell the IndexNow-participating
// engines (Bing, Yandex, Seznam, Naver — Bing's index also feeds DuckDuckGo, Yahoo,
// Ecosia) that our URLs changed, instead of waiting to be re-crawled. TODO item M5.
//
// URL source: the built sitemap when present (CI runs this after `astro build`),
// else the live sitemap. Pings the full URL set — at 19 pages that's well within
// IndexNow's 10,000-URL-per-call limit, and re-submitting unchanged URLs is allowed.
// The key file (public/<key>.txt) is how the endpoint verifies we own the host.
// Non-fatal by design: indexing pings must never fail a build.
import { readFileSync, existsSync } from "node:fs";

const KEY = "afcfa10ba93627a31e515051894d6f63";
const HOST = "adaptiveresume.com";

let xml;
if (existsSync("dist/sitemap-0.xml")) {
  xml = readFileSync("dist/sitemap-0.xml", "utf8");
} else {
  xml = await (await fetch(`https://${HOST}/sitemap-0.xml`)).text();
}
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) {
  console.error("IndexNow: no URLs found in sitemap — skipping ping");
  process.exit(0);
}

try {
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
    signal: AbortSignal.timeout(15000),
  });
  console.log(`IndexNow ping: HTTP ${r.status} for ${urls.length} URLs (200/202 = accepted)`);
} catch (e) {
  console.error(`IndexNow ping failed (non-fatal): ${e instanceof Error ? e.message : e}`);
}
