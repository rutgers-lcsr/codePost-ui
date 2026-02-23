# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
"""Python complete submission fixture."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def parse_numbers(csv_line: str) -> list[int]:
    return [int(part.strip()) for part in csv_line.split(",")]


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    csv_line = (base_dir.parent / "existing_data.txt").read_text(encoding="utf-8").strip()
    values = parse_numbers(csv_line)

    summary = {
        "count": len(values),
        "sum": sum(values),
        "max": max(values),
    }
    (base_dir / "result_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    markdown_lines = [
        "# Python Rendering Preview",
        "",
        "- Unicode: café λ 🚀",
        "- Status: success",
        "",
        "```text",
        "idx | value",
        "-----------",
    ]
    markdown_lines.extend(f"{idx}   | {value}" for idx, value in enumerate(values))
    markdown_lines.extend(["```", ""])
    (base_dir / "render_preview.md").write_text("\n".join(markdown_lines), encoding="utf-8")

    plt.figure(figsize=(6, 3))
    plt.plot(values, marker="o")
    plt.title("Python Compatibility Plot")
    plt.xlabel("Index")
    plt.ylabel("Value")
    plt.tight_layout()
    plt.savefig(base_dir / "plot.png")

    assert summary["count"] == 5, "Expected five values."
    assert summary["sum"] == 50, "Expected sum to equal 50."
    assert summary["max"] == 21, "Expected max to equal 21."

    print("=== PYTHON RENDER TEST START ===")
    print("unicode: café λ 🚀")
    print('json: {"language":"python","status":"ok"}')
    print("idx | value")
    for idx, value in enumerate(values):
        print(f"{idx:>3} | {value}")
    print("[stderr][python] Render check stderr line", file=sys.stderr)
    print("Python compatibility checks passed.")


if __name__ == "__main__":
    main()
