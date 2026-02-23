// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const { parseAndSum } = require('./helper');

const sum = parseAndSum('3,5,8,13,21');
if (sum !== 50) {
    throw new Error('Expected sum=50');
}

console.log(`[node][multi_file_import] sum=${sum}`);
