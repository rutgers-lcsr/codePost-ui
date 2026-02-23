// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
<?php
declare(strict_types=1);

function parse_numbers(string $csv_line): array {
    // TODO(student): parse comma-separated integers.
    return [];
}

$csv = trim((string) file_get_contents(__DIR__ . '/../existing_data.txt'));
$values = parse_numbers($csv);

file_put_contents(__DIR__ . '/starter_output.txt', 'TODO count=' . count($values) . PHP_EOL);

assert(count($values) > 0, 'Starter assertion intentionally triggers until parse_numbers is implemented.');
echo "PHP starter template ran." . PHP_EOL;
