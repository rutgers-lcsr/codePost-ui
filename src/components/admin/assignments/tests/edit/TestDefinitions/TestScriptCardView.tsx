import React, { useState, useEffect } from 'react';
import { Card, Input, InputNumber, Button, Space, Typography, Empty, Popover } from 'antd';
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { CodeWindow } from '../utils/CodeWindow';

interface ITestCase {
    id: string; // Internal ID for React keys
    type: 'test' | 'code'; // 'test' for structured test case, 'code' for raw code block (preamble/interstitial)
    name?: string;
    points?: number;
    description?: string;
    logic?: string; // The body of the test or the raw code content
}

interface IProps {
    code: string;
    language: string;
    onChange: (code: string) => void;
}

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const TestScriptCardView = (props: IProps) => {
    const [items, setItems] = useState<ITestCase[]>([]);
    const lastGeneratedCode = React.useRef<string | null>(null);

    useEffect(() => {
        // Only re-parse if the code coming in is different from what we just generated.
        // This prevents the "typing loop" where every keystroke triggers a parent update,
        // which triggers a prop update, which triggers a re-parse, which regenerates IDs,
        // which unmounts components and kills focus.
        if (props.code !== lastGeneratedCode.current) {
            setItems(parseCode(props.code, props.language));
        }
    }, [props.code, props.language]);

    const handleChange = (newItems: ITestCase[]) => {
        const newCode = generateCode(newItems, props.language);
        lastGeneratedCode.current = newCode;
        setItems(newItems);
        props.onChange(newCode);
    };

    const updateItem = (id: string, updates: Partial<ITestCase>) => {
        const newItems = items.map(item => item.id === id ? { ...item, ...updates } : item);
        handleChange(newItems);
    };

    const deleteItem = (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        handleChange(newItems);
    };

    const addItem = () => {
        const newItem: ITestCase = {
            id: generateId(),
            type: 'test',
            name: 'New Test',
            points: 1,
            description: '',
            logic: '# Test logic here\npass'
        };
        handleChange([...items, newItem]);
    };

    const EXAMPLE_PLACEHOLDER = `# Example: Check if a function returns the expected value
# 'code' is the student's submitted module
# 'solution' is your solution module (if available)

try:
    # Call the student's function
    result = code.add(1, 2)
    expected = 3
    
    # Assert correctness
    if result != expected:
        print(f"Expected {expected}, got {result}")
        raise AssertionError("Incorrect return value")
        
except AttributeError:
    print("Function 'add' not found in submission")
    raise`;

    return (
        <div style={{ padding: '24px', background: '#f5f7fa', height: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 100 }}>
                {items.length === 0 && (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No tests found. Add a test case or switch to Code view."
                        style={{ margin: '40px 0' }}
                    >
                        <Button type="primary" onClick={addItem}>Add Test Case</Button>
                    </Empty>
                )}

                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {items.map((item) => (
                        <div key={item.id}>
                            {item.type === 'code' ? (
                                <Card size="small" style={{ background: '#fff', borderLeft: '4px solid #d9d9d9', opacity: 0.9 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Typography.Text strong style={{ color: '#888', fontSize: 12 }}>CODE BLOCK (Not a test)</Typography.Text>
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
                                            <span style={{
                                                background: '#e6f7ff',
                                                color: '#1890ff',
                                                borderRadius: 4,
                                                padding: '2px 8px',
                                                fontSize: 12,
                                                fontWeight: 'bold'
                                            }}>TEST</span>
                                            <Input
                                                value={item.name}
                                                onChange={e => updateItem(item.id, { name: e.target.value })}
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
                                                    onChange={val => updateItem(item.id, { points: Number(val) || 0 })}
                                                    min={0}
                                                    size="small"
                                                    style={{ width: 60 }}
                                                    bordered={false}
                                                />
                                            </div>
                                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteItem(item.id)} />
                                        </Space>
                                    }
                                    style={{
                                        borderLeft: '4px solid #1890ff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div>
                                            <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Description</Typography.Text>
                                            <Input
                                                value={item.description}
                                                onChange={e => updateItem(item.id, { description: e.target.value })}
                                                placeholder="Describe what this test validates..."
                                                style={{ marginTop: 4 }}
                                            />
                                        </div>

                                        <div style={{ height: 300, border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}>
                                            <CodeWindow
                                                code={item.logic || ''}
                                                name={`logic_${item.id}.py`}
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
                                        <Typography.Text strong>Structure:</Typography.Text><br />
                                        Define tests as functions decorated with <code>@test</code>.
                                        Each test must have a unique name.
                                    </div>

                                    <div style={{ marginBottom: 15 }}>
                                        <Typography.Text strong>Available Modules:</Typography.Text>
                                        <ul style={{ paddingLeft: 20, margin: '4px 0' }}>
                                            <li><code>code</code>: The student's submitted code.</li>
                                            <li><code>solution</code>: Your solution code (if available).</li>
                                        </ul>
                                    </div>

                                    <div style={{ marginBottom: 15 }}>
                                        <Typography.Text strong>Assertions:</Typography.Text><br />
                                        To fail a test, raise an <code>AssertionError</code> or any other exception.
                                        Only the exception message will be shown to students.
                                    </div>

                                    <Typography.Text strong>Example:</Typography.Text>
                                    <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, fontSize: 11, border: '1px solid #eee', marginTop: 4 }}>
                                        {EXAMPLE_PLACEHOLDER}
                                    </pre>
                                </div>
                            }
                            trigger="click"
                            placement="topRight"
                        >
                            <Button
                                icon={<QuestionCircleOutlined />}
                                style={{ height: 48, borderRadius: 8 }}
                            >
                                Help & Example
                            </Button>
                        </Popover>
                    </div>
                </Space>
            </div>
        </div>
    );
};

// --- PARSER LOGIC ---

// --- PARSER LOGIC ---
// --- PARSER LOGIC ---
const parseCode = (code: string, language: string): ITestCase[] => {
    const items: ITestCase[] = [];
    if (!code) return items;

    if (language === 'python' || language === 'ipynb') {
        let lastIndex = 0;
        let match;

        // Regex for Python/Notebook
        // Group 1: Name
        // Group 2: Points (optional)
        // Group 3: Description (optional)
        const regex = /@test\(\s*"([^"]*)"\s*(?:,\s*points\s*=\s*([0-9.]+))?(?:,\s*description\s*=\s*"([^"]*)")?\s*\)\s*\ndef\s+[a-zA-Z0-9_]+\s*\(\):\s*\n/g;

        while ((match = regex.exec(code)) !== null) {
            // Push preceding raw code
            if (match.index > lastIndex) {
                const raw = code.substring(lastIndex, match.index).trim();
                if (raw) items.push({ id: generateId(), type: 'code', logic: raw });
            }

            const name = match[1];
            const points = parseFloat(match[2] || '1');
            const description = match[3] || '';

            // Extract body - assumption: indented block follows
            // We need to read lines until unindent or EOF
            const startIndex = match.index + match[0].length;
            const remaining = code.substring(startIndex);
            const lines = remaining.split('\n');
            const bodyLines: string[] = [];

            let i = 0;
            // First line might be empty
            while (i < lines.length) {
                const line = lines[i];
                if (line.trim() === '') {
                    bodyLines.push(line);
                    i++;
                    continue;
                }
                // Check indent
                if (line.startsWith('    ') || line.startsWith('\t')) {
                    // Remove one level of indent
                    bodyLines.push(line.replace(/^(    |\t)/, ''));
                    i++;
                } else {
                    break;
                }
            }

            // DOCSTRING STRIPPING:
            // Check if the extracted body starts with a docstring that duplicates the description
            // We strip the first block if it looks like a docstring.
            let contentStartIndex = 0;
            while (contentStartIndex < bodyLines.length && bodyLines[contentStartIndex].trim() === '') {
                contentStartIndex++;
            }

            // Check for docstring start
            if (contentStartIndex < bodyLines.length) {
                const firstLine = bodyLines[contentStartIndex].trim();
                if (firstLine.startsWith('"""') || firstLine.startsWith("'''")) {
                    const quote = firstLine.substring(0, 3);
                    let foundEnd = false;
                    let endLineIndex = contentStartIndex;

                    if (firstLine.length > 3 && firstLine.endsWith(quote)) {
                        // Single line docstring
                        foundEnd = true;
                    } else {
                        // Multi-line
                        for (let k = contentStartIndex + 1; k < bodyLines.length; k++) {
                            if (bodyLines[k].trim().endsWith(quote)) {
                                endLineIndex = k;
                                foundEnd = true;
                                break;
                            }
                        }
                    }

                    if (foundEnd) {
                        // Remove these lines from bodyLines
                        bodyLines.splice(contentStartIndex, endLineIndex - contentStartIndex + 1);
                    }
                }
            }

            // Reconstruct body
            const logic = bodyLines.join('\n');
            items.push({ id: generateId(), type: 'test', name, points, description, logic });

            // Update lastIndex based on consumed lines from original string
            let consumed = 0;
            for (let j = 0; j < i; j++) {
                consumed += lines[j].length + 1; // +1 for the newline split consumed
            }
            // Fix: if last line, no newline char? split('\n') handles it mostly. 
            // lines[j].length is content without \n. +1 accounts for the \n.

            lastIndex = startIndex + consumed;
            regex.lastIndex = lastIndex;
        }

        // Trailing code
        if (lastIndex < code.length) {
            const raw = code.substring(lastIndex).trim();
            if (raw) items.push({ id: generateId(), type: 'code', logic: raw });
        }
    } else {
        // Fallback: entire code is raw
        items.push({ id: generateId(), type: 'code', logic: code });
    }

    return items;
};

const generateCode = (items: ITestCase[], language: string): string => {
    if (language === 'python' || language === 'ipynb') {
        return items.map(item => {
            if (item.type === 'code') return item.logic + '\n';

            // Ensure logic doesn't end with extra newlines
            const cleanLogic = (item.logic || 'pass').trimRight();

            const pythonDesc = item.description ? `    """\n    ${item.description}\n    """\n` : '';
            const descArg = item.description ? `, description="${item.description}"` : '';

            // Normalize name: test_Exact Name -> test_Exact_Name
            // Use a stable name derivation instead of random
            const safeName = (item.name || 'test').replace(/[^a-zA-Z0-9_]/g, '_');
            const funcName = `test_${safeName.toLowerCase()}`;
            // NOTE: If user has duplicates, this might clash, but better than random regeneration destroying focus.
            // Python parser allows duplicate function definitions (last wins), so it runs without error, but overrides.
            // Ideally we'd ensure uniqueness, but stability is critical for editing.

            const indentedLogic = cleanLogic.split('\n').map(l => l.trim() ? `    ${l}` : l).join('\n');

            return `
@test("${item.name}", points=${item.points}${descArg})
def ${funcName}():
${pythonDesc}${indentedLogic}
`;
        }).join('\n');
    }
    // Fallback
    return items.map(i => i.logic).join('\n');
};
