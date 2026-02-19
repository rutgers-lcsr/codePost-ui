<?php
declare(strict_types=1);

function parse_and_sum(string $csv): int {
    $values = array_map(static fn(string $value): int => (int) trim($value), explode(',', $csv));
    return array_sum($values);
}
