// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, expect, it } from 'vitest';
import { generateCardScript, normalizeCardScriptLanguage, parseCardScript } from './TestScriptCardLanguage';

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
});
