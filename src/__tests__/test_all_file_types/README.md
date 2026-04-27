# Homework 3: Binary Search Trees

## Overview

In this assignment you will implement a **Binary Search Tree (BST)** in Python.
Your implementation must support the following operations:

| Operation | Method        | Time Complexity (avg) |
| :-------- | :------------ | :-------------------: |
| Insert    | `insert(key)` |       O(log n)        |
| Delete    | `delete(key)` |       O(log n)        |
| Search    | `search(key)` |       O(log n)        |
| In-order  | `inorder()`   |         O(n)          |
| Pre-order | `preorder()`  |         O(n)          |

## Requirements

1. Implement the `BST` class in `bst.py`
2. Write unit tests in `test_bst.py`
3. Handle edge cases:
   - Inserting duplicate keys
   - Deleting from an empty tree
   - Deleting a node with two children

## Example

```python
tree = BST()
for val in [50, 30, 70, 20, 40, 60, 80]:
    tree.insert(val)

print(tree.inorder())   # [20, 30, 40, 50, 60, 70, 80]
print(tree.search(40))  # True
print(tree.search(99))  # False
```

## Grading

- **60%** — Correctness (autograder tests)
- **20%** — Code style and documentation
- **20%** — Your own test coverage

> **Note**: Late submissions lose 10 points per day, up to 3 days.
> After 3 days, submissions will not be accepted.

## Resources

- [Visualgo BST](https://visualgo.net/en/bst) — interactive BST visualization
- Textbook Chapter 12: Binary Search Trees
- Office hours: Mon/Wed 3–5 PM, Hill 252
