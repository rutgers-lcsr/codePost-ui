import { ClearOutlined, DownloadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Alert, Button, Card, Select, Space, Spin } from 'antd';
import React from 'react';

const { Option } = Select;

interface InteractiveCodeConsoleProps {
  initialCode?: string;
  initialLanguage?: string;
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  python: 'py',
  javascript: 'js',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  ruby: 'rb',
  go: 'go',
  rust: 'rs',
};

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  ruby: 'Ruby',
  go: 'Go',
  rust: 'Rust',
};

const DEFAULT_CODE: Record<string, string> = {
  python:
    '# Python Code\nprint("Hello, World!")\n\n# Try numpy\nimport numpy as np\narr = np.array([1, 2, 3])\nprint(f"Array: {arr}")\nprint(f"Sum: {arr.sum()}")',
  javascript:
    '// JavaScript Code\nconsole.log("Hello, World!");\n\nconst arr = [1, 2, 3];\nconsole.log("Array:", arr);\nconst sum = arr.reduce((a, b) => a + b, 0);\nconsole.log("Sum:", sum);',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
  ruby: 'puts "Hello, World!"\n\narr = [1, 2, 3]\nputs "Array: #{arr.inspect}"\nputs "Sum: #{arr.sum}"',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
  rust: 'fn main() {\n    println!("Hello, World!");\n}',
};

export const InteractiveCodeConsole: React.FC<InteractiveCodeConsoleProps> = ({
  initialCode,
  initialLanguage = 'python',
}) => {
  const [code, setCode] = React.useState(initialCode || DEFAULT_CODE[initialLanguage] || '');
  const [language, setLanguage] = React.useState(initialLanguage);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [output, setOutput] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const [executionTime, setExecutionTime] = React.useState<number>(0);
  const [progress, setProgress] = React.useState<string>('');

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (!initialCode) {
      setCode(DEFAULT_CODE[newLanguage] || '');
    }
    setOutput('');
    setError('');
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setOutput('');
    setError('');
    setProgress('Starting execution...');
    setExecutionTime(0);

    try {
      // Create a temporary file via API
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No authentication token found');
        setIsExecuting(false);
        return;
      }

      // Create temp file for execution
      const createResponse = await fetch(`${API_URL}/autograder/execute/code/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          timeout: 60,
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`HTTP ${createResponse.status}: ${errorText}`);
      }

      const result = await createResponse.json();

      setIsExecuting(false);
      setProgress('');

      if (result.success) {
        setOutput(result.stdout || '(no output)');
        if (result.stderr) {
          setError(`stderr: ${result.stderr}`);
        }
        setExecutionTime(result.execution_time || 0);
      } else {
        setError(result.error || result.stderr || 'Execution failed');
        setOutput(result.stdout || '');
        setExecutionTime(result.execution_time || 0);
      }
    } catch (err) {
      setIsExecuting(false);
      setProgress('');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleClear = () => {
    setOutput('');
    setError('');
    setExecutionTime(0);
    setProgress('');
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${LANGUAGE_EXTENSIONS[language] || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Toolbar */}
      <Card size="small">
        <Space>
          <Select value={language} onChange={handleLanguageChange} style={{ width: 150 }}>
            {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
              <Option key={key} value={key}>
                {label}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecute}
            loading={isExecuting}
            disabled={!code.trim()}
          >
            Run Code
          </Button>

          <Button icon={<ClearOutlined />} onClick={handleClear} disabled={isExecuting}>
            Clear Output
          </Button>

          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download
          </Button>

          {executionTime > 0 && (
            <span style={{ marginLeft: '16px', color: '#888' }}>Execution time: {executionTime.toFixed(3)}s</span>
          )}
        </Space>
      </Card>

      {/* Code Editor */}
      <Card title="Code Editor" size="small" style={{ flex: 1, minHeight: 0 }}>
        <div style={{ height: '300px' }}>
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </Card>

      {/* Output Area */}
      <Card title="Output" size="small" style={{ flex: 1, minHeight: 0 }}>
        {isExecuting && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            {progress && <div style={{ marginTop: '16px', color: '#888' }}>{progress}</div>}
          </div>
        )}

        {!isExecuting && error && (
          <Alert
            message="Execution Error"
            description={<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error}</pre>}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {!isExecuting && output && (
          <div
            style={{
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              padding: '12px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '13px',
              overflowX: 'auto',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{output}</pre>
          </div>
        )}

        {!isExecuting && !error && !output && (
          <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>
            Click "Run Code" to execute your code
          </div>
        )}
      </Card>
    </div>
  );
};

export default InteractiveCodeConsole;
