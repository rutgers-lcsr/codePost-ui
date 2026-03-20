// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* NotebookEditor - Rich editor for Jupyter Notebooks (.ipynb)
/**********************************************************************************************************************/

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CodeOutlined,
  DeleteOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Button, Card, Empty, Radio, Space, Tooltip, Typography } from 'antd';
import * as React from 'react';
import { colors } from '../../../../theme/colors';
import { NotebookStructure, NotebookCell, File as CodePostFile } from '../../../../utils/file';

const { Text } = Typography;

interface NotebookEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  height?: string | number;
}

const NotebookEditor: React.FC<NotebookEditorProps> = ({ content, onChange, height = '500px' }) => {
  const [notebook, setNotebook] = React.useState<NotebookStructure | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const isInternalUpdate = React.useRef(false);

  // Initialize notebook from content
  React.useEffect(() => {
    // Skip update if it originated from within this component
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    try {
      const parsed = CodePostFile.parseNotebook(content);
      setNotebook(parsed);
      setParseError(null);
    } catch (e) {
      console.error('Failed to parse notebook JSON:', e);
      setParseError(e instanceof Error ? e.message : 'Invalid JSON content');
    }
  }, [content]);

  // Update notebook state and propagate changes to parent
  const updateNotebook = (newNotebook: NotebookStructure) => {
    setNotebook(newNotebook);
    isInternalUpdate.current = true;
    onChange(JSON.stringify(newNotebook, null, 2));
  };

  const handleCellChange = (index: number, newSource: string) => {
    if (!notebook) return;

    const newCells = [...notebook.cells];
    // Jupyter splits source into lines usually, but we can store as array of one string or multiple lines.
    // Standard is often array of lines including \n. For simplicity in editor we join/split.
    // Here we'll just store as one string in array for now or split by newline if we want to be pedantic.
    // The Monaco editor gives us a single string.

    // Let's try to preserve the array of strings format if possible, or just wrapping current val
    newCells[index] = {
      ...newCells[index],
      source: newSource.split('\n').map((line, i, arr) => (i === arr.length - 1 ? line : line + '\n')),
    };

    updateNotebook({ ...notebook, cells: newCells });
  };

  const handleTypeChange = (index: number, newType: 'code' | 'markdown' | 'raw') => {
    if (!notebook) return;
    const newCells = [...notebook.cells];
    newCells[index] = { ...newCells[index], cell_type: newType };

    // Reset outputs if switching away from code
    if (newType !== 'code') {
      delete newCells[index].outputs;
      delete newCells[index].execution_count;
    } else {
      newCells[index].outputs = [];
      newCells[index].execution_count = null;
    }

    updateNotebook({ ...notebook, cells: newCells });
  };

  const handleAddCell = (index: number) => {
    if (!notebook) return;
    const newCell: NotebookCell = {
      cell_type: 'code',
      source: [],
      metadata: {},
      outputs: [],
      execution_count: null,
    };
    const newCells = [...notebook.cells];
    newCells.splice(index + 1, 0, newCell);
    updateNotebook({ ...notebook, cells: newCells });
  };

  const handleDeleteCell = (index: number) => {
    if (!notebook) return;
    const newCells = [...notebook.cells];
    newCells.splice(index, 1);
    updateNotebook({ ...notebook, cells: newCells });
  };

  const handleMoveCell = (index: number, direction: 'up' | 'down') => {
    if (!notebook) return;
    const newCells = [...notebook.cells];
    if (direction === 'up' && index > 0) {
      [newCells[index], newCells[index - 1]] = [newCells[index - 1], newCells[index]];
    } else if (direction === 'down' && index < newCells.length - 1) {
      [newCells[index], newCells[index + 1]] = [newCells[index + 1], newCells[index]];
    }
    updateNotebook({ ...notebook, cells: newCells });
  };

  const getSourceString = (source: string | string[]) => {
    if (Array.isArray(source)) {
      return source.join('');
    }
    return source || '';
  };

  if (parseError) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <Text type="danger">Error parsing Notebook: {parseError}</Text>
        <div style={{ marginTop: 10 }}>
          <Text type="secondary">Switch to "Raw JSON" view to fix syntax errors.</Text>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ height, overflowY: 'auto', padding: '10px', background: '#f5f5f5' }}>
      {notebook.cells.length === 0 && (
        <Empty description="No cells in notebook" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => handleAddCell(-1)} icon={<PlusOutlined />}>
            Add First Cell
          </Button>
        </Empty>
      )}

      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {notebook.cells.map((cell, index) => (
          <Card
            key={index}
            size="small"
            style={{
              borderLeft: `4px solid ${cell.cell_type === 'code' ? colors.actionBlue : '#faad14'}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
            bodyStyle={{ padding: '12px' }}
          >
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
              <Space>
                <Radio.Group
                  value={cell.cell_type}
                  onChange={(e) => handleTypeChange(index, e.target.value)}
                  size="small"
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="code">
                    <CodeOutlined /> Code
                  </Radio.Button>
                  <Radio.Button value="markdown">
                    <FileTextOutlined /> Markdown
                  </Radio.Button>
                  <Radio.Button value="raw">Raw</Radio.Button>
                </Radio.Group>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  Cell {index + 1}
                </Text>
              </Space>

              <Space size={4}>
                <Tooltip title="Move Up">
                  <Button
                    icon={<ArrowUpOutlined />}
                    size="small"
                    disabled={index === 0}
                    onClick={() => handleMoveCell(index, 'up')}
                  />
                </Tooltip>
                <Tooltip title="Move Down">
                  <Button
                    icon={<ArrowDownOutlined />}
                    size="small"
                    disabled={index === notebook.cells.length - 1}
                    onClick={() => handleMoveCell(index, 'down')}
                  />
                </Tooltip>
                <Tooltip title="Delete Cell">
                  <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDeleteCell(index)} />
                </Tooltip>
              </Space>
            </div>

            {/* Editor */}
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}>
              <Editor
                height={cell.cell_type === 'markdown' ? '150px' : '200px'}
                defaultLanguage={
                  cell.cell_type === 'code'
                    ? (notebook.metadata?.language_info as any)?.name?.toLowerCase() ||
                      (notebook.metadata?.kernelspec as any)?.language?.toLowerCase() ||
                      'python'
                    : 'markdown'
                }
                language={
                  cell.cell_type === 'code'
                    ? (notebook.metadata?.language_info as any)?.name?.toLowerCase() ||
                      (notebook.metadata?.kernelspec as any)?.language?.toLowerCase() ||
                      'python'
                    : 'markdown'
                }
                value={getSourceString(cell.source)}
                onChange={(val) => handleCellChange(index, val || '')}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'off',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  fontSize: 13,
                  folding: false,
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  contextmenu: false,
                  // Adjust padding to make it look like a cell
                  padding: { top: 8, bottom: 8 },
                }}
              />
            </div>

            {/* Add Button Below */}
            <div
              style={{
                textAlign: 'center',
                height: 10,
                marginTop: 8,
                position: 'relative',
                zIndex: 1,
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
              className="add-cell-trigger"
            >
              <Button
                type="dashed"
                shape="circle"
                icon={<PlusOutlined />}
                size="small"
                style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}
                onClick={() => handleAddCell(index)}
                title="Add Cell Below"
              />
            </div>
            <style>{`
              .add-cell-trigger:hover {
                opacity: 1 !important;
              }
            `}</style>
          </Card>
        ))}
        {/* Always visible add button at the bottom if cells exist */}
        {notebook.cells.length > 0 && (
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => handleAddCell(notebook.cells.length - 1)}>
            Add Cell at Bottom
          </Button>
        )}
      </Space>
    </div>
  );
};

export default NotebookEditor;
