import { useState } from 'react';
import { Button, Modal, Alert, Radio } from 'antd';
import { ThunderboltOutlined, AppstoreOutlined, CodeOutlined } from '@ant-design/icons';
import { Assignment } from '../../../../../../infrastructure/assignment';
import { CodeWindow } from '../utils/CodeWindow';
import { TestScriptCardView } from './TestScriptCardView';

interface IProps {
    code: string;
    onChange: (code: string) => void;
    language: string;
    assignmentId: number;
    targetFileName: string;
    contextFiles: { id: number; name: string }[];
}

export const TestScriptEditor = (props: IProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'code' | 'card'>('code');

    const onGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const result = await Assignment.generateTest(props.assignmentId, {
                target_filename: props.targetFileName,
                language: props.language
            });

            if (result.script) {
                if (props.code && props.code.length > 20) {
                    Modal.confirm({
                        title: 'Replace existing script?',
                        content: 'You have existing code. Do you want to replace it with the generated script?',
                        onOk: () => props.onChange(result.script)
                    });
                } else {
                    props.onChange(result.script);
                }
            }
        } catch (e: any) {
            setError(e.message || 'Failed to generate test');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
            {/* Toolbar */}
            <div style={{
                marginBottom: 10,
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 12
            }}>
                <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="code"><CodeOutlined /> Code</Radio.Button>
                    <Radio.Button value="card"><AppstoreOutlined /> Builder</Radio.Button>
                </Radio.Group>

                <div style={{ width: 1, height: 20, background: '#d9d9d9' }} />

                <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={onGenerate}
                    loading={isGenerating}
                    disabled={!props.targetFileName}
                >
                    Generate (AI)
                </Button>

                {error && <Alert type="error" message={error} banner style={{ marginLeft: 'auto' }} />}
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}>
                {viewMode === 'code' ? (
                    <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <CodeWindow
                                code={props.code}
                                name={`test_script.${props.language === 'python' ? 'py' : 'txt'}`}
                                onChange={props.onChange}
                            />
                        </div>
                    </div>
                ) : (
                    <TestScriptCardView
                        code={props.code}
                        language={props.language}
                        onChange={props.onChange}
                    />
                )}
            </div>

            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                {viewMode === 'code'
                    ? "Write a script that executes the student's code. The script should print results or exit with status codes."
                    : "Use the builder to add test cases. Switching to Code view allows for manual edits."}
            </div>
        </div>
    );
};
