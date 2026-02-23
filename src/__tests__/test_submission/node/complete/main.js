// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function parseNumbers(csvLine) {
    return csvLine.split(',').map((item) => Number(item.trim()));
}

const inputPath = path.join(__dirname, '..', 'existing_data.txt');
const csv = fs.readFileSync(inputPath, 'utf8').trim();
const values = parseNumbers(csv);

const sum = values.reduce((acc, value) => acc + value, 0);
const max = Math.max(...values);

const report = [
    `platform=${os.platform()}`,
    `count=${values.length}`,
    `sum=${sum}`,
    `max=${max}`,
].join('\n');

fs.writeFileSync(path.join(__dirname, 'result_summary.txt'), `${report}\n`);

const markdown = [
    '# Node Rendering Preview',
    '',
    '- Unicode: café λ 🚀',
    '- Status: success',
    '',
    '```text',
    'idx | value',
    '-----------',
    ...values.map((value, index) => `${index}   | ${value}`),
    '```',
    '',
].join('\n');
fs.writeFileSync(path.join(__dirname, 'render_preview.md'), markdown);

assert.equal(values.length, 5, 'Expected five parsed values.');
assert.equal(sum, 50, 'Expected sum to equal 50.');
assert.equal(max, 21, 'Expected max to equal 21.');

console.log('=== NODE RENDER TEST START ===');
console.log('unicode: café λ 🚀');
console.log('json: {"language":"node","status":"ok"}');
console.log('idx | value');
values.forEach((value, index) => console.log(`${index.toString().padStart(3, ' ')} | ${value}`));
console.error('[stderr][node] Render check stderr line');
console.log('Node compatibility checks passed.');
