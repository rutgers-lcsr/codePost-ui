const demoNotebookGrader = JSON.stringify(
  {
    cells: [
      {
        cell_type: 'markdown',
        metadata: {
          id: 'demo-cell-intro',
          language: 'markdown',
        },
        source: [
          '# Demo notebook: runtime analysis\n',
          'This notebook shows a tiny benchmark and plot used in the codePost demo.\n',
        ],
      },
      {
        cell_type: 'code',
        metadata: {
          id: 'demo-cell-imports',
          language: 'python',
        },
        execution_count: 1,
        source: ['import math\n', 'print("Loaded math module")\n'],
        outputs: [
          {
            output_type: 'stream',
            name: 'stdout',
            text: ['Loaded math module\n'],
          },
        ],
      },
      {
        cell_type: 'code',
        metadata: {
          id: 'demo-cell-plot',
          language: 'python',
        },
        execution_count: 2,
        source: [
          'xs = [1, 2, 3, 4, 5]\n',
          'ys = [x * x for x in xs]\n',
          'print("Max value:", max(ys))\n',
          '# imagine matplotlib plotting here\n',
        ],
        outputs: [
          {
            output_type: 'stream',
            name: 'stdout',
            text: ['Max value: 25\n'],
          },
          {
            output_type: 'execute_result',
            execution_count: 2,
            data: {
              'text/plain': ['[1, 4, 9, 16, 25]'],
            },
            metadata: {},
          },
          {
            output_type: 'display_data',
            data: {
              'image/svg+xml': [
                '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220" viewBox="0 0 420 220">',
                '<rect width="420" height="220" fill="#ffffff"/>',
                '<line x1="50" y1="180" x2="390" y2="180" stroke="#1f2937" stroke-width="2"/>',
                '<line x1="50" y1="180" x2="50" y2="20" stroke="#1f2937" stroke-width="2"/>',
                '<text x="16" y="28" font-size="12" fill="#111827">y</text>',
                '<text x="392" y="198" font-size="12" fill="#111827">x</text>',
                '<polyline points="70,170 130,155 190,130 250,95 310,50" fill="none" stroke="#2563eb" stroke-width="3"/>',
                '<circle cx="70" cy="170" r="4" fill="#1d4ed8"/>',
                '<circle cx="130" cy="155" r="4" fill="#1d4ed8"/>',
                '<circle cx="190" cy="130" r="4" fill="#1d4ed8"/>',
                '<circle cx="250" cy="95" r="4" fill="#1d4ed8"/>',
                '<circle cx="310" cy="50" r="4" fill="#1d4ed8"/>',
                '<text x="210" y="18" text-anchor="middle" font-size="14" fill="#111827">y = x² (demo graph)</text>',
                '</svg>',
              ],
            },
            metadata: {},
          },
        ],
      },
    ],
    metadata: {
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3',
        language: 'python',
      },
      language_info: {
        name: 'python',
      },
    },
    nbformat: 4,
    nbformat_minor: 5,
  },
  null,
  2,
);

const demoNotebookStudent = JSON.stringify(
  {
    cells: [
      {
        cell_type: 'markdown',
        metadata: {
          id: 'demo-cell-intro',
          language: 'markdown',
        },
        source: ['# Student notebook\n', 'Exploring growth patterns with tiny datasets.\n'],
      },
      {
        cell_type: 'code',
        metadata: {
          id: 'demo-cell-imports',
          language: 'python',
        },
        execution_count: 1,
        source: ['values = [1, 2, 3, 4, 5]\n', 'squares = [x*x for x in values]\n', 'squares\n'],
        outputs: [
          {
            output_type: 'execute_result',
            execution_count: 1,
            data: {
              'text/plain': ['[1, 4, 9, 16, 25]'],
            },
            metadata: {},
          },
        ],
      },
      {
        cell_type: 'code',
        metadata: {
          id: 'demo-cell-plot',
          language: 'python',
        },
        execution_count: 2,
        source: ['print("Plot generated")\n', '# chart output shown below\n'],
        outputs: [
          {
            output_type: 'stream',
            name: 'stdout',
            text: ['Plot generated\n'],
          },
          {
            output_type: 'display_data',
            data: {
              'image/svg+xml': [
                '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220" viewBox="0 0 420 220">',
                '<rect width="420" height="220" fill="#ffffff"/>',
                '<line x1="50" y1="180" x2="390" y2="180" stroke="#111827" stroke-width="2"/>',
                '<line x1="50" y1="180" x2="50" y2="20" stroke="#111827" stroke-width="2"/>',
                '<polyline points="70,165 130,150 190,120 250,85 310,42" fill="none" stroke="#16a34a" stroke-width="3"/>',
                '<text x="210" y="18" text-anchor="middle" font-size="14" fill="#111827">Student result graph</text>',
                '</svg>',
              ],
            },
            metadata: {},
          },
        ],
      },
    ],
    metadata: {
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3',
        language: 'python',
      },
      language_info: {
        name: 'python',
      },
    },
    nbformat: 4,
    nbformat_minor: 5,
  },
  null,
  2,
);

export const demoFilesGrader = [
  {
    id: 1,
    name: 'Loops.py',
    extension: 'py',
    data: `"""Assignment 2: Loops utilities."""

from typing import List


def max_value(values: List[int]) -> int:
    """Return the max element in values.

    Intentional bug for demo feedback/testing:
    initializes at 0, so all-negative arrays fail.
    """
    max_so_far = 0
    for value in values:
        if value > max_so_far:
            max_so_far = value
    return max_so_far


def reverse(values: List[int]) -> List[int]:
    """Return a reversed copy of values.

    Intentional off-by-one bug for demo feedback/testing.
    """
    reversed_values: List[int] = []
    for i in range(len(values), -1, -1):
        reversed_values.append(values[i])
    return reversed_values


if __name__ == "__main__":
    print(max_value([1, 2, 3]))
`,
    comments: [],
    submission: 1,
    path: null,
    created: '',
    modified: '',
  },
  {
    id: 2,
    name: 'Recursion.py',
    extension: 'py',
    data: `"""Assignment 3: Recursion utilities."""

from typing import List


def sum_recursive(values: List[int]) -> int:
    """Return the sum of values recursively.

    Intentional bug for demo feedback/testing:
    does not handle the empty list base case.
    """
    if len(values) == 1:
        return values[0]
    return values[0] + sum_recursive(values[1:])


def contains_recursive(values: List[int], target: int) -> bool:
    """Return True if target appears in values."""
    if not values:
        return False
    if values[0] == target:
        return True
    return contains_recursive(values[1:], target)
`,
    comments: [],
    submission: 1,
    path: null,
    created: '',
    modified: '',
  },
  {
    id: 3,
    name: 'analysis_notebook.ipynb',
    extension: 'ipynb',
    data: demoNotebookGrader,
    comments: [],
    submission: 1,
    path: null,
    created: '',
    modified: '',
  },
];

export const demoFilesStudent = [
  {
    id: 1,
    name: 'Loops.py',
    extension: 'py',
    data: `"""Student submission for loop utilities."""

from typing import List


def sort(values: List[int]) -> List[int]:
    swapped = True
    while swapped:
        swapped = False
        for i in range(len(values) - 1):
            if values[i] > values[i + 1]:
                values[i], values[i + 1] = values[i + 1], values[i]
                swapped = True
    return values


def reverse(values: List[int]) -> List[int]:
    reversed_values: List[int] = []
    for i in range(len(values), -1, -1):
        reversed_values.append(values[i])
    return reversed_values


def max_value(values: List[int]) -> int:
    max_so_far = 0
    for value in values:
        if value > max_so_far:
            max_so_far = value
    return max_so_far
`,
    comments: [],
    submission: 1,
    path: null,
    created: '',
    modified: '',
  },
  {
    id: 2,
    name: 'Recursion.py',
    extension: 'py',
    data: `"""Student submission for recursion utilities."""

from typing import List


def sum_recursive(values: List[int]) -> int:
    if len(values) == 1:
        return values[0]
    return values[0] + sum_recursive(values[1:])


def contains_recursive(values: List[int], target: int) -> bool:
    if values[0] == target:
        return True
    return contains_recursive(values[1:], target)
`,
    comments: [],
    submission: 1,
    path: null,
    created: '',
    modified: '',
  },
  {
    id: 3,
    name: 'analysis_notebook.ipynb',
    extension: 'ipynb',
    data: demoNotebookStudent,
    comments: [],
    submission: 1,
    path: null,
    created: '',
    modified: '',
  },
];
