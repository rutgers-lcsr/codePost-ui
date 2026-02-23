// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
<?php
declare(strict_types=1);

function parse_and_sum(string $csv): int {
    $values = array_map(static fn(string $value): int => (int) trim($value), explode(',', $csv));
    return array_sum($values);
}
