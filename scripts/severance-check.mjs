// Never send a reader to an employer's records or systems. Runs before every build.
//
// Why: founder rule 10/28/2026 - advice for laid-off or departing workers must never suggest
// accessing, copying or keeping anything from an employer's systems (access ends at once, and it
// can cost severance or final pay). On 10/30/2026 four review rounds kept finding guide lines that
// named the employer's reports, records, dashboards or systems as the source of the reader's
// numbers ("from your production reports, not memory", "the raw count from your SIEM",
// "your ATS history", "find on your repair orders"). Each pattern below is one of those phrasings.
// A person's own memory and what they know from their own work are valid sources.
// Naming a system as a skill ("Name your charting system: Epic") is fine and is not matched.
// Prints file:line for every hit and exits 1 so the build stops. Usage: node scripts/severance-check.mjs [dir]
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), "..");
const DIR = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "src", "content", "guides");

const REC = String.raw`(reports?|reporting|records?|systems?|dashboards?|logs?|scanner|route app|charting|visit notes|post orders|accession counts|assignment sheets|competency checkoffs)`;
const PATTERNS = [
  [/\bnot (from )?memory\b/i, "tells the reader not to use memory"],
  [new RegExp(String.raw`\b(fill|filled) (the|every|each) brackets? from your (own |real )?(\w+ )?${REC}\b`, "i"), "fills brackets from employer records"],
  [new RegExp(String.raw`\bfrom your (real |own )?(production|pipeline|shift|quality|case|lab's quality|real) ${REC}\b`, "i"), "names employer reports as the source"],
  [new RegExp(String.raw`\b(comes?|came) from (the|your|what your) [^.]{0,60}\b${REC}\b`, "i"), "says the numbers come from employer records"],
  [new RegExp(String.raw`\b(comes?|came) from what your \w+ already (tracks|keeps)\b`, "i"), "says the numbers come from what the employer tracks"],
  [/\bnumbers? (the|your) (kitchen|warehouse|plant|company|shop|store|unit|center|department) already (tracks|keeps|runs)\b/i, "the employer's tracked numbers as the source"],
  [/\b(the|your) (kitchen|warehouse|plant|company|shop|store|unit|center|department)'s own numbers\b/i, "the employer's own numbers as the source"],
  [/\balready (exist|in (those|the|your) systems?)\b/i, "says the numbers already exist in employer systems"],
  [new RegExp(String.raw`\bfind (it |them )?on [^.]{0,80}\b(repair orders|management system|${REC})\b`, "i"), "tells the reader to find numbers in employer records"],
  [/\byour real (visit notes|charting|load records|post orders|accession counts|assignment sheets|competency checkoffs|reports|reporting)\b/i, "names employer records as the source"],
  [/\buse its figures?\b/i, "uses a system's figures as the source"],
  [/\bATS history\b/i, "names the employer's ATS as a source"],
  [/\b(raw count|the count) from (your|the) \w+/i, "a count pulled from an employer system"],
  [new RegExp(String.raw`\bfrom reports a [a-z ]+ already runs\b`, "i"), "reports the employer runs as the source"],
  [new RegExp(String.raw`\bwith the system they came from\b`, "i"), "numbers tied to the employer system they came from"],
];

const hits = [];
for (const name of fs.readdirSync(DIR).filter((n) => n.endsWith(".md"))) {
  const lines = fs.readFileSync(path.join(DIR, name), "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const [re, why] of PATTERNS) {
      const m = line.match(re);
      if (m) hits.push(`${name}:${i + 1}  ${why}: "${m[0]}"`);
    }
  });
}
if (hits.length) {
  console.error(`severance-check: ${hits.length} line(s) send a reader to an employer's records or systems (founder rule 10/28/2026).`);
  console.error("Rewrite each to use what the person knows from their own work, and never to copy anything out of an employer's systems.\n");
  for (const h of hits) console.error("  " + h);
  process.exit(1);
}
console.log(`severance-check: ok (${fs.readdirSync(DIR).filter((n) => n.endsWith(".md")).length} guides)`);
