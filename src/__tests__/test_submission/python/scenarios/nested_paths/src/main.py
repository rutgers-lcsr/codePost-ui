from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parent.parent / "lib"))

from math_utils import parse_csv  # noqa: E402  # type: ignore[import-not-found]


def main() -> None:
    values = parse_csv("1,2,3,4")
    assert len(values) == 4
    print(f"[python][nested_paths] count={len(values)}")


if __name__ == "__main__":
    main()
