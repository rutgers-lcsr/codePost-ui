<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/math.php';

$values = parse_csv('1,2,3,4');
if (count($values) !== 4) {
    throw new RuntimeException('Expected 4 values');
}

echo '[php][nested_paths] count=' . count($values) . PHP_EOL;
