// Never send a reader to an employer's records or systems. Runs before every build.
//
// Why: founder rule 10/28/2026 - advice for laid-off or departing workers must never suggest
// accessing, copying or keeping anything from an employer's systems (access ends at once, and it
// can cost severance or final pay). Review rounds on 10/28-10/30/2026 kept finding guide lines that
// named the employer's reports, records, dashboards or systems as the source of the reader's numbers.
//
// What this is: a regression net, nothing more. Each pattern below is a phrasing that actually shipped
// on a live guide: the original 15, the Block 3 template ("the numbers are usually in those", "job tickets
// hold the numbers"), and six more found in review rounds 4-7 on 10/30/2026. It does not understand meaning, so new wording gets past it: every
// new or changed guide still gets a sentence-level read for this rule. Two attempts on 10/30 to make it
// catch new wording (1a89ed0, e6ce4d1) each failed review on legitimate sentences, so it was cut back to
// known phrasings (rule: an exception that fails review twice is dropped for the simpler design).
//
// Proof it works: severance-check.fixtures/banned.txt holds real lines that shipped and must be caught;
// legit.txt holds real live lines near the boundary that must pass. Both are checked on every run.
// A false alarm: reword the line if a clearer sentence exists; otherwise add an ALLOW entry below with the
// file, the exact text and the reason, and have the reviewer clear it.
// Usage: node scripts/severance-check.mjs [dir ...]   (default: src/content/guides)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

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
  // Block 3 template, found live on custodian and landscaping 10/30/2026 (block5-recheck6 C1, C2).
  [/\bnumbers for a strong resume are usually in those\b/i, "says the numbers are in the employer's records"],
  [/\b(hold|holds|held) the numbers for a strong resume\b/i, "says records hold the numbers"],
  // Six more phrasings that shipped and were found in review rounds 4-7 on 10/30/2026 (block5-recheck8 FIX R1).
  [/\b(use|using) (only )?(the )?figures from your own reports\b/i, "names the employer's reports as the source"],
  [/\brecords the milestones on each file\b/i, "an employer system holds the numbers"],
  [/\bsystem counts everything\b/i, "an employer system holds the numbers"],
  [/\bnumbers are already in your\b/i, "says the numbers already exist in employer records"],
  [/\brebuilt from records you saw\b/i, "names employer records as the source"],
  [/\bwrite what the (\w+ )?reports show\b/i, "names employer reports as the source"],
];

// Reviewed exceptions: [file, exact text on the line, reason]. Keep this short.
const ALLOW = [];

export function scanLine(line) {
  const found = [];
  for (const [re, why] of PATTERNS) {
    const m = line.match(re);
    if (m) found.push(`${why}: "${m[0]}"`);
  }
  return found;
}

function selfTest() {
  const read = (f) => fs.readFileSync(path.join(HERE, "severance-check.fixtures", f), "utf8").split(/\r?\n/).filter((l) => l.trim());
  const missed = read("banned.txt").filter((l) => !scanLine(l).length);
  const wrong = read("legit.txt").filter((l) => scanLine(l).length);
  if (missed.length || wrong.length) {
    console.error("severance-check: the guard itself is broken.");
    for (const l of missed) console.error(`  not caught (banned.txt): ${l.slice(0, 160)}`);
    for (const l of wrong) console.error(`  wrongly caught (legit.txt): ${l.slice(0, 160)}  -> ${scanLine(l).join("; ")}`);
    process.exit(1);
  }
}

function main() {
  selfTest();
  const dirs = process.argv.length > 2 ? process.argv.slice(2).map((d) => path.resolve(d)) : [path.join(ROOT, "src", "content", "guides")];
  const hits = [];
  let files = 0;
  for (const dir of dirs) {
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".md"))) {
      files++;
      fs.readFileSync(path.join(dir, name), "utf8").split(/\r?\n/).forEach((line, i) => {
        if (ALLOW.some(([f, text]) => f === name && line.includes(text))) return;
        const found = scanLine(line);
        if (found.length) hits.push(`${name}:${i + 1}  ${found.join("; ")}`);
      });
    }
  }
  if (hits.length) {
    console.error(`severance-check: ${hits.length} line(s) send a reader to an employer's records or systems (founder rule 10/28/2026).`);
    console.error("Rewrite each to use what the person knows from their own work, and never to copy anything out of an employer's systems.");
    console.error("If a line is a skill, a warning, a public lookup, or a request to HR for the person's own records, it may be a false alarm: add a reviewed ALLOW entry with the reason.\n");
    for (const h of hits) console.error("  " + h);
    process.exit(1);
  }
  console.log(`severance-check: ok (${files} guides; guard self-test passed)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
