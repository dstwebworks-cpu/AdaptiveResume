// /llms.txt, built from the guides and src/data/llms/ (see src/lib/llms.ts).
import type { APIRoute } from 'astro';
import { llmsTxt } from '../lib/llms';

export const GET: APIRoute = async () => new Response(await llmsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
