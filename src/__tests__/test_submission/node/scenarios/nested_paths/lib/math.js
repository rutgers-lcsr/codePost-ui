function parse(csv) {
    return csv.split(',').map((value) => Number(value.trim()));
}

module.exports = { parse };
