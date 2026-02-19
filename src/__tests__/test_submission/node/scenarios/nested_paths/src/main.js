const { parse } = require('../lib/math');

const values = parse('1,2,3,4');
if (values.length !== 4) {
    throw new Error('Expected 4 values');
}

console.log(`[node][nested_paths] count=${values.length}`);
