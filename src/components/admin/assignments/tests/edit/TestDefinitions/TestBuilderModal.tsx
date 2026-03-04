// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Modal, Form, Input, InputNumber, Typography } from 'antd';

interface IProps {
  open: boolean;
  onCancel: () => void;
  onInsert: (code: string) => void;
  language: string;
}

export const TestBuilderModal = (props: IProps) => {
  const [form] = Form.useForm();

  const generateSnippet = (values: any) => {
    const { name, points, logic, description } = values;
    const rawLanguage = props.language.toLowerCase();
    const lang = (() => {
      if (rawLanguage.includes('python') || rawLanguage === 'ipynb') return 'python';
      if (rawLanguage === 'java' || rawLanguage.startsWith('java-')) return 'java';
      if (rawLanguage === 'r' || rawLanguage.startsWith('r-')) return 'r';
      if (
        rawLanguage.includes('node') ||
        rawLanguage.includes('javascript') ||
        rawLanguage.includes('typescript') ||
        rawLanguage === 'js'
      ) {
        return 'javascript';
      }
      if (
        rawLanguage.includes('c/c++') ||
        rawLanguage.includes('c++') ||
        rawLanguage.includes('cpp') ||
        rawLanguage === 'c'
      ) {
        return 'cpp';
      }
      if (rawLanguage.includes('php')) return 'php';
      if (rawLanguage.includes('ruby') || rawLanguage === 'rb') return 'ruby';
      return rawLanguage;
    })();

    // Normalize logic indentation
    const indentedLogic = logic
      .split('\n')
      .map((line: string) => `    ${line}`)
      .join('\n');

    const cppIdentifier = name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'TestCase';

    // Helper for description
    const descComment = description ? `    // ${description}\n` : '';
    const pythonDesc = description ? `    """\n    ${description}\n    """\n` : '';

    if (lang === 'python') {
      const descArg = description ? `, description="${description}"` : '';
      const timeoutArg = values.timeout ? `, timeout=${values.timeout}` : '';
      return `
@test("${name}", points=${points}${descArg}${timeoutArg})
def test_${name.toLowerCase().replace(/\s+/g, '_')}():
${pythonDesc}${indentedLogic}
`;
    } else if (lang === 'java') {
      const descArg = description ? `, description="${description}"` : '';
      const timeoutArg = values.timeout ? `, timeout=${values.timeout}` : '';
      return `
@Test(name="${name}", points=${points}${descArg}${timeoutArg})
public Object[] test${name.replace(/\s+/g, '')}() {
${descComment}${indentedLogic}
  return new Object[]{0.0, ""};
}`;
    } else if (lang === 'cpp') {
      if (description && values.timeout) {
        return `
TEST_DESC_TIMEOUT(${cppIdentifier}, ${points}, "${description}", ${values.timeout}) {
${descComment}${indentedLogic}
}`;
      }
      if (description) {
        return `
TEST_DESC(${cppIdentifier}, ${points}, "${description}") {
${descComment}${indentedLogic}
}`;
      } else if (values.timeout) {
        return `
TEST_TIMEOUT(${cppIdentifier}, ${points}, ${values.timeout}) {
${descComment}${indentedLogic}
}`;
      } else {
        return `
TEST(${cppIdentifier}, ${points}) {
${descComment}${indentedLogic}
}`;
      }
    } else if (lang === 'javascript') {
      const descArg = description ? `, "${description}"` : ', ""';
      const timeoutArg = values.timeout ? `, ${values.timeout}` : '';
      return `
test("${name}", ${points}${descArg}, function() {
${descComment}${indentedLogic}
}${timeoutArg});`;
    } else if (lang === 'php') {
      const descArg = description ? `, "${description}"` : '';
      const timeoutArg = values.timeout ? `, ${values.timeout}` : '';
      return `
Tester::test("${name}", ${points}${descArg}, function() {
${descComment}${indentedLogic}
}${timeoutArg});`;
    } else if (lang === 'r') {
      const descArg = `, "${description || ''}"`;
      const timeoutArg = values.timeout ? `, ${values.timeout}` : '';
      return `
run_test("${name}", ${points}${descArg}, function() {
${indentedLogic}
}${timeoutArg})`;
    } else if (lang === 'ruby') {
      const descArg = `, "${description || ''}"`;
      const timeoutArg = values.timeout ? `, ${values.timeout}` : '';
      return `
run_test("${name}", ${points}${descArg}${timeoutArg}) do
${description ? `    # ${description}\n` : ''}${indentedLogic}
end`;
    }

    return `// Unknown language: ${lang}\n// ${name} (${points} pts)\n${logic}`;
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const code = generateSnippet(values);
      props.onInsert(code);
      form.resetFields();
    } catch (e) {
      // validation failed
    }
  };

  return (
    <Modal
      title="Add Test Case"
      open={props.open}
      onOk={handleOk}
      onCancel={props.onCancel}
      width={600}
      okText="Insert Test"
    >
      <Form form={form} layout="vertical" initialValues={{ points: 1 }}>
        <Form.Item name="name" label="Test Name" rules={[{ required: true, message: 'Missing test name' }]}>
          <Input placeholder="e.g. Test Addition" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input placeholder="Optional description of what this test checks" />
        </Form.Item>
        <Form.Item name="points" label="Points" rules={[{ required: true }]}>
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item name="timeout" label="Timeout (seconds)">
          <InputNumber min={1} placeholder="30" />
        </Form.Item>

        <Form.Item label="Test Logic" name="logic" rules={[{ required: true, message: 'Enter the test logic' }]}>
          <Input.TextArea
            rows={6}
            placeholder={
              props.language === 'python' || props.language === 'ipynb'
                ? 'assert add(1, 2) == 3'
                : props.language === 'java'
                  ? 'assertEquals(3, add(1, 2));'
                  : "if (add(1,2) != 3) throw new Error('Failed');"
            }
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Write the body of the test function here. The system will wrap it in the correct boilerplate for{' '}
          {props.language}.
        </Typography.Text>
      </Form>
    </Modal>
  );
};
