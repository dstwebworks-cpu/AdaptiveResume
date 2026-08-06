import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// SEO guides. NOTE: `keyword` is the INTENDED target — validate against real
// search-volume data (keyword-research gate) before treating titles/H1s as final.
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // SERP-facing overrides (08/06 audit): used for <title> / meta description ONLY.
    // The H1, visible lede, and generated hero card keep the full title/description.
    // Rules: seoTitle <=60 chars keyword-front-loaded; seoDescription <=160 chars.
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
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
