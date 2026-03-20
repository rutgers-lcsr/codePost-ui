// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';
import {
  generateCardScript,
  normalizeCardScriptLanguage,
  parseCardScript,
  defaultLogicForLanguage,
  codeEditorExtensionByLanguage,
} from './TestScriptCardLanguage';

describe('TestScriptCardLanguage', () => {
  it('normalizes language aliases', () => {
    expect(normalizeCardScriptLanguage('java-17')).toBe('java');
    expect(normalizeCardScriptLanguage('node-20')).toBe('js');
    expect(normalizeCardScriptLanguage('r-4')).toBe('r');
    expect(normalizeCardScriptLanguage('c/c++')).toBe('cpp');
  });

  it('parses Java tests into structured items', () => {
    const script = `
@Test(name="Addition", points=5, description="adds values", timeout=15)
public void testAddition() {
    assertEquals(3, add(1, 2));
}
`;

    const items = parseCardScript(script, 'java-17');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'test',
      name: 'Addition',
      points: 5,
      description: 'adds values',
      timeout: 15,
    });
    expect(items[0].logic).toContain('assertEquals(3, add(1, 2));');
  });

  it('parses R run_test blocks with optional timeout', () => {
    const script = `
run_test("Vector Sum", 2, "checks sum", function() {
    stopifnot(sum(c(1, 2, 3)) == 6)
}, 12)
`;

    const items = parseCardScript(script, 'r-4');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'test',
      name: 'Vector Sum',
      points: 2,
      description: 'checks sum',
      timeout: 12,
    });
    expect(items[0].logic).toContain('stopifnot(sum(c(1, 2, 3)) == 6)');
  });

  it('generates JavaScript tests with timeout argument', () => {
    const script = generateCardScript(
      [
        {
          id: '1',
          type: 'test',
          name: 'Handles edge case',
          points: 3,
          description: 'verifies fallback',
          timeout: 10,
          logic: "if (result !== 42) throw new Error('nope');",
        },
      ],
      'node-20',
    );

    expect(script).toContain('test("Handles edge case", 3, "verifies fallback", () => {');
    expect(script).toContain('}, 10);');
  });

  it('generates Java tests with Object[] return contract', () => {
    const script = generateCardScript(
      [
        {
          id: '1',
          type: 'test',
          name: 'Java Return Shape',
          points: 2,
          description: 'checks return contract',
          logic: 'assertEquals(3, add(1, 2));',
        },
      ],
      'java-17',
    );

    expect(script).toContain('public Object[] test_Java_Return_Shape() {');
    expect(script).toContain('return new Object[]{0.0, ""};');
  });

  it('generates C++ macro variant with description and timeout', () => {
    const script = generateCardScript(
      [
        {
          id: '1',
          type: 'test',
          name: 'sum test',
          points: 4,
          description: 'checks sum',
          timeout: 30,
          logic: 'assertTrue(sum(1, 2) == 3, "sum mismatch");',
        },
      ],
      'c/c++',
    );

    expect(script).toContain('TEST_DESC_TIMEOUT(sum_test, 4, "checks sum", 30)');
    expect(script).toContain('assertTrue(sum(1, 2) == 3, "sum mismatch");');
  });

  it('preserves raw code for unsupported languages', () => {
    const script = 'echo hello world';
    const items = parseCardScript(script, 'haskell');

    expect(items).toEqual([{ id: 'code-0', type: 'code', logic: script }]);
  });

  // ---------------------------------------------------------------------------
  // normalizeCardScriptLanguage — additional aliases
  // ---------------------------------------------------------------------------
  describe('normalizeCardScriptLanguage extended', () => {
    it('maps python variants', () => {
      expect(normalizeCardScriptLanguage('python3')).toBe('python');
      expect(normalizeCardScriptLanguage('ipynb')).toBe('python');
      expect(normalizeCardScriptLanguage('jupyter')).toBe('python');
    });

    it('maps cpp variants', () => {
      expect(normalizeCardScriptLanguage('c')).toBe('cpp');
      expect(normalizeCardScriptLanguage('cpp')).toBe('cpp');
      expect(normalizeCardScriptLanguage('C++')).toBe('cpp');
    });

    it('maps javascript variants', () => {
      expect(normalizeCardScriptLanguage('javascript')).toBe('js');
      expect(normalizeCardScriptLanguage('typescript')).toBe('js');
    });

    it('maps ruby', () => {
      expect(normalizeCardScriptLanguage('ruby')).toBe('ruby');
      expect(normalizeCardScriptLanguage('rb')).toBe('ruby');
    });

    it('maps php', () => {
      expect(normalizeCardScriptLanguage('php')).toBe('php');
    });

    it('returns other for unknown languages', () => {
      expect(normalizeCardScriptLanguage('haskell')).toBe('other');
      expect(normalizeCardScriptLanguage('')).toBe('other');
    });
  });

  // ---------------------------------------------------------------------------
  // defaultLogicForLanguage / codeEditorExtensionByLanguage
  // ---------------------------------------------------------------------------
  describe('helper exports', () => {
    it('defaultLogicForLanguage returns language-appropriate defaults', () => {
      expect(defaultLogicForLanguage('python3')).toContain('assert');
      expect(defaultLogicForLanguage('java')).toContain('assertEquals');
      expect(defaultLogicForLanguage('node-20')).toContain('throw');
      expect(defaultLogicForLanguage('r')).toContain('stopifnot');
      expect(defaultLogicForLanguage('c/c++')).toContain('assertTrue');
      expect(defaultLogicForLanguage('ruby')).toContain('raise');
      expect(defaultLogicForLanguage('php')).toContain('Exception');
      expect(defaultLogicForLanguage('haskell')).toContain('test logic');
    });

    it('codeEditorExtensionByLanguage returns correct extensions', () => {
      expect(codeEditorExtensionByLanguage('python3')).toBe('py');
      expect(codeEditorExtensionByLanguage('java')).toBe('java');
      expect(codeEditorExtensionByLanguage('node-20')).toBe('js');
      expect(codeEditorExtensionByLanguage('r')).toBe('r');
      expect(codeEditorExtensionByLanguage('c/c++')).toBe('c');
      expect(codeEditorExtensionByLanguage('ruby')).toBe('rb');
      expect(codeEditorExtensionByLanguage('php')).toBe('php');
      expect(codeEditorExtensionByLanguage('haskell')).toBe('txt');
    });
  });

  // ---------------------------------------------------------------------------
  // Python parsing and generation
  // ---------------------------------------------------------------------------
  describe('Python', () => {
    it('parses Python @test decorator', () => {
      const script = `@test("Add", points=5, description="checks add", timeout=10)
def test_add():
    assert add(1, 2) == 3
`;
      const items = parseCardScript(script, 'python3');
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        type: 'test',
        name: 'Add',
        points: 5,
        description: 'checks add',
        timeout: 10,
      });
    });

    it('generates Python test script', () => {
      const script = generateCardScript(
        [{ id: '1', type: 'test', name: 'Add', points: 5, logic: 'assert add(1, 2) == 3' }],
        'python3',
      );
      expect(script).toContain('@test("Add", points=5)');
      expect(script).toContain('def test_add():');
      expect(script).toContain('assert add(1, 2) == 3');
    });

    it('generates Python with description and timeout', () => {
      const script = generateCardScript(
        [{ id: '1', type: 'test', name: 'T', points: 1, description: 'desc', timeout: 30, logic: 'pass' }],
        'python3',
      );
      expect(script).toContain('description="desc"');
      expect(script).toContain('timeout=30');
    });
  });

  // ---------------------------------------------------------------------------
  // JavaScript parsing
  // ---------------------------------------------------------------------------
  describe('JavaScript parsing', () => {
    it('parses JS test() calls', () => {
      const script = `test("Sum", 5, "desc", () => {
    if (sum(1, 2) !== 3) throw new Error('fail');
});`;
      const items = parseCardScript(script, 'node-20');
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ type: 'test', name: 'Sum', points: 5, description: 'desc' });
    });

    it('parses JS without description', () => {
      const script = `test("Sum", 5, () => {
    if (sum(1, 2) !== 3) throw new Error('fail');
});`;
      const items = parseCardScript(script, 'js');
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Sum');
    });
  });

  // ---------------------------------------------------------------------------
  // C++ parsing and generation variants
  // ---------------------------------------------------------------------------
  describe('C++', () => {
    it('parses TEST macro', () => {
      const script = `TEST(myTest, 5) {
    assertTrue(1 == 1, "ok");
}`;
      const items = parseCardScript(script, 'c/c++');
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ type: 'test', name: 'myTest', points: 5 });
    });

    it('parses TEST_DESC macro', () => {
      const script = `TEST_DESC(myTest, 5, "description") {
    assertTrue(true, "ok");
}`;
      const items = parseCardScript(script, 'cpp');
      expect(items).toHaveLength(1);
      expect(items[0].description).toBe('description');
    });

    it('parses TEST_TIMEOUT macro', () => {
      const script = `TEST_TIMEOUT(myTest, 5, 30) {
    assertTrue(true, "ok");
}`;
      const items = parseCardScript(script, 'cpp');
      expect(items).toHaveLength(1);
      expect(items[0].timeout).toBe(30);
    });

    it('generates C++ with only description (TEST_DESC)', () => {
      const script = generateCardScript(
        [{ id: '1', type: 'test', name: 'foo', points: 2, description: 'desc', logic: '// code' }],
        'c/c++',
      );
      expect(script).toContain('TEST_DESC(foo, 2, "desc")');
    });

    it('generates C++ with only timeout (TEST_TIMEOUT)', () => {
      const script = generateCardScript(
        [{ id: '1', type: 'test', name: 'foo', points: 2, timeout: 15, logic: '// code' }],
        'c/c++',
      );
      expect(script).toContain('TEST_TIMEOUT(foo, 2, 15)');
    });

    it('generates C++ with no description or timeout (TEST)', () => {
      const script = generateCardScript([{ id: '1', type: 'test', name: 'foo', points: 2, logic: '// code' }], 'c/c++');
      expect(script).toContain('TEST(foo, 2)');
    });
  });

  // ---------------------------------------------------------------------------
  // Ruby parsing and generation
  // ---------------------------------------------------------------------------
  describe('Ruby', () => {
    it('parses Ruby run_test blocks', () => {
      const script = `run_test("Sum", 5, "checks add") do
    raise 'fail' unless add(1, 2) == 3
end`;
      const items = parseCardScript(script, 'ruby');
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ type: 'test', name: 'Sum', points: 5, description: 'checks add' });
    });

    it('generates Ruby test script', () => {
      const script = generateCardScript(
        [{ id: '1', type: 'test', name: 'T', points: 1, description: 'd', logic: '# code' }],
        'ruby',
      );
      expect(script).toContain('run_test("T", 1, "d")');
      expect(script).toContain('do');
      expect(script).toContain('end');
    });

    it('generates Ruby with timeout', () => {
      const script = generateCardScript(
        [{ id: '1', type: 'test', name: 'T', points: 1, description: 'd', timeout: 20, logic: '# code' }],
        'ruby',
      );
      expect(script).toContain(', 20)');
    });
  });

  // ---------------------------------------------------------------------------
  // PHP parsing and generation
  // ---------------------------------------------------------------------------
  describe('PHP', () => {
    it('parses PHP Tester::test calls', () => {
      const script = `Tester::test("Sum", 5, "checks add", function() {
    if (add(1, 2) !== 3) { throw new Exception('fail'); }
});`;
      const items = parseCardScript(script, 'php');
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ type: 'test', name: 'Sum', points: 5, description: 'checks add' });
    });

    it('generates PHP test script', () => {
      const script = generateCardScript(
        [{ id: '1', type: 'test', name: 'T', points: 1, description: 'd', logic: '// code' }],
        'php',
      );
      expect(script).toContain('Tester::test("T", 1, "d", function()');
    });
  });

  // ---------------------------------------------------------------------------
  // R generation
  // ---------------------------------------------------------------------------
  describe('R generation', () => {
    it('generates R test script', () => {
      const script = generateCardScript(
        [{ id: '1', type: 'test', name: 'T', points: 3, description: 'd', logic: 'stopifnot(TRUE)' }],
        'r',
      );
      expect(script).toContain('run_test("T", 3, "d", function()');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------
  describe('edge cases', () => {
    it('returns empty array for empty code', () => {
      expect(parseCardScript('', 'python3')).toEqual([]);
    });

    it('preserves code items in generated output', () => {
      const script = generateCardScript([{ id: '1', type: 'code', logic: '# setup' }], 'python3');
      expect(script).toContain('# setup');
    });

    it('handles mixed test and code items', () => {
      const script = generateCardScript(
        [
          { id: '1', type: 'code', logic: 'import math' },
          { id: '2', type: 'test', name: 'Pi', points: 1, logic: 'assert math.pi > 3' },
        ],
        'python3',
      );
      expect(script).toContain('import math');
      expect(script).toContain('@test("Pi"');
    });

    it('handles Java test with existing return statement', () => {
      const script = generateCardScript(
        [{ id: '1', type: 'test', name: 'T', points: 1, logic: 'return new Object[]{1.0, "ok"};' }],
        'java',
      );
      expect(script).toContain('return new Object[]{1.0, "ok"};');
      // Should not add duplicate return
      expect(script.match(/return/g)?.length).toBe(1);
    });
  });
});
