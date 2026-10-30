// Never send a reader to an employer's records or systems. Runs before every build.
//
// Why: founder rule 10/28/2026 - advice for laid-off or departing workers must never suggest
// accessing, copying or keeping anything from an employer's systems (access ends at once, and it
// can cost severance or final pay). On 10/30/2026 five review rounds kept finding guide lines that
// named the employer's reports, records, dashboards or systems as the source of the reader's
// numbers ("from your production reports, not memory", "the raw count from your SIEM",
// "your ATS history", "find on your repair orders").
//
// What this is: a regression net. It matches the phrasings found 10/28-10/30 plus the shapes a
// reviewer wrote to test it (access and copy verbs near a record or system, "before your last day",
// "the POS shows", "already in the system"). It does NOT understand meaning, so new wording can
// still get past it: every new guide still gets a sentence-level read for this rule.
// A person's own memory, their own documents (pay stubs, offer letters) and public lookups are
// valid sources. Naming a system as a skill ("Name your charting system: Epic") is fine.
//
// Proof it works: every line in severance-check.fixtures/banned.txt must be caught and no line in
// legit.txt may be; the script checks both on every run and fails the build if either slips.
// A false positive: reword the line if a clearer sentence exists; otherwise add an ALLOW entry
// below with the file, the exact text and the reason, and have the reviewer clear it.
// Usage: node scripts/severance-check.mjs [dir ...]   (default: src/content/guides)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

// Records and systems an employer owns. Named products and acronyms count too.
const SYS = String.raw`(reports?|reporting|records?|systems?|dashboards?|scorecards?|logs?|logbooks?|spreadsheets?|software|evaluations?|ticket history|call logs?|production board|scanner|route app|charting|visit notes|post orders|repair orders|accession counts|assignment sheets|competency checkoffs|CRM|WMS|ATS|POS|EHR|EMR|CMMS|LIS|SIEM|CAD|HRIS|Salesforce|Workday|Epic|Cerner|Meditech)`;
const NUM = String.raw`(numbers?|figures?|totals?|counts?|metrics?|data|stats|milestones)`;
// Public lookups and published standards only ("the board's public lookup system", "the BLS reporting standard",
// "OSHA's formula"). Never add "your own" here: "Fill the brackets from your own reports" is exactly what the rule bans.
const SAFE = /\b(public (license )?(lookup|registry|standard)|reporting standard|OSHA's formula|BLS)\b/i;
// Copy and access instructions only count when they name something the employer holds. Generic "records" and
// "reports" are left out here: "keep a copy for your records" and "download the free O*NET report" are fine.
const HELD = String.raw`(dashboards?|scorecards?|logs?|call history|ticket history|evaluations?|spreadsheets?|production board|your (\w+ )?reports|CRM|WMS|ATS|POS|EHR|EMR|CMMS|LIS|SIEM|CAD|HRIS|Salesforce|Workday|Epic|Cerner|Meditech)`;
const COPY = String.raw`(pull|export|download|screenshot|print|email yourself|forward|save|keep a copy|copy(?!-)|grab|look up)`;
const REC = String.raw`(reports?|reporting|records?|systems?|dashboards?|logs?|scanner|route app|charting|visit notes|post orders|accession counts|assignment sheets|competency checkoffs)`;

const PATTERNS = [
  // Copying or pulling anything out of an employer's systems.
  // Only as an instruction to the reader: "Employers will pull your record" and "Never copy" pass.
  [new RegExp(String.raw`(^|, |\b(you|and|then|first) )${COPY}\b[^.]{0,60}\b${HELD}\b`, "i"), "copies or pulls from employer records"],
  [new RegExp(String.raw`\bcheck (your|the) [^.]{0,30}\b${SYS}\b[^.]{0,30}\b(for|to find)\b`, "i"), "checks employer records for numbers"],
  [/\bask (IT|your manager|the help desk) for (a copy of )?(your )?(ticket|call|sales|production|performance)\b/i, "asks the employer for system data"],
  [/\b(before (you lose access|your access ends|access ends)|while you still have access|if you still have access)\b/i, "times an action to before access ends"],
  [new RegExp(String.raw`\b(before you leave|before your last day|on your last day)\b[^.]*\b${COPY}\b|\b${COPY}\b[^.]*\b(before you leave|before your last day|on your last day)\b`, "i"), "copies something before leaving"],
  [/\bwhen you leave\b[^.]{0,40}\b(keep|copy|save|take)\b|\b(keep|copy|save|take)\b[^.]{0,40}\bwhen you leave\b/i, "keeps something when leaving"],
  // Naming an employer's records as the source of the numbers.
  [new RegExp(String.raw`\b${NUM}\b[^.]{0,40}\b(live in|lives in|are in|is in|are sitting in|sitting in|come out of|comes out of|come straight out of|comes straight out of|using|from(?! your (own )?(logbook|notes|tracker|work|memory)))\b[^.]{0,40}\b${SYS}\b`, "i"), "names employer records as the source of the numbers"],
  [new RegExp(String.raw`(?<!\b(experience|skills?) )\b(comes?|came) from (?!your (own )?(memory|work)\b)(the|your|what your) [^.]{0,60}\b${SYS}\b`, "i"), "says the numbers come from employer records"],
  [new RegExp(String.raw`\b${SYS} (has|have|holds|keeps|tracks|records|counts) (every|everything|all|each|the \w+ on)\b`, "i"), "an employer system holds the numbers"],
  // "record" is left out: a motor vehicle or clearance record is the reader's own, checked by the employer.
  [/\b(repair orders|charting|post orders|scorecards?|dashboards?|logs?|POS|CRM|WMS|EHR|EMR|SIEM) shows?\b/i, "an employer system shows the numbers"],
  [new RegExp(String.raw`\balready (exists? in|in) (the|your|those) [^.]{0,30}\b${SYS}\b`, "i"), "says the numbers already exist in employer systems"],
  [new RegExp(String.raw`\b${NUM}\b[^.]{0,40}\balready exists?\b`, "i"), "says the numbers already exist"],
  [/\b(data|numbers?|figures?) (your|the) (employer|company|manager) (collected|keeps|kept)\b/i, "the employer's own data as the source"],
  [/\b(reports?|numbers?|figures?) (your|the) (company|employer|team|unit|shop|store|plant) runs\b/i, "reports the employer runs as the source"],
  [new RegExp(String.raw`\b(numbers?|figures?) (the|your) (kitchen|warehouse|plant|company|shop|store|unit|center|department) already (tracks|keeps|runs)\b`, "i"), "the employer's tracked numbers as the source"],
  [/\b(the|your) (kitchen|warehouse|plant|company|shop|store|unit|center|department)'s own numbers\b/i, "the employer's own numbers as the source"],
  [new RegExp(String.raw`\b${SYS}\b[^.]{0,30},? not (from )?memory\b|\bnot from memory\b|\b(don't|do not|never) (rely on|use) (your )?memory\b`, "i"), "tells the reader not to use memory"],
  [new RegExp(String.raw`\b(fill|filled) (the|every|each) brackets? from your [^.]{0,30}\b${SYS}\b`, "i"), "fills brackets from employer records"],
  [new RegExp(String.raw`\bfind (it |them )?on [^.]{0,80}\b(management system|${SYS})\b`, "i"), "tells the reader to find numbers in employer records"],
  [/\byour real (visit notes|charting|load records|post orders|accession counts|assignment sheets|competency checkoffs|reports|reporting)\b/i, "names employer records as the source"],
  [/\buse its (figures?|totals?|numbers?|counts?)\b/i, "uses a system's figures as the source"],
  [/\b(hold|holds|held) the (numbers?|figures?)\b/i, "says records hold the numbers"],
  [new RegExp(String.raw`\b${NUM}\b[^.]{0,40}\b(are|is) (usually |often )?(already )?in (those|these|them)\b`, "i"), "says the numbers are in the employer's records"],
  [/\bATS history\b/i, "names the employer's ATS as a source"],
  [/\b(raw count|the count) from (your|the) (?!own\b)\w+/i, "a count pulled from an employer system"],
  [/\bwith the system they came from\b/i, "numbers tied to the employer system they came from"],
  // The original 10/30 phrasings, kept word for word so nothing they caught can slip back in.
  [new RegExp(String.raw`\b(fill|filled) (the|every|each) brackets? from your (own |real )?(\w+ )?${REC}\b`, "i"), "fills brackets from employer records"],
  [new RegExp(String.raw`\bfrom your (real |own )?(production|pipeline|shift|quality|case|lab's quality|real) ${REC}\b`, "i"), "names employer reports as the source"],
  [new RegExp(String.raw`(?<!\b(experience|skills?) )\b(comes?|came) from (?!your (own )?(memory|work)\b)(the|your|what your) [^.]{0,60}\b${REC}\b`, "i"), "says the numbers come from employer records"],
  [/\b(comes?|came) from what your \w+ already (tracks|keeps)\b/i, "says the numbers come from what the employer tracks"],
  [new RegExp(String.raw`\bfind (it |them )?on [^.]{0,80}\b(repair orders|management system|${REC})\b`, "i"), "tells the reader to find numbers in employer records"],
  [/\bfrom reports a [a-z ]+ already runs\b/i, "reports the employer runs as the source"],
  [/\bnumbers? (the|your) (kitchen|warehouse|plant|company|shop|store|unit|center|department) already (tracks|keeps|runs)\b/i, "the employer's tracked numbers as the source"],
];

// Reviewed exceptions: [file, exact text on the line, reason]. Keep this short.
const ALLOW = [
  ["executive-chef-resume.md", "in numbers an owner recognizes from their own reports", "describes how the owner reads the resume, not where the reader gets numbers (10/30/2026)"],
];

export function scanLine(line) {
  const found = [];
  for (const sentence of line.split(/(?<=[.!?])\s+/)) {
    if (SAFE.test(sentence)) continue;
    for (const [re, why] of PATTERNS) {
      const m = sentence.match(re);
      if (m) { found.push(`${why}: "${m[0]}"`); break; }
    }
  }
  return found;
}

function selfTest() {
  const read = (f) => fs.readFileSync(path.join(HERE, "severance-check.fixtures", f), "utf8").split(/\r?\n/).filter((l) => l.trim());
  const missed = read("banned.txt").filter((l) => !scanLine(l).length);
  const wrong = read("legit.txt").filter((l) => scanLine(l).length);
  if (missed.length || wrong.length) {
    console.error("severance-check: the guard itself is broken.");
    for (const l of missed) console.error(`  not caught (banned.txt): ${l}`);
    for (const l of wrong) console.error(`  wrongly caught (legit.txt): ${l}  -> ${scanLine(l).join("; ")}`);
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
        for (const h of scanLine(line)) hits.push(`${name}:${i + 1}  ${h}`);
      });
    }
  }
  if (hits.length) {
    const lines = new Set(hits.map((h) => h.split("  ")[0])).size;
    console.error(`severance-check: ${lines} line(s) (${hits.length} sentence(s)) send a reader to an employer's records or systems (founder rule 10/28/2026).`);
    console.error("Rewrite each to use what the person knows from their own work, and never to copy anything out of an employer's systems.");
    console.error("If a line is a skill, a warning, a public lookup, or a request to HR for the person's own records, it may be a false alarm: add a reviewed ALLOW entry with the reason.\n");
    for (const h of hits) console.error("  " + h);
    process.exit(1);
  }
  console.log(`severance-check: ok (${files} guides; guard self-test passed)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
