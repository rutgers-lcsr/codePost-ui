#!/bin/bash
# Sample shell script — run tests and report results

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$RESULTS_DIR"

echo "=== Autograder Run: $TIMESTAMP ==="
echo ""

run_test_suite() {
    local name="$1"
    local file="$2"
    local timeout="${3:-30}"

    echo "Running $name..."

    local start_time
    start_time=$(date +%s%N)

    if timeout "$timeout" python -m pytest "$file" \
        --tb=short \
        --junitxml="$RESULTS_DIR/${name}.xml" \
        -q 2>&1; then
        local status="PASS"
    else
        local status="FAIL"
    fi

    local end_time
    end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))

    echo "  Status: $status (${duration}ms)"
    echo ""
}

run_test_suite "unit" "test_unit.py" 60
run_test_suite "integration" "test_integration.py" 120
run_test_suite "style" "test_style.py" 30

# Aggregate results
total_passed=0
total_failed=0
for xml in "$RESULTS_DIR"/*.xml; do
    passed=$(grep -oP 'tests="\K\d+' "$xml" 2>/dev/null || echo 0)
    failed=$(grep -oP 'failures="\K\d+' "$xml" 2>/dev/null || echo 0)
    total_passed=$((total_passed + passed - failed))
    total_failed=$((total_failed + failed))
done

echo "=== Summary ==="
echo "Passed: $total_passed"
echo "Failed: $total_failed"
echo "Results saved to: $RESULTS_DIR"
