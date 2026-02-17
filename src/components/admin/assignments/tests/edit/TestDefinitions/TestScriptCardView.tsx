import React, { useEffect, useState } from 'react';
import { Button, Card, Empty, Input, InputNumber, Popover, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { CodeWindow } from '../utils/CodeWindow';
import {
  codeEditorExtensionByLanguage,
  defaultLogicForLanguage,
  generateCardScript,
  normalizeCardScriptLanguage,
  parseCardScript,
} from './TestScriptCardLanguage';

interface ITestCase {
  id: string;
  type: 'test' | 'code';
  name?: string;
  points?: number;
  timeout?: number;
  description?: string;
  logic?: string;
}

interface IProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
}

const TestScriptCardView = (props: IProps) => {
  const [items, setItems] = useState<ITestCase[]>([]);
  const lastGeneratedCode = React.useRef<string | null>(null);
  const normalizedLanguage = normalizeCardScriptLanguage(props.language);

  useEffect(() => {
    if (props.code !== lastGeneratedCode.current) {
      setItems(parseCardScript(props.code, props.language));
    }
  }, [props.code, props.language]);

  const handleChange = (newItems: ITestCase[]) => {
    const newCode = generateCardScript(newItems, props.language);
    lastGeneratedCode.current = newCode;
    setItems(newItems);
    props.onChange(newCode);
  };

  const updateItem = (id: string, updates: Partial<ITestCase>) => {
    handleChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteItem = (id: string) => {
    handleChange(items.filter((item) => item.id !== id));
  };

  const addItem = () => {
    handleChange([
      ...items,
      {
        id: `draft-${Date.now()}-${items.length}`,
        type: 'test',
        name: 'New Test',
        points: 1,
        description: '',
        logic: defaultLogicForLanguage(props.language),
      },
    ]);
  };

  const examplePlaceholder = (() => {
    switch (normalizedLanguage) {
      case 'java':
        return `int result = add(1, 2);\nassertEquals(3, result);`;
      case 'js':
        return `const result = add(1, 2);\nif (result !== 3) throw new Error('Expected 3');`;
      case 'r':
        return `result <- add(1, 2)\nstopifnot(result == 3)`;
      case 'cpp':
        return `int result = add(1, 2);\nassertTrue(result == 3, \"Expected 3\");`;
      case 'ruby':
        return `result = add(1, 2)\nraise 'Expected 3' unless result == 3`;
      case 'php':
        return `$result = add(1, 2);\nif ($result !== 3) { throw new Exception('Expected 3'); }`;
      case 'python':
      default:
        return `result = code.add(1, 2)\nassert result == 3`;
    }
  })();

  const helpText = (() => {
    switch (normalizedLanguage) {
      case 'python':
        return 'Define tests with @test("Name", points=5, ...).';
      case 'java':
        return 'Define tests with @Test(name="Name", points=5, ...).';
      case 'js':
        return 'Define tests with test("Name", points, "description", () => { ... }, timeout).';
      case 'r':
        return 'Define tests with run_test("Name", points, "description", function() { ... }, timeout).';
      case 'cpp':
        return 'Define tests with TEST / TEST_DESC / TEST_TIMEOUT / TEST_DESC_TIMEOUT macros.';
      case 'ruby':
        return 'Define tests with run_test("Name", points, "description") do ... end.';
      case 'php':
        return 'Define tests with Tester::test("Name", points, "description", function() { ... });';
      default:
        return 'Structured parsing is limited for this language; raw code blocks are preserved.';
    }
  })();

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 100 }}>
        {items.length === 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No tests found. Add a test case or switch to Code view."
            style={{ margin: '40px 0' }}
          >
            <Button type="primary" onClick={addItem}>
              Add Test Case
            </Button>
          </Empty>
        )}

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {items.map((item) => (
            <div key={item.id}>
              {item.type === 'code' ? (
                <Card size="small" style={{ background: '#fff', borderLeft: '4px solid #d9d9d9', opacity: 0.9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Typography.Text strong style={{ color: '#888', fontSize: 12 }}>
                      CODE BLOCK (Not a test)
                    </Typography.Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => deleteItem(item.id)}
                    />
                  </div>
                  <div style={{ height: 150, border: '1px solid #eee' }}>
                    <CodeWindow
                      code={item.logic || ''}
                      name={`raw_${item.id}.txt`}
                      onChange={(val) => updateItem(item.id, { logic: val })}
                    />
                  </div>
                </Card>
              ) : (
                <Card
                  size="small"
                  title={
                    <Space>
                      <span
                        style={{
                          background: '#e6f7ff',
                          color: '#1890ff',
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        TEST
                      </span>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        style={{ width: 300, fontWeight: 600 }}
                        placeholder="Test Name"
                        bordered={false}
                      />
                    </Space>
                  }
                  extra={
                    <Space>
                      <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '2px 8px' }}>
                        <span style={{ fontSize: 12, marginRight: 8, color: '#888' }}>Points:</span>
                        <InputNumber
                          value={item.points}
                          onChange={(val) => updateItem(item.id, { points: Number(val) || 0 })}
                          min={0}
                          size="small"
                          style={{ width: 60 }}
                          bordered={false}
                        />
                      </div>
                      <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '2px 8px' }}>
                        <span style={{ fontSize: 12, marginRight: 8, color: '#888' }}>Timeout:</span>
                        <InputNumber
                          value={item.timeout}
                          onChange={(val) => updateItem(item.id, { timeout: Number(val) || undefined })}
                          min={1}
                          placeholder="30"
                          size="small"
                          style={{ width: 50 }}
                          bordered={false}
                        />
                      </div>
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteItem(item.id)} />
                    </Space>
                  }
                  style={{
                    borderLeft: '4px solid #1890ff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}
                      >
                        Description
                      </Typography.Text>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Describe what this test validates..."
                        style={{ marginTop: 4 }}
                      />
                    </div>

                    <div style={{ height: 300, border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}>
                      <CodeWindow
                        code={item.logic || ''}
                        name={`logic_${item.id}.${codeEditorExtensionByLanguage(props.language)}`}
                        onChange={(val) => updateItem(item.id, { logic: val })}
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={addItem}
              style={{ height: 48, borderRadius: 8, flex: 1 }}
            >
              Add Test Case
            </Button>
            <Popover
              title="Writing Test Scripts"
              content={
                <div style={{ width: 500 }}>
                  <div style={{ marginBottom: 15 }}>
                    <Typography.Text strong>Structure:</Typography.Text>
                    <br />
                    {helpText}
                  </div>

                  <div style={{ marginBottom: 15 }}>
                    <Typography.Text strong>Assertions:</Typography.Text>
                    <br />
                    To fail a test, throw/raise an error or assertion with a clear message. Only the failure message is
                    shown to students.
                  </div>

                  <Typography.Text strong>Example:</Typography.Text>
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: 10,
                      borderRadius: 4,
                      fontSize: 11,
                      border: '1px solid #eee',
                      marginTop: 4,
                    }}
                  >
                    {examplePlaceholder}
                  </pre>
                </div>
              }
              trigger="click"
              placement="topRight"
            >
              <Button icon={<QuestionCircleOutlined />} style={{ height: 48, borderRadius: 8 }}>
                Help & Example
              </Button>
            </Popover>
          </div>
        </Space>
      </div>
    </div>
  );
};

export { TestScriptCardView };
export default TestScriptCardView;
