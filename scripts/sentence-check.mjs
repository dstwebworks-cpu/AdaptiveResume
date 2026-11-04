// Sentence check for the free downloads (founder 11/03/2026: "are you even writing sentences that make sense?").
// Every checkbox line in public/templates/*.md must be a full sentence with its own subject, and no line may be a
// "Label: fragment". Two patterns fail:
//   1. A checkbox item whose main clause has no subject: "- [ ] Filed for unemployment" or
//      "- [ ] If I elected COBRA: paid the first premium". Write "I filed ..." / "If I elected COBRA, I paid ...".
//   2. "Label: words" lines and items ("Reminder: dropping COBRA ...", "Questions: support@..."). A label followed
//      only by a blank to fill in ("Date: ________") is a form field and passes.
// Files listed in STRICT fail the build; every other template is reported as a warning until it is rewritten.
// Usage: node scripts/sentence-check.mjs [--all-strict]
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'public/templates';
const STRICT = new Set([
  'laid-off-first-30-days-checklist.md',
  'long-term-unemployed-restart-plan.md',
  'weekly-claim-and-work-search-log.md',
]);
const allStrict = process.argv.includes('--all-strict');

// Words that can open a main clause with a subject, or open a question.
const SUBJECT = /^(I|I'm|I've|I'll|My|Me|We|Our|You|Your|The|This|That|These|Those|It|Its|A|An|Each|Every|No|None|All|Any|Some|There|Do|Does|Did|Is|Are|Can|Could|Should|Will|Would|What|Which|Who|How|When|Where|Why)\b/;
// A leading condition that must be followed by a comma and a subject: "If ..., I ..."
const LEAD = /^(If|Before|After|When|Once|Until|Unless|While|Since|Because)\b[^,:]*[,:]\s*/;
// "Label: words" (1 to 4 words before the colon, then real words, not just a blank).
const LABEL = /^(\*\*)?[A-Z][\w'()/-]*(\s+[\w'()/-]+){0,3}(\*\*)?:\s+(?![_\s]*$)/;
const URLISH = /^(https?:|adaptiveresume\.com)/i;

function problems(line) {
  const out = [];
  const item = line.match(/^\s*-\s+\[[ xX]\]\s+(.*)$/);
  const text = (item ? item[1] : line.replace(/^\s*(>|-|\*)\s+/, '')).trim();
  if (!text || /^(#|\||!\[|<)/.test(text) || /^[-_=*\s|]+$/.test(text)) return out;
  // A line made only of form fields ("Date my job ended: ____  Date my coverage ends: ____") passes.
  const formOnly = text.replace(/[A-Z][^:]{0,60}:\s*_{3,}\.?\s*/g, '').trim() === '';
  if (LABEL.test(text) && !formOnly) {
    const after = text.replace(/^[^:]*:\s+/, '');
    if (!URLISH.test(after) || item) out.push('label: fragment');
  }
  if (item) {
    const lead = text.match(LEAD);
    if (lead) {
      if (lead[0].trim().endsWith(':')) out.push('condition followed by a colon, not "..., I ..."');
      else if (!SUBJECT.test(text.slice(lead[0].length))) out.push('no subject after the condition');
    } else if (!SUBJECT.test(text)) out.push('no subject (write "I ..." or "My ...")');
  }
  return out;
}

let fails = 0, warns = 0;
for (const f of fs.readdirSync(DIR).filter((n) => n.endsWith('.md')).sort()) {
  const strict = allStrict || STRICT.has(f);
  fs.readFileSync(path.join(DIR, f), 'utf8').split(/\r?\n/).forEach((line, i) => {
    for (const p of problems(line)) {
      console.log(`${strict ? 'FAIL' : 'warn'} ${DIR}/${f}:${i + 1} ${p}: ${line.trim().slice(0, 100)}`);
      strict ? fails++ : warns++;
    }
  });
}
console.log(`sentence-check: ${fails} failure(s), ${warns} warning(s) in ${DIR}`);
if (fails) process.exit(1);
