// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/math.php';

$values = parse_csv('1,2,3,4');
if (count($values) !== 4) {
    throw new RuntimeException('Expected 4 values');
}

echo '[php][nested_paths] count=' . count($values) . PHP_EOL;
