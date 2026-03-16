// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { DocCategory, DocRoute } from './DocsConfig';

// Define the shape of our loaded documentation
export interface LoadedDoc {
  key: string;
  title: string;
  category: DocCategory;
  path: string;
  content: string; // Markdown content (frontmatter stripped)
  plainText: string; // Stripped content for searching
}

// Eagerly load all markdown files
const modules = import.meta.glob('../../docs/content/*.md', { query: '?raw', import: 'default', eager: true });

// Helper to strip markdown syntax for better search indexing
const stripMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  return markdown
    .replace(/\[!.*?\]/g, '') // Remove alert markers
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Keep link text, remove url
    .replace(/[#*`_~]/g, '') // Remove special chars
    .replace(/\n+/g, ' ') // Collapse newlines
    .trim();
};

// Replace hardcoded API URLs with the configured backend URL
const HARDCODED_API_URL = 'https://codepost-api.cs.rutgers.edu';
const resolveApiUrls = (markdown: string): string => {
  const apiUrl = process.env.REACT_APP_API_URL;
  if (!apiUrl) return markdown;
  return markdown.replaceAll(HARDCODED_API_URL, apiUrl);
};

// Parse YAML frontmatter from markdown content.
// Returns the parsed fields and the remaining content with frontmatter stripped.
const parseFrontmatter = (raw: string): { meta: Record<string, string>; content: string } => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    // Strip optional surrounding quotes
    const val = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    meta[key] = val;
  }
  return { meta, content: match[2] };
};

// Build docs and routes once at module init
const buildDocs = (): { docs: LoadedDoc[]; routes: DocRoute[] } => {
  const docs: LoadedDoc[] = [];
  const routes: DocRoute[] = [];

  for (const [pathKey, rawModule] of Object.entries(modules)) {
    const rawContent = typeof rawModule === 'string' ? rawModule : '';
    const fileName = pathKey.split('/').pop() || '';
    const { meta, content: bodyContent } = parseFrontmatter(rawContent);

    // Skip files without valid frontmatter
    if (!meta.key || !meta.title || !meta.category) continue;

    const route: DocRoute = {
      key: meta.key,
      path: meta.path ?? '',
      title: meta.title,
      fileName,
      category: meta.category as DocCategory,
      order: meta.order ? parseInt(meta.order, 10) : 999,
    };

    const content = resolveApiUrls(bodyContent);

    docs.push({
      key: route.key,
      title: route.title,
      category: route.category,
      path: route.path,
      content,
      plainText: stripMarkdown(content),
    });

    routes.push(route);
  }

  // Sort by order field
  const sortByOrder = (a: { order?: number }, b: { order?: number }) => (a.order ?? 999) - (b.order ?? 999);
  docs.sort((a, b) => {
    const ra = routes.find((r) => r.key === a.key);
    const rb = routes.find((r) => r.key === b.key);
    return sortByOrder(ra ?? {}, rb ?? {});
  });
  routes.sort(sortByOrder);

  return { docs, routes };
};

// Eagerly cache at module init — runs once when the module is first imported
const _cache = buildDocs();

export const getAllDocs = (): LoadedDoc[] => _cache.docs;

export const getDocRoutes = (): DocRoute[] => _cache.routes;

export const getDocByPath = (path: string): LoadedDoc | undefined => {
  return _cache.docs.find((d) => d.path === path);
};
