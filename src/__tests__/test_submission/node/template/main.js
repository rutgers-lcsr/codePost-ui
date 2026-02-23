// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function parseNumbers(csvLine) {
    // TODO(student): parse comma-separated integers.
    return [];
}

const inputPath = path.join(__dirname, '..', 'existing_data.txt');
const csv = fs.readFileSync(inputPath, 'utf8').trim();
const values = parseNumbers(csv);

fs.writeFileSync(path.join(__dirname, 'starter_output.txt'), `TODO count=${values.length}\n`);

assert(values.length > 0, 'Starter assertion intentionally triggers until parseNumbers is implemented.');
console.log('Node starter template ran.');
