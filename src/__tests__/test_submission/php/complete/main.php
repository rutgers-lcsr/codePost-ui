// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
<?php
declare(strict_types=1);

function parse_numbers(string $csv_line): array {
    return array_map(
        static fn(string $value): int => (int) trim($value),
        explode(',', $csv_line)
    );
}

function assert_true(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$csv = trim((string) file_get_contents(__DIR__ . '/../existing_data.txt'));
$values = parse_numbers($csv);

$sum = array_sum($values);
$max = max($values);

$payload = [
    'count' => count($values),
    'sum' => $sum,
    'max' => $max,
];

file_put_contents(__DIR__ . '/result_summary.json', json_encode($payload, JSON_PRETTY_PRINT) . PHP_EOL);

$markdown_lines = [
    '# PHP Rendering Preview',
    '',
    '- Unicode: café λ 🚀',
    '- Status: success',
    '',
    '```text',
    'idx | value',
    '-----------',
];
foreach ($values as $index => $value) {
    $markdown_lines[] = $index . '   | ' . $value;
}
$markdown_lines[] = '```';
$markdown_lines[] = '';
file_put_contents(__DIR__ . '/render_preview.md', implode(PHP_EOL, $markdown_lines));

assert_true(count($values) === 5, 'Expected five values.');
assert_true($sum === 50, 'Expected sum to equal 50.');
assert_true($max === 21, 'Expected max to equal 21.');

echo "=== PHP RENDER TEST START ===" . PHP_EOL;
echo "unicode: café λ 🚀" . PHP_EOL;
echo "json: {\"language\":\"php\",\"status\":\"ok\"}" . PHP_EOL;
echo "idx | value" . PHP_EOL;
foreach ($values as $index => $value) {
    echo str_pad((string) $index, 3, ' ', STR_PAD_LEFT) . " | " . $value . PHP_EOL;
}
fwrite(STDERR, "[stderr][php] Render check stderr line" . PHP_EOL);
echo 'PHP compatibility checks passed.' . PHP_EOL;
