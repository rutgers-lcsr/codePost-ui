"""Sample Python file for code console testing."""

import math
from typing import Optional


class Fibonacci:
    """Generate Fibonacci numbers with optional memoization."""

    def __init__(self, use_cache: bool = True) -> None:
        self._cache: dict[int, int] = {0: 0, 1: 1}
        self._use_cache = use_cache

    def compute(self, n: int) -> int:
        if n < 0:
            raise ValueError(f"n must be non-negative, got {n}")
        if self._use_cache and n in self._cache:
            return self._cache[n]
        result = self.compute(n - 1) + self.compute(n - 2)
        if self._use_cache:
            self._cache[n] = result
        return result

    def ratio(self, n: int) -> Optional[float]:
        """Return F(n)/F(n-1), which converges to the golden ratio."""
        if n < 2:
            return None
        return self.compute(n) / self.compute(n - 1)


def main() -> None:
    fib = Fibonacci()
    for i in range(20):
        val = fib.compute(i)
        ratio = fib.ratio(i)
        ratio_str = f"{ratio:.6f}" if ratio else "N/A"
        print(f"F({i:2d}) = {val:6d}  ratio = {ratio_str}")

    golden = (1 + math.sqrt(5)) / 2
    print(f"\nGolden ratio: {golden:.10f}")


if __name__ == "__main__":
    main()
