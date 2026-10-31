// Guide front door (founder 10/30-10/31/2026: every guide is a front door; a promise matches its step).
// Field of each guide, from its slug: picks the matching demo sample and keeps "Keep reading" in the reader's field.
// Only the demo's six samples exist (paralegal, military, hvac, gap, army, it), so most fields have no sample.
export type Field = 'care' | 'health' | 'trades' | 'military' | 'logistics' | 'it' | 'office' | 'food' | 'ats' | 'gap' | 'education' | 'safety' | 'general';

const RULES: [Field, RegExp][] = [
  ['ats', /(^|-)(ats|what-is-an-ats|what-the-ats-reads|resume-format-for-ats|hidden-text|honest-keyword|tailor-resume|quantify-resume)/],
  ['military', /(military|veteran|security-clearance|government-to-private)/],
  ['care', /(cna|home-health|patient-care|caregiver|medical-assistant|phlebotom|sterile|pharmacy-technician)/],
  ['health', /(nurse|cna|lpn|patient-care|phlebotom|medical|dental|home-health|caregiver|sterile|pharmacy|emt|paramedic|respiratory|radiologic|physical-therapist|bls-and-cpr)/],
  ['trades', /(hvac|electrician|plumber|carpenter|lineman|mechanic|welder|machinist|pipefitter|heavy-equipment|construction|landscaping|custodian|maintenance|manufacturing|production-supervisor|skills-you-forgot)/],
  ['logistics', /(warehouse|logistics|delivery|cdl|truck|dispatcher|bus-driver|forklift|flight-attendant|pilot)/],
  ['it', /(help-desk|soc-analyst|cyber|systems-administrator|data-analyst)/],
  ['food', /(line-cook|chef|restaurant|hotel)/],
  ['education', /(teacher|paraprofessional)/],
  ['safety', /(police|firefighter|security-guard)/],
  ['office', /(paralegal|bookkeeper|loan|claims|administrative|office-manager|recruiter|property|insurance|project-manager|operations|human-resources|underwriter|financial|sales-manager|bank-teller)/],
];

export function fieldOf(slug: string): Field {
  for (const [f, re] of RULES) if (re.test(slug)) return f;
  return 'general';
}

// The closest demo sample, only where one really matches.
export function demoSampleFor(slug: string, field: Field): string | null {
  if (slug.includes('paralegal')) return 'paralegal';
  if (field === 'military') return 'military';
  if (slug.includes('employment-gap')) return 'gap';
  if (field === 'it') return 'it';
  if (slug.includes('hvac') || field === 'trades') return 'hvac';
  if (slug.startsWith('warehouse') || slug.includes('logistics') || slug.includes('forklift')) return 'army';
  return null;
}

// The demo's own sample names, so the link says exactly which sample opens.
export const SAMPLE_LABEL: Record<string, string> = {
  paralegal: 'the paralegal sample',
  military: 'the military-to-civilian sample',
  hvac: 'the HVAC and trades sample',
  gap: 'the returning-after-a-gap sample',
  army: 'the Army-to-warehouse-and-logistics sample',
  it: 'the IT help desk sample',
};

// Nearest fields, used to fill "Keep reading" when a field has fewer than three guides (walk 10/31: the military
// guide fell back to unrelated guides).
export const NEAR: Record<Field, Field[]> = {
  care: ['health'], health: ['care'], trades: ['logistics'], military: ['logistics', 'safety'],
  logistics: ['trades', 'military'], it: ['office'], office: ['it'], food: ['office'], ats: ['general'],
  gap: ['general'], education: ['office'], safety: ['military'], general: ['ats'],
};
