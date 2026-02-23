# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
"""Python starter submission fixture."""

from pathlib import Path


def parse_numbers(csv_line: str) -> list[int]:
    """TODO(student): parse comma-separated integers."""
    return []


def main() -> None:
    data_path = Path(__file__).resolve().parent.parent / "existing_data.txt"
    csv_line = data_path.read_text(encoding="utf-8").strip()
    values = parse_numbers(csv_line)

    (Path(__file__).resolve().parent / "starter_output.txt").write_text(
        f"TODO count={len(values)}\n", encoding="utf-8"
    )

    assert values, "Starter assertion intentionally triggers until parse_numbers is implemented."


if __name__ == "__main__":
    main()
