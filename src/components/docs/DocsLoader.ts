// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { docRoutes } from './DocsConfig';

// Define the shape of our loaded documentation
export interface LoadedDoc {
  key: string;
  title: string;
  category: string;
  path: string;
  content: string; // Markdown content
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

// Cache the processed docs
let cachedDocs: LoadedDoc[] | null = null;

export const getAllDocs = (): LoadedDoc[] => {
  if (cachedDocs) return cachedDocs;

  cachedDocs = docRoutes.map((route) => {
    const pathKey = `../../docs/content/${route.fileName}`;
    const rawContent = modules[pathKey];
    const content = typeof rawContent === 'string' ? rawContent : '';

    return {
      ...route,
      content,
      plainText: stripMarkdown(content),
    };
  });

  return cachedDocs;
};

export const getDocByPath = (path: string): LoadedDoc | undefined => {
  const docs = getAllDocs();
  return docs.find((d) => d.path === path);
};
