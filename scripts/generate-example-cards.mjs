// Before/after example cards (08/06) — one per occupation guide, embedded in the
// guide body under its worked example. Brand system, transformation-framed (the
// comprehension-bar rule: show before -> after, never just outputs). All example
// text is ILLUSTRATIVE and matches the guide body verbatim — regenerate after
// editing pairs there. Run: node scripts/generate-example-cards.mjs
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const OUT = "public/img/guides/examples";
const NAVY = "#1d3a66", DEEP = "#16294a", AMBER = "#c9740f", INK = "#ffffff", SOFT = "#b9c6dc", MUTED = "#8296b5";

export const PAIRS = {
  "administrative-assistant-resume": {
    before: "Performed general administrative duties including scheduling and correspondence.",
    after: "Supported 3 directors - resolved daily calendar conflicts, booked ~30 trips/year, processed expense reports for a 12-person team, and managed 6 office vendors against contract terms.",
  },
  "project-manager-resume": {
    before: "Managed software implementation projects using Agile methodology.",
    after: "Ran a 9-month ERP rollout across 3 departments (~$400k budget, 12-person mixed team); delivered two weeks early after re-scoping the data-migration phase.",
  },
  "teacher-resume-skills": {
    before: "Taught 3rd grade at Ridgeview Elementary.",
    after: "Taught a 3rd-grade class of ~28, including 6 students on IEP/504 plans; regrouped instruction from quarterly benchmark data; led 40+ parent conferences a year.",
  },
  "military-to-civilian-resume": {
    before: "92Y Unit Supply Specialist, maintained CSDP compliance, managed SSA transactions.",
    after: "Inventory control for a 200-person organization: cycle counts, audits, accountability for $4.2M in equipment; supervised and trained a supply team of 4.",
  },
  "bank-teller-resume": {
    before: "Teller, handled transactions and customer service.",
    after: "Processed ~120 transactions/day with zero drawer discrepancies in 18 months; trained 3 new tellers; referred ~15 customers/month to platform services.",
  },
  "data-analyst-resume": {
    before: "Responsible for reporting and dashboards.",
    after: "Built 12 recurring Power BI dashboards serving ~40 users; automated weekly reporting (~6 hours/week saved); flagged a recurring billing error before quarter close.",
  },
  "emt-resume": {
    before: "EMT, responded to emergency calls.",
    after: "911 EMT-B: ~1,400 calls over 3 years; BLS and NIMS certified; precepted 4 new EMTs; documented every run to county protocol.",
  },
  "er-nurse-resume": {
    before: "ER nurse, patient care duties.",
    after: "ER RN, Level II trauma center: 4:1 ratios, triage lead two shifts/week; ACLS, PALS, TNCC; precepted 3 new-graduate RNs.",
  },
  "human-resources-resume": {
    before: "HR generalist, various HR duties.",
    after: "HR generalist for a 240-employee site: full-cycle recruiting (~35 hires/year), benefits enrollment, ADP administration, two clean I-9 audits.",
  },
  "pilot-resume": {
    before: "Pilot with commercial experience.",
    after: "Commercial pilot: 2,850 TT / 1,900 PIC / 320 multi; CFI and CFII; Part 135 cargo operations including mountain and night routes.",
  },
  "telemetry-nurse-resume": {
    before: "Telemetry nurse, monitored patients.",
    after: "Telemetry RN on a 32-bed unit: 5:1 ratios, rhythm interpretation and drip titration; charge nurse one shift/week; Epic superuser.",
  },
  "how-to-list-promotions-on-resume": {
    before: "Crew Member (2021-22). Shift Lead (2022-24). Assistant Manager (2024-). Three separate entries, story invisible.",
    after: "One employer, one entry: Crew Member -> Shift Lead (2022) -> Assistant Manager (2024) - promoted twice in three years, now running 12-person shifts.",
  },
  // Batch one, 08/11 (pairs match each guide body verbatim - see the guides)
  "icu-nurse-resume": {
    before: "Registered nurse responsible for the care of critical patients in the intensive care unit.",
    after: "ICU RN, [MICU/SICU/CVICU], typically 1:2 assignments: ventilated patients, titratable drips, CRRT when assigned; [Epic] charting.",
  },
  "operating-room-nurse-resume": {
    before: "Assisted surgeons during a wide variety of surgical procedures.",
    after: "Circulating RN across [general/ortho/neuro] services; scrub [share] of cases; owned counts, specimen handling, and time-out documentation in [Epic].",
  },
  "charge-nurse-resume": {
    before: "Served as charge nurse and handled various leadership duties on the unit.",
    after: "Charge nurse, [N]-bed [unit], [nights]: acuity-based assignments for [N] RNs and [N] techs; bed flow with the house supervisor; first escalation point for the shift.",
  },
  "police-officer-resume": {
    before: "Responded to calls, wrote reports, and appeared in court as needed.",
    after: "Patrol officer, [agency]: answered calls for service across [beat/shift]; wrote incident and arrest reports relied on in charging decisions; testified in court on my own cases.",
  },
  "firefighter-resume": {
    before: "Firefighter responsible for responding to emergencies and maintaining equipment.",
    after: "Firefighter/EMT, [department]: fire and medical response on [shift] rotation; qualified on [engine] including pump operations; owned daily rig and SCBA checks.",
  },
  "how-to-list-certifications-on-resume": {
    before: "Certified in project management and additional IT certifications.",
    after: "Project Management Professional (PMP) - Project Management Institute, current through 09/2027 · CompTIA A+ - CompTIA, earned 2024.",
  },
  "resume-format-for-ats": {
    before: "A two-column layout with work history down the left, skills graphics on the right, and name and phone in the page header.",
    after: "The same content, one column: contact info in the body, standard headings, month-and-year dates, skills as plain text - nothing reworded, every field parsed cleanly.",
  },
  "tailor-resume-to-job-description": {
    before: "Managed client accounts and helped new customers get set up in our CRM.",
    after: "Led customer implementations for ~30 new accounts/year in Salesforce; carried renewal responsibility for the book afterward.",
  },
  "how-to-explain-employment-gap-on-resume": {
    before: "2021 - 2024: Various family responsibilities and independent projects.",
    after: "Full-time caregiver for a parent, 06/2021 - 08/2024 - managed care schedule, household finances, and insurance coordination; returned to full availability.",
  },
  "help-desk-resume": {
    before: "Provided technical support for company employees and resolved computer issues.",
    after: "Tier 1/2 support for ~800 users across 3 sites; ~35 tickets/day in ServiceNow; escalation line to infrastructure for server and network faults.",
  },
  // 08/30 wave (10 occupation guides)
  "paramedic-resume": {
    before: "Certified paramedic with ACLS and PALS. Experienced in advanced life support and patient care.",
    after: "Licensed Paramedic, [State] (Lic. #[number], current through [date]); NRP (National Registry, current through [date]). ACLS, PALS, PHTLS (current through [dates]); NIMS ICS-100/200/700/800.",
  },
  "respiratory-therapist-resume": {
    before: "Provided respiratory therapy and breathing treatments to patients as ordered.",
    after: "RRT in a 24-bed medical/surgical ICU; managed [N] ventilated adults per shift, ran weaning protocols, drew and interpreted ABGs, and covered rapid responses and codes as the respiratory member.",
  },
  "office-manager-resume": {
    before: "Responsible for daily office operations, administrative support, and vendor relationships.",
    after: "Sole office manager for a ~45-person professional services firm across two sites; owned ~$400K annual facilities and supply budget, managed 20+ vendor contracts, and supervised 3 administrative staff.",
  },
  "sales-manager-resume": {
    before: "Led a high-performing sales team and consistently exceeded revenue targets.",
    after: "Managed 7 quota-carrying AEs (SaaS, mid-market); team quota $6.4M, attainment 112% FY24 and 104% FY23; ramped 3 new hires to full productivity in ~4 months.",
  },
  "medical-technologist-resume": {
    before: "Performed laboratory testing and reported results accurately.",
    after: "Generalist bench, 400-bed hospital lab, night shift; chemistry, hematology, coag, urinalysis, and blood bank; ~250 specimens/shift on Roche cobas and Sysmex XN, all documented in Sunquest LIS.",
  },
  "nicu-nurse-resume": {
    before: "Registered nurse providing care to premature and critically ill newborns in the neonatal intensive care unit.",
    after: "NICU RN, Level III, [40]-bed unit; ventilated and CPAP neonates, umbilical arterial and venous lines, gavage feeds, developmental and family-centered care; [Epic] charting.",
  },
  "machinist-resume": {
    before: "Operated CNC machines to produce parts according to blueprints.",
    after: "3- and 4-axis CNC mills, Haas and Mazak controls; held ±0.0005\" on production aerospace parts in 6061 aluminum and 17-4 stainless; ran setup and first article, verified with micrometers, calipers, and CMM.",
  },
  "hotel-manager-resume": {
    before: "Responsible for daily operations, staff supervision, and guest satisfaction at a busy hotel.",
    after: "General Manager, 140-room select-service Hilton-flag property; owned front office, housekeeping, and breakfast F&B, ~$7M annual revenue P&L; grew RevPAR [12%] and held occupancy at [78%] while lifting the brand guest-satisfaction score to the top [quartile] of the region.",
  },
  "aircraft-mechanic-resume": {
    before: "Experienced aircraft mechanic responsible for maintenance, repairs, and inspections on various aircraft.",
    after: "A&P certificated (Airframe & Powerplant, 14 CFR Part 65); IA held. Part 145 repair station line and heavy maintenance on [Boeing 737NG] and [CRJ700]; performed and signed return-to-service entries, AD compliance research, and [C-check] tasks.",
  },
  "welder-resume": {
    before: "Experienced welder responsible for welding and fabrication on various projects.",
    after: "Structural steel fabrication; SMAW and FCAW, plate and structural shapes, carbon steel 1/8\" to 1\"; qualified 3G and 4G; read shop drawings and weld symbols daily.",
  },
};

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function wrap(text, max) {
  const words = text.split(/\s+/); const lines = [""];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + " " + w).trim().length > max && cur) lines.push(w);
    else lines[lines.length - 1] = (cur + " " + w).trim();
  }
  return lines;
}
const tspans = (lines, x, y0, lh) => lines.map((l, i) => `<tspan x="${x}" y="${y0 + i * lh}">${esc(l)}</tspan>`).join("");

function svg({ before, after }) {
  const b = wrap(`"${before}"`, 62).slice(0, 3);
  const a = wrap(`"${after}"`, 62).slice(0, 5);
  return `<svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${DEEP}"/></linearGradient></defs>
  <rect width="1200" height="628" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="6" fill="${AMBER}"/>
  <g font-family="Segoe UI, Arial, sans-serif">
    <text x="70" y="88" font-size="22" font-weight="700" fill="${MUTED}" letter-spacing="3">BEFORE</text>
    <text font-size="26" font-style="italic" fill="${MUTED}">${tspans(b, 70, 128, 36)}</text>
    <line x1="70" y1="${140 + b.length * 36}" x2="1130" y2="${140 + b.length * 36}" stroke="${AMBER}" stroke-width="2" opacity="0.6"/>
    <text x="70" y="${188 + b.length * 36}" font-size="22" font-weight="700" fill="${AMBER}" letter-spacing="3">AFTER - EVERY LINE CONFIRMED BY THE PERSON</text>
    <text font-size="27" font-weight="600" fill="${INK}">${tspans(a, 70, 228 + b.length * 36, 38)}</text>
    <text x="70" y="580" font-size="22" font-weight="700" fill="${INK}">Adaptive<tspan fill="${AMBER}">Resume</tspan></text>
    <text x="1130" y="580" font-size="20" font-weight="600" fill="${SOFT}" text-anchor="end">Illustrative example - nothing invented, ever, on yours.</text>
  </g>
</svg>`;
}

await mkdir(OUT, { recursive: true });
let n = 0;
for (const [slug, pair] of Object.entries(PAIRS)) {
  await sharp(Buffer.from(svg(pair))).png({ compressionLevel: 9 }).toFile(`${OUT}/${slug}-example.png`);
  n++;
}
console.log(`generated ${n} example cards -> ${OUT}`);
