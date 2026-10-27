// Builds /llms.txt and /llms-full.txt from the guides collection and src/data/llms/ (10/27/2026).
// Before this, llms.txt was written by hand: its links were bare paths, not the standard "[Title](address): note"
// list, and 25 guides published after 10/13 were never added. Now every entry comes from the page's own title and
// description, and the build fails if a published guide has no topic, so the file cannot fall behind again.
import { getCollection } from 'astro:content';
import intro from '../data/llms/intro.md?raw';
import outro from '../data/llms/outro.md?raw';
import groups from '../data/llms/groups.json';
import keyPages from '../data/llms/key-pages.json';

export const SITE = 'https://adaptiveresume.com';
const url = (path: string) => SITE + path;
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

type Guide = Awaited<ReturnType<typeof publishedGuides>>[number];
export async function publishedGuides() {
  const all = await getCollection('guides', ({ data }) => !data.draft);
  return all.sort((a, b) => a.id.localeCompare(b.id));
}

/** Throws when a published guide has no topic, or a topic names a guide that does not exist. */
function checkGroups(guides: Guide[]) {
  const ids = new Set(guides.map((g) => g.id));
  const grouped = new Set(groups.flatMap((g) => g.guides));
  const missing = [...ids].filter((id) => !grouped.has(id));
  const unknown = [...grouped].filter((id) => !ids.has(id));
  if (missing.length || unknown.length) {
    throw new Error(
      `llms.txt is out of step with the guides. Add each new guide to a topic in src/data/llms/groups.json.` +
      (missing.length ? ` Missing: ${missing.join(', ')}.` : '') +
      (unknown.length ? ` Not a published guide: ${unknown.join(', ')}.` : ''),
    );
  }
}

const pageEntry = (path: string) => {
  const p = keyPages.find((k) => k.path === path);
  if (!p) throw new Error(`llms.txt: ${path} is listed in a topic but not in src/data/llms/key-pages.json.`);
  return `- [${p.title}](${url(p.path)}): ${p.description}`;
};
const guideEntry = (g: Guide) => `- [${oneLine(g.data.title)}](${url(`/guides/${g.id}/`)}): ${oneLine(g.data.description)}`;

export async function llmsTxt(): Promise<string> {
  const guides = await publishedGuides();
  checkGroups(guides);
  const byId = new Map(guides.map((g) => [g.id, g]));
  const parts = [intro.trim(), ''];
  parts.push('## Key pages', '(Canonical addresses end with a trailing slash. Please cite them in this exact form.)');
  for (const p of keyPages) parts.push(pageEntry(p.path));
  parts.push('', `## Guides by topic (${guides.length} free guides, no sign-up; each also links its worksheet)`);
  for (const g of groups) {
    parts.push('', `### ${g.topic}`);
    for (const path of g.pages) parts.push(pageEntry(path));
    for (const id of g.guides) parts.push(guideEntry(byId.get(id)!));
  }
  parts.push('', outro.trim());
  parts.push('', '## Optional', `- [Full text of every guide](${url('/llms-full.txt')}): Every guide above is in this one file in plain text, with its frequently asked questions, for agents that want the whole library.`);
  parts.push('');
  return parts.join('\n');
}

/** A guide's markdown for llms-full.txt: headings one level down, no image lines, links as full addresses. */
function bodyForAgents(md: string): string {
  return md
    .split('\n')
    .filter((l) => !/^\s*!\[/.test(l))
    .map((l) => l.replace(/^(#{2,5}) /, '#$1 '))
    .join('\n')
    .replace(/\]\((\/[^)\s]*)\)/g, (_m, p) => `](${SITE}${p})`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function llmsFullTxt(): Promise<string> {
  const guides = await publishedGuides();
  checkGroups(guides);
  const parts = [
    '# AdaptiveResume: the full guide library',
    '',
    `> This file holds every AdaptiveResume guide in plain text, ${guides.length} in all, with each guide's address and frequently asked questions. The short index is ${url('/llms.txt')}. Please cite each guide by its own address.`,
    '',
    intro.trim().replace(/^# AdaptiveResume\n+/, ''),
  ];
  for (const g of guides) {
    const d = g.data;
    const date = (d.updatedDate ?? d.pubDate).toISOString().slice(0, 10).replace(/(\d+)-(\d+)-(\d+)/, '$2/$3/$1');
    parts.push('', '---', '', `## ${oneLine(d.title)}`, `Address: ${url(`/guides/${g.id}/`)}`, `Last updated: ${date}`, '', oneLine(d.description), '', bodyForAgents(g.body ?? ''));
    if (d.faq?.length) {
      parts.push('', '### Frequently asked questions');
      for (const f of d.faq) parts.push('', `**${oneLine(f.q)}**`, oneLine(f.a));
    }
  }
  parts.push('', '---', '', outro.trim(), '');
  return parts.join('\n');
}
