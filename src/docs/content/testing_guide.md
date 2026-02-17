# Testing Guide

This guide is the source of truth for script-based test syntax in codePost.

It is written to match the current backend parser behavior.

## Where to find testing in the UI

1. Go to **Admin Console > Assignments > Environment**.
2. Select an assignment from **Environment Setup**.
3. Select a **Test Category** (or create one).
4. Open the **Test Script** editor.
5. Use **Code**, **Split Preview**, or **Builder** view.

## Quick workflow

1. Set the assignment **Environment Language** first.
2. Create/open a **Test Category**.
3. Add script tests in **Test Script**.
4. Select a **Target File** for context-aware suggestions and helpers. (This is required as it will determine which file the test will run against and what context the AI will use for suggestions.)
5. Confirm parsing in **Split Preview**.
6. Save category and verify generated test cases.

> [!IMPORTANT]
> You can only create tests after an assignment environment exists in **Environment Setup**. An environment is usually created automatically when you upload assignment files. The assignment language determines how the script is parsed, so set that first.

> [!TIP]
> Save early and often while writing tests. The parser syncs test cases from your script.

## How script parsing works

- codePost parses your script by language and creates/updates test cases automatically.
- Each test should define at least:
  - a **name**
  - a **points** value
- Category **max points** is computed as the sum of parsed `points` values.
- On save, codePost syncs test cases by parsed function identity:
  - creates new tests
  - updates existing tests
  - removes tests no longer present in the script

> [!IMPORTANT]
> Keep test names stable and unique in a category so updates are predictable.

## What fields are extracted

The parser extracts (when present):

- `functionName` (internal identifier)
- `name` (display title)
- `description` (optional)
- `points`
- `timeout` (optional; defaults to `30` seconds when omitted)

## Language syntax reference

The table below shows **recognized parser formats**.

| Language   | Recognized format                                                | Notes                                                                                |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Python     | `@test(...)` on `def`                                            | Supports positional first arg for `name`; `points` should be keyword (`points=...`). |
| Java       | `@Test(...)` on `public` method                                  | Regex-based; expects annotation + `public <type> <methodName>`.                      |
| R          | `run_test("Name", points, "desc", function() { ... }, timeout)`  | Current parser expects `run_test(...)` (not roxygen `#' @test`).                     |
| C/C++      | `TEST`, `TEST_DESC`, `TEST_TIMEOUT`, `TEST_DESC_TIMEOUT`         | Macro name becomes internal identifier.                                              |
| Node/JS/TS | `test("Name", points, "desc", fn, timeout);`                     | Parser expects semicolon-terminated `test(...)` statements.                          |
| Ruby       | `run_test("Name", points, "desc", timeout)`                      | Timeout optional in parser.                                                          |
| PHP        | `Tester::test("Name", points, "desc", function(){...}, timeout)` | Parser extracts name/points/description; timeout may not be extracted.               |

## Supported script formats

### Python

Use `@test(...)` above a function.

```python
@test(name="Addition Test", points=5, description="Verifies add() works", timeout=30)
def test_addition():
    assert add(1, 2) == 3

@test("Positional Name", points=3)
def test_positional_name():
  assert True
```

### Java

Use `@Test(...)` on a public method.

```java
@Test(name="Addition Test", points=5, description="Verifies add() works", timeout=30)
public Object testAddition() {
    assertEquals(3, Main.add(1, 2));
    return null;
}

@Test(name="Edge Cases", points=2)
public Object testEdges() {
  return null;
}
```

### R

Use `run_test(...)`.

```r
run_test("Addition Test", 5, "Verifies add() works", function() {
  stopifnot(add(1, 2) == 3)
}, 30)

run_test("No Description", 2, function() {
  stopifnot(TRUE)
})
```

### C/C++

Use test macros.

```cpp
TEST(AdditionTest, 5.0) {
  assertTrue(add(1, 2) == 3, "1+2 should be 3");
}

TEST_DESC_TIMEOUT(PartialCredit, 10.0, "Awards partial credit", 30) {
  return_score(5, "Partial credit");
}

TEST_TIMEOUT(SmokeTest, 1.0, 10) {
  assertTrue(true, "smoke");
}
```

### Node / JavaScript / TypeScript

Use `test(...)`.

```js
test(
  'Addition Test',
  5,
  'Verifies add() works',
  () => {
    if (add(1, 2) !== 3) throw new Error('1+2 should be 3');
  },
  30,
);

test('No Timeout', 2, 'quick check', () => {
  if (1 + 1 !== 2) throw new Error('math broke');
});
```

### Ruby

Use `run_test(...)`.

```rb
run_test("Addition Test", 5, "Verifies add() works", 30) do
  raise "1+2 should be 3" unless add(1, 2) == 3
end

run_test("No Timeout", 2, "quick check") do
  raise "failed" unless true
end
```

### PHP

Use `Tester::test(...)`.

```php
Tester::test("Addition Test", 5, "Verifies add() works", function () {
    if (add(1, 2) !== 3) {
        throw new Exception("1+2 should be 3");
    }
}, 30);

Tester::test("No Description", 2, function () {
  if (1 + 1 !== 2) {
    throw new Exception("math broke");
  }
});
```

## Scoring and points behavior

- `points` in script become each test case's **pointsPass** value.
- Category `maxPoints` is auto-updated from total parsed points.
- If parsing misses a test, its points will not contribute to category totals.

## Return patterns (full vs partial, with/without message)

Use these patterns inside your test function/body to control scoring.

### Python (`@test`)

```python
# Full credit, no message
return

# Full credit, with message
return 10, "Perfect solution"

# Partial credit, no message
return 6

# Partial credit, with message
return 6, "Correct core logic, missing edge case"
```

### Java (`@Test`)

```java
// Full credit, no message
return null;

// Full credit, with message
return "Perfect solution";

// Partial credit, no message
return 6;

// Partial credit, with message (array)
return new Object[]{6, "Correct core logic, missing edge case"};

// Partial credit, with message (list)
return java.util.List.of(6, "Correct core logic, missing edge case");
```

### R (`run_test`)

```r
# Full credit, no message
return(NULL)

# Full credit, with message
return(list(score = 10, message = "Perfect solution"))

# Partial credit, no message
return(6)

# Partial credit, with message (positional)
return(list(6, "Correct core logic, missing edge case"))

# Partial credit, with message (named)
return(list(score = 6, message = "Correct core logic, missing edge case"))
```

### C/C++ (`TEST*` macros)

```cpp
// Full credit, no message
return;

// Full credit, with message
return return_score(10.0, "Perfect solution");

// Partial credit, no message
return 6.0;

// Partial credit, with message (helper)
return return_score(6.0, "Correct core logic, missing edge case");

// Partial credit, with message (pair)
return std::make_pair(6.0, std::string("Correct core logic, missing edge case"));
```

### Node / JavaScript / TypeScript (`test(...)`)

```js
// Full credit, no message
return;

// Full credit, with message
return 'Perfect solution';

// Partial credit, no message
return 6;

// Partial credit, with message (array)
return [6, 'Correct core logic, missing edge case'];

// Partial credit, with message (object)
return { score: 6, message: 'Correct core logic, missing edge case' };
```

### Ruby (`run_test`)

```rb
# Full credit, no message
return nil

# Full credit, with message
return "Perfect solution"

# Partial credit, no message
return 6

# Partial credit, with message
return [6, "Correct core logic, missing edge case"]
```

### PHP (`Tester::test`)

```php
// Full credit, no message
return null;

// Full credit, with message
return "Perfect solution";

// Partial credit, no message
return 6;

// Partial credit, with message (indexed array)
return [6, "Correct core logic, missing edge case"];

// Partial credit, with message (associative array)
return ["score" => 6, "message" => "Correct core logic, missing edge case"];
```

> [!NOTE]
> In all languages, score values are clamped to the valid range: `0 <= score <= points`.
> If a return shape is not recognized, the test usually defaults to full-credit pass unless an assertion/exception fails.

## Parser gotchas (important)

- **R:** use `run_test(...)` for parser compatibility.
- **Java:** method must match the parser-friendly `@Test(...)` + `public` signature.
- **Node/JS/TS:** terminate tests with `;` to match current parser pattern.
- **Python:** using `points` as a keyword is safest.
- **Cross-language:** malformed syntax may silently reduce parsed tests.

## Troubleshooting checklist

If preview shows no tests or fewer tests than expected:

1. Confirm assignment **Environment Language** is correct.
2. Check syntax against this guide's exact pattern.
3. Verify each test has a parseable `name` and `points`.
4. Ensure your script is saved in the category.
5. Re-open Split Preview after edits.

If totals look wrong:

1. Search for tests missing `points`.
2. Look for syntax errors that stop pattern matching.
3. Check if renamed/removed tests were intentionally changed.

## Tips

- Use **Split Preview** to verify parsing and points.
- Set the **Target File** so helpers/AI suggestions use the right context.
- Start with Builder view if you want scaffolding, then refine in Code view.

## Notes

- Parsing and preview behavior depend on the assignment environment language.
- If script syntax is invalid, preview may return no tests or an error hint.
