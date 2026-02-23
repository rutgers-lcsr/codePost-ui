// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
function parseAndSum(csv) {
    return csv
        .split(',')
        .map((value) => Number(value.trim()))
        .reduce((acc, value) => acc + value, 0);
}

module.exports = { parseAndSum };
