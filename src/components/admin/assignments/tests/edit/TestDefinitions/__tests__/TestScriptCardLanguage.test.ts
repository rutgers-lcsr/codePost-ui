// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import {
  normalizeCardScriptLanguage,
  defaultLogicForLanguage,
  codeEditorExtensionByLanguage,
  parseCardScript,
  generateCardScript,
  ICardTestItem,
} from '../TestScriptCardLanguage';

// ---------------------------------------------------------------------------
// normalizeCardScriptLanguage
// ---------------------------------------------------------------------------
describe('normalizeCardScriptLanguage', () => {
  it.each([
    ['python3', 'python'],
    ['Python', 'python'],
    ['ipynb', 'python'],
    ['jupyter', 'python'],
    ['java', 'java'],
    ['java-11', 'java'],
    ['r', 'r'],
    ['r-4', 'r'],
    ['c/c++', 'cpp'],
    ['c++', 'cpp'],
    ['cpp', 'cpp'],
    ['c', 'cpp'],
    ['node', 'js'],
    ['javascript', 'js'],
    ['js', 'js'],
    ['typescript', 'js'],
    ['ruby', 'ruby'],
    ['rb', 'ruby'],
    ['php', 'php'],
    ['unknown', 'other'],
    ['', 'other'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeCardScriptLanguage(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// defaultLogicForLanguage
// ---------------------------------------------------------------------------
describe('defaultLogicForLanguage', () => {
  it.each([
    ['python', 'assert add(1, 2) == 3'],
    ['java', 'assertEquals(3, add(1, 2));'],
    ['js', "if (add(1, 2) !== 3) throw new Error('Expected 3');"],
    ['r', 'stopifnot(add(1, 2) == 3)'],
    ['cpp', 'assertTrue(add(1, 2) == 3, "Expected 3");'],
    ['ruby', "raise 'Expected 3' unless add(1, 2) == 3"],
    ['php', "if (add(1, 2) !== 3) { throw new Exception('Expected 3'); }"],
    ['other', '// test logic'],
  ])('%s returns expected default', (lang, expected) => {
    expect(defaultLogicForLanguage(lang)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// codeEditorExtensionByLanguage
// ---------------------------------------------------------------------------
describe('codeEditorExtensionByLanguage', () => {
  it.each([
    ['python', 'py'],
    ['java', 'java'],
    ['js', 'js'],
    ['r', 'r'],
    ['cpp', 'c'],
    ['ruby', 'rb'],
    ['php', 'php'],
    ['other', 'txt'],
  ])('%s -> %s', (lang, ext) => {
    expect(codeEditorExtensionByLanguage(lang)).toBe(ext);
  });
});

// ---------------------------------------------------------------------------
// parseCardScript
// ---------------------------------------------------------------------------
describe('parseCardScript', () => {
  it('returns empty array for empty code', () => {
    expect(parseCardScript('', 'python')).toEqual([]);
  });

  it('returns raw code item for unknown language', () => {
    const result = parseCardScript('some code', 'brainfuck');
    expect(result).toEqual([{ id: 'code-0', type: 'code', logic: 'some code' }]);
  });

  // Python
  it('parses a Python test', () => {
    const code = `@test("Add numbers", points=5, description="Test addition", timeout=10)\ndef test_add():\n    assert add(1, 2) == 3\n`;
    const items = parseCardScript(code, 'python');
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('test');
    expect(items[0].name).toBe('Add numbers');
    expect(items[0].points).toBe(5);
    expect(items[0].description).toBe('Test addition');
    expect(items[0].timeout).toBe(10);
    expect(items[0].logic).toContain('assert add(1, 2) == 3');
  });

  it('parses Python with raw code before and after test', () => {
    const code = `import math\n\n@test("t1", points=1)\ndef test_t1():\n    pass\n\nprint("done")\n`;
    const items = parseCardScript(code, 'python');
    expect(items.length).toBe(3);
    expect(items[0].type).toBe('code');
    expect(items[1].type).toBe('test');
    expect(items[2].type).toBe('code');
  });

  // Java
  it('parses a Java test', () => {
    const code = `@Test(name="Add", points=5, description="desc", timeout=10)\npublic Object[] testAdd() {\n    assertEquals(3, add(1, 2));\n    return new Object[]{0.0, ""};\n}\n`;
    const items = parseCardScript(code, 'java');
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Add');
    expect(items[0].points).toBe(5);
    expect(items[0].description).toBe('desc');
    expect(items[0].timeout).toBe(10);
  });

  it('parses Java with raw code', () => {
    const code = `import org.junit.*;\n\n@Test(name="t", points=1)\npublic Object[] t() {\n    return new Object[]{0.0, ""};\n}\n`;
    const items = parseCardScript(code, 'java');
    expect(items.length).toBe(2);
    expect(items[0].type).toBe('code');
    expect(items[1].type).toBe('test');
  });

  // JavaScript
  it('parses a JS test with arrow function', () => {
    const code = `test("Add", 5, "desc", () => {\n    if (add(1,2) !== 3) throw new Error();\n}, 10);\n`;
    const items = parseCardScript(code, 'js');
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Add');
    expect(items[0].points).toBe(5);
    expect(items[0].description).toBe('desc');
    expect(items[0].timeout).toBe(10);
  });

  // R
  it('parses an R test', () => {
    const code = `run_test("Add", 5, "desc", function() {\n    stopifnot(add(1, 2) == 3)\n}, 10)\n`;
    const items = parseCardScript(code, 'r');
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Add');
    expect(items[0].points).toBe(5);
    expect(items[0].description).toBe('desc');
    expect(items[0].timeout).toBe(10);
  });

  // C++
  it('parses a C++ TEST macro', () => {
    const code = `TEST(AddTest, 5) {\n    assertTrue(add(1, 2) == 3, "fail");\n}\n`;
    const items = parseCardScript(code, 'cpp');
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('AddTest');
    expect(items[0].points).toBe(5);
  });

  it('parses C++ TEST_DESC macro', () => {
    const code = `TEST_DESC(AddTest, 5, "Test addition") {\n    assertTrue(true, "ok");\n}\n`;
    const items = parseCardScript(code, 'cpp');
    expect(items[0].description).toBe('Test addition');
  });

  it('parses C++ TEST_TIMEOUT macro', () => {
    const code = `TEST_TIMEOUT(AddTest, 5, 30) {\n    assertTrue(true, "ok");\n}\n`;
    const items = parseCardScript(code, 'cpp');
    expect(items[0].timeout).toBe(30);
  });

  it('parses C++ TEST_DESC_TIMEOUT macro', () => {
    const code = `TEST_DESC_TIMEOUT(AddTest, 5, "desc", 20) {\n    assertTrue(true, "ok");\n}\n`;
    const items = parseCardScript(code, 'cpp');
    expect(items[0].description).toBe('desc');
    expect(items[0].timeout).toBe(20);
  });

  // Ruby
  it('parses a Ruby test', () => {
    const code = `run_test("Add", 5, "desc", 10) do\n    raise 'fail' unless add(1, 2) == 3\nend\n`;
    const items = parseCardScript(code, 'ruby');
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Add');
    expect(items[0].points).toBe(5);
    expect(items[0].description).toBe('desc');
    expect(items[0].timeout).toBe(10);
  });

  // PHP
  it('parses a PHP test', () => {
    const code = `Tester::test("Add", 5, "desc", function() {\n    if (add(1, 2) !== 3) throw new Exception("fail");\n}, 10);\n`;
    const items = parseCardScript(code, 'php');
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Add');
    expect(items[0].points).toBe(5);
    expect(items[0].description).toBe('desc');
    expect(items[0].timeout).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// generateCardScript
// ---------------------------------------------------------------------------
describe('generateCardScript', () => {
  const testItem: ICardTestItem = {
    id: 'test-0',
    type: 'test',
    name: 'Add numbers',
    points: 5,
    description: 'Test addition',
    timeout: 10,
    logic: 'assert add(1, 2) == 3',
  };

  const codeItem: ICardTestItem = {
    id: 'code-0',
    type: 'code',
    logic: 'import math',
  };

  it('generates Python test script', () => {
    const result = generateCardScript([testItem], 'python');
    expect(result).toContain('@test("Add numbers", points=5');
    expect(result).toContain('description="Test addition"');
    expect(result).toContain('timeout=10');
    expect(result).toContain('def test_add_numbers():');
    expect(result).toContain('assert add(1, 2) == 3');
  });

  it('generates Java test script', () => {
    const result = generateCardScript([testItem], 'java');
    expect(result).toContain('@Test(name="Add numbers", points=5');
    expect(result).toContain('description="Test addition"');
    expect(result).toContain('timeout=10');
    expect(result).toContain('public Object[]');
    expect(result).toContain('return new Object[]{0.0, ""};');
  });

  it('generates Java test without return statement in logic', () => {
    const item = { ...testItem, logic: 'assertEquals(3, add(1, 2));' };
    const result = generateCardScript([item], 'java');
    expect(result).toContain('return new Object[]{0.0, ""};');
  });

  it('generates Java test with existing return statement', () => {
    const item = { ...testItem, logic: 'return new Object[]{1.0, "ok"};' };
    const result = generateCardScript([item], 'java');
    // Should NOT add a second return statement
    expect(result.match(/return/g)?.length).toBe(1);
  });

  it('generates JS test script', () => {
    const result = generateCardScript([testItem], 'js');
    expect(result).toContain('test("Add numbers", 5');
    expect(result).toContain('"Test addition"');
    expect(result).toContain(', 10);');
  });

  it('generates R test script', () => {
    const result = generateCardScript([testItem], 'r');
    expect(result).toContain('run_test("Add numbers", 5');
    expect(result).toContain('"Test addition"');
    expect(result).toContain(', 10)');
  });

  it('generates C++ test with description and timeout', () => {
    const result = generateCardScript([testItem], 'cpp');
    expect(result).toContain('TEST_DESC_TIMEOUT(');
    expect(result).toContain('"Test addition"');
    expect(result).toContain(', 10)');
  });

  it('generates C++ test with only description', () => {
    const item = { ...testItem, timeout: undefined };
    const result = generateCardScript([item], 'cpp');
    expect(result).toContain('TEST_DESC(');
  });

  it('generates C++ test with only timeout', () => {
    const item = { ...testItem, description: '' };
    const result = generateCardScript([item], 'cpp');
    expect(result).toContain('TEST_TIMEOUT(');
  });

  it('generates C++ test without description or timeout', () => {
    const item = { ...testItem, description: '', timeout: undefined };
    const result = generateCardScript([item], 'cpp');
    expect(result).toContain('TEST(');
    expect(result).not.toContain('TEST_DESC');
    expect(result).not.toContain('TEST_TIMEOUT');
  });

  it('generates Ruby test script', () => {
    const result = generateCardScript([testItem], 'ruby');
    expect(result).toContain('run_test("Add numbers", 5');
    expect(result).toContain('"Test addition"');
    expect(result).toContain(', 10) do');
    expect(result).toContain('end');
  });

  it('generates PHP test script', () => {
    const result = generateCardScript([testItem], 'php');
    expect(result).toContain('Tester::test("Add numbers", 5');
    expect(result).toContain('"Test addition"');
    expect(result).toContain(', 10);');
  });

  it('generates raw code for unknown language', () => {
    const result = generateCardScript([testItem], 'brainfuck');
    expect(result.trim()).toBe('assert add(1, 2) == 3');
  });

  it('includes code items in output', () => {
    const result = generateCardScript([codeItem, testItem], 'python');
    expect(result).toContain('import math');
    expect(result).toContain('@test(');
  });

  it('filters empty items', () => {
    const emptyItem: ICardTestItem = { id: 'code-1', type: 'code', logic: '' };
    const result = generateCardScript([emptyItem, testItem], 'python');
    expect(result).toContain('@test(');
  });

  it('uses default logic when item has no logic', () => {
    const noLogic = { ...testItem, logic: '' };
    const result = generateCardScript([noLogic], 'python');
    expect(result).toContain('assert add(1, 2) == 3');
  });

  it('uses "New Test" when item has no name', () => {
    const noName = { ...testItem, name: '' };
    const result = generateCardScript([noName], 'python');
    expect(result).toContain('"New Test"');
  });
});

// ---------------------------------------------------------------------------
// Round-trip: parse -> generate -> parse
// ---------------------------------------------------------------------------
describe('round-trip', () => {
  it('round-trips a Python test', () => {
    const code = `@test("Add", points=5, description="desc")\ndef test_add():\n    assert add(1, 2) == 3\n`;
    const items = parseCardScript(code, 'python');
    const generated = generateCardScript(items, 'python');
    const reparsed = parseCardScript(generated, 'python');
    expect(reparsed.length).toBe(items.length);
    expect(reparsed[0].name).toBe(items[0].name);
    expect(reparsed[0].points).toBe(items[0].points);
  });

  it('round-trips a Java test', () => {
    const code = `@Test(name="Add", points=5)\npublic Object[] testAdd() {\n    assertEquals(3, add(1, 2));\n    return new Object[]{0.0, ""};\n}\n`;
    const items = parseCardScript(code, 'java');
    const generated = generateCardScript(items, 'java');
    const reparsed = parseCardScript(generated, 'java');
    expect(reparsed.length).toBe(items.length);
    expect(reparsed[0].name).toBe(items[0].name);
  });
});
