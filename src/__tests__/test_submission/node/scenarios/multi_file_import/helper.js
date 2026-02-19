function parseAndSum(csv) {
    return csv
        .split(',')
        .map((value) => Number(value.trim()))
        .reduce((acc, value) => acc + value, 0);
}

module.exports = { parseAndSum };
