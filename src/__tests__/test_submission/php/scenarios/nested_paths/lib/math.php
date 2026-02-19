<?php
declare(strict_types=1);

function parse_csv(string $csv): array {
    return array_map(static fn(string $value): int => (int) trim($value), explode(',', $csv));
}
