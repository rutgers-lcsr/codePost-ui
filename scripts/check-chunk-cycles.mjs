// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Fail if the built bundle contains circular static imports between chunks.
 *
 * Chunk-level import cycles (typically a vendor chunk importing back into an app
 * chunk because a shared dependency was left out of its codeSplitting group in
 * vite.config.mts) evaluate modules in an order where some bindings are still
 * undefined — crashing at module init in production ("undefined has no
 * properties") while every test and the build itself stay green.
 *
 * Usage: node scripts/check-chunk-cycles.mjs   (after a build; reads build/assets)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ASSETS = join(process.cwd(), 'build', 'assets');

const graph = new Map();
for (const file of readdirSync(ASSETS)) {
  if (!file.endsWith('.js')) continue;
  const src = readFileSync(join(ASSETS, file), 'utf8');
  const deps = new Set();
  for (const match of src.matchAll(/(?:from\s*|import\s*)"\.\/([^"]+\.js)"/g)) {
    deps.add(match[1]);
  }
  graph.set(file, deps);
}

const WHITE = 0,
  GRAY = 1,
  BLACK = 2;
const color = new Map([...graph.keys()].map((k) => [k, WHITE]));
const stack = [];
const cycles = [];

function dfs(node) {
  color.set(node, GRAY);
  stack.push(node);
  for (const dep of graph.get(node) ?? []) {
    if (!color.has(dep)) continue;
    if (color.get(dep) === GRAY) {
      cycles.push([...stack.slice(stack.indexOf(dep)), dep]);
    } else if (color.get(dep) === WHITE) {
      dfs(dep);
    }
  }
  stack.pop();
  color.set(node, BLACK);
}

for (const node of graph.keys()) {
  if (color.get(node) === WHITE) dfs(node);
}

if (cycles.length > 0) {
  console.error(`✗ ${cycles.length} chunk import cycle(s) found:`);
  for (const cycle of cycles.slice(0, 10)) {
    console.error('  ' + cycle.join(' -> '));
  }
  console.error(
    '\nA vendor chunk in a cycle usually means one of its packages has a companion ' +
      'dependency that is not claimed by its codeSplitting group in vite.config.mts.',
  );
  process.exit(1);
}
console.log(`✓ no chunk import cycles (${graph.size} chunks)`);
