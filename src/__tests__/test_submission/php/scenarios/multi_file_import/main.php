<?php
declare(strict_types=1);

require_once __DIR__ . '/helper.php';

$sum = parse_and_sum('3,5,8,13,21');
if ($sum !== 50) {
    throw new RuntimeException('Expected sum=50');
}

echo '[php][multi_file_import] sum=' . $sum . PHP_EOL;
