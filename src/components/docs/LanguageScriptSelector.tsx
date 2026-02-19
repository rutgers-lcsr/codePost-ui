import React, { useMemo, useState } from 'react';
import { Select, Space, Typography } from 'antd';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { colors } from '../../theme/colors';

const { Text } = Typography;

type ScriptLanguage = {
  key: string;
  label: string;
  syntaxLanguage: string;
  usage: string;
  code: string;
};

const buildPythonLanguage = (): ScriptLanguage => ({
  key: 'python',
  label: 'Python',
  syntaxLanguage: 'python',
  usage: 'Use @test(...) above each function. Return-pattern examples are included as separate test functions.',
  code: `@test(name="Addition Test", points=5, description="Verifies add() works", timeout=30)
def test_addition():
    assert add(1, 2) == 3
    return

@test(name="Full Credit + Message", points=5)
def test_full_credit_message():
    return 5, "Perfect solution"

@test(name="Partial Credit", points=5)
def test_partial_credit():
    return 3

@test(name="Partial Credit + Message", points=5)
def test_partial_credit_message():
    return 3, "Correct core logic, missing edge case"`,
});

const buildJavaLanguage = (): ScriptLanguage => ({
  key: 'java',
  label: 'Java',
  syntaxLanguage: 'java',
  usage: 'Use @Test(...) on public methods. Return-pattern examples are included as separate test methods.',
  code: `@Test(name="Addition Test", points=5, description="Verifies add() works", timeout=30)
public Object testAddition() {
    assertEquals(3, Main.add(1, 2));
    return null;
}

@Test(name="Full Credit + Message", points=5)
public Object testFullCreditMessage() {
    return "Perfect solution";
}

@Test(name="Partial Credit", points=5)
public Object testPartialCredit() {
    return 3;
}

@Test(name="Partial Credit + Message", points=5)
public Object testPartialCreditMessage() {
    return new Object[]{3, "Correct core logic, missing edge case"};
}`,
});

const buildRLanguage = (): ScriptLanguage => ({
  key: 'r',
  label: 'R',
  syntaxLanguage: 'r',
  usage: 'Use run_test(...). Return-pattern examples are included as separate test functions.',
  code: `run_test("Addition Test", 5, "Verifies add() works", function() {
  stopifnot(add(1, 2) == 3)
  return(NULL)
}, 30)

run_test("Full Credit + Message", 5, function() {
  return(list(score = 5, message = "Perfect solution"))
})

run_test("Partial Credit", 5, function() {
  return(3)
})

run_test("Partial Credit + Message", 5, function() {
  return(list(score = 3, message = "Correct core logic, missing edge case"))
})`,
});

const buildCppLanguage = (): ScriptLanguage => ({
  key: 'cpp',
  label: 'C/C++',
  syntaxLanguage: 'cpp',
  usage: 'Use TEST macros. Return-pattern examples are included as separate test macros.',
  code: `TEST(AdditionTest, 5.0) {
  assertTrue(add(1, 2) == 3, "1+2 should be 3");
  return;
}

TEST(FullCreditMessage, 5.0) {
  return return_score(5.0, "Perfect solution");
}

TEST(PartialCredit, 5.0) {
  return 3.0;
}

TEST(PartialCreditMessage, 5.0) {
  return return_score(3.0, "Correct core logic, missing edge case");
}`,
});

const buildJavascriptLanguage = (): ScriptLanguage => ({
  key: 'javascript',
  label: 'Node / JavaScript / TypeScript',
  syntaxLanguage: 'javascript',
  usage: 'Use test(...). Return-pattern examples are included as separate test callbacks.',
  code: `test(
  'Addition Test',
  5,
  'Verifies add() works',
  () => {
    if (add(1, 2) !== 3) throw new Error('1+2 should be 3');
    return;
  },
  30,
);

test('Full Credit + Message', 5, 'message return', () => {
  return 'Perfect solution';
});

test('Partial Credit', 5, 'numeric return', () => {
  return 3;
});

test('Partial Credit + Message', 5, 'object return', () => {
  return { score: 3, message: 'Correct core logic, missing edge case' };
});`,
});

const buildRubyLanguage = (): ScriptLanguage => ({
  key: 'ruby',
  label: 'Ruby',
  syntaxLanguage: 'ruby',
  usage: 'Use run_test(...). Return-pattern examples are included as separate blocks.',
  code: `run_test("Addition Test", 5, "Verifies add() works", 30) do
  raise "1+2 should be 3" unless add(1, 2) == 3
  return nil
end

run_test("Full Credit + Message", 5, "message return") do
  return "Perfect solution"
end

run_test("Partial Credit", 5, "numeric return") do
  return 3
end

run_test("Partial Credit + Message", 5, "array return") do
  return [3, "Correct core logic, missing edge case"]
end`,
});

const buildPhpLanguage = (): ScriptLanguage => ({
  key: 'php',
  label: 'PHP',
  syntaxLanguage: 'php',
  usage: 'Use Tester::test(...). Return-pattern examples are included as separate callbacks.',
  code: `Tester::test("Addition Test", 5, "Verifies add() works", function () {
    if (add(1, 2) !== 3) {
        throw new Exception("1+2 should be 3");
    }
    return null;
}, 30);

Tester::test("Full Credit + Message", 5, "message return", function () {
    return "Perfect solution";
});

Tester::test("Partial Credit", 5, "numeric return", function () {
    return 3;
});

Tester::test("Partial Credit + Message", 5, "array return", function () {
    return ["score" => 3, "message" => "Correct core logic, missing edge case"];
});`,
});

const SCRIPT_LANGUAGES: ScriptLanguage[] = [
  buildPythonLanguage(),
  buildJavaLanguage(),
  buildRLanguage(),
  buildCppLanguage(),
  buildJavascriptLanguage(),
  buildRubyLanguage(),
  buildPhpLanguage(),
];

type LanguageScriptSelectorProps = {
  title?: string;
};

const LanguageScriptSelector: React.FC<LanguageScriptSelectorProps> = ({ title = 'Script example' }) => {
  const [selectedLanguageKey, setSelectedLanguageKey] = useState<string>(SCRIPT_LANGUAGES[0].key);

  const selectedLanguage = useMemo(
    () => SCRIPT_LANGUAGES.find((entry) => entry.key === selectedLanguageKey) ?? SCRIPT_LANGUAGES[0],
    [selectedLanguageKey],
  );

  return (
    <div
      style={{
        borderRadius: '8px',
        padding: '8px 0',
        backgroundColor: 'transparent',
        margin: '20px 0 28px',
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', rowGap: '12px' }}>
          <Text strong style={{ color: colors.neutralTitle }}>
            {title}
          </Text>

          <Text strong style={{ color: colors.neutralTitle }}>
            Language
          </Text>
          <Select
            value={selectedLanguageKey}
            onChange={setSelectedLanguageKey}
            options={SCRIPT_LANGUAGES.map((entry) => ({ value: entry.key, label: entry.label }))}
            style={{ minWidth: '280px', maxWidth: '100%' }}
            aria-label="Choose script language example"
          />
        </div>

        <Text style={{ color: colors.neutralMainText }}>{selectedLanguage.usage}</Text>

        <div
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: `1px solid ${colors.neutralBorder}`,
            background: 'white',
          }}
        >
          <div
            style={{
              background: colors.neutralBackground,
              padding: '8px 16px',
              fontSize: '12px',
              color: colors.neutralTitle,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              borderBottom: `1px solid ${colors.neutralBorder}`,
            }}
          >
            {selectedLanguage.syntaxLanguage}
          </div>

          <SyntaxHighlighter
            style={materialLight}
            language={selectedLanguage.syntaxLanguage}
            PreTag="div"
            wrapLines={true}
            lineProps={{ style: { border: 'none', boxShadow: 'none', background: 'transparent' } }}
            codeTagProps={{ style: { border: 'none', background: 'transparent', boxShadow: 'none' } }}
            customStyle={{ margin: 0, padding: '16px', borderRadius: 0, background: 'white' }}
          >
            {selectedLanguage.code}
          </SyntaxHighlighter>
        </div>
      </Space>
    </div>
  );
};

export default LanguageScriptSelector;
