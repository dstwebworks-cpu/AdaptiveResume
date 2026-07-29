import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// SEO guides. NOTE: `keyword` is the INTENDED target — validate against real
// search-volume data (keyword-research gate) before treating titles/H1s as final.
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    segment: z.enum(['job-seekers', 'organizations']),
    audience: z.string(),
    keyword: z.string(),
    giveaway: z.object({ name: z.string(), file: z.string() }),
    cta: z.object({ label: z.string(), href: z.string() }),
    // Dates are honest: pubDate = first day this guide was publicly served (site went
    // live 07/26/2026); updatedDate only when content changed after that (git history).
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { guides };
