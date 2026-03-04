// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useEffect, useState } from 'react';
import { Button, Empty, message, Select, Spin, Typography, Tooltip } from 'antd';
import { assignmentsApi, autograderApi, testCasesApi, testCategoriesApi } from '../../../../../api-client/clients';
import { RubricCategory, RubricComment, TypeEnum } from '../../../../../api-client';
import { RubricFullData } from '../../../../../types/rubric';
import { loadIDList } from '../../../../../utils/generics';
import {
  AssignmentFileType,
  AssignmentType,
  EnvironmentType,
  SubmissionInfoType,
  TestCaseType,
  TestCategoryType,
} from '../../../../../types/models';
import { TestScriptEditor } from './TestDefinitions/TestScriptEditor';
import { File as CodePostFile } from '../../../../../utils/file';

import { TestCreateModal } from './TestDefinitions/TestCreateModal';
import { TestBuilderModal } from './TestDefinitions/TestBuilderModal';
import { CaretRightOutlined, PlusOutlined } from '@ant-design/icons';
import { CodeWindow } from './utils/CodeWindow';
import NotebookEditor from '../../assignments/NotebookEditor';

export interface IBasicFile {
  id: number;
  name: string;
  code?: string;
  type?: string;
  canSave?: boolean;
}

interface IProps {
  currentAssignment: AssignmentType;
  submissions: SubmissionInfoType[];
  env?: EnvironmentType;
  updateEnv: (env: EnvironmentType) => void;
  reloadEnv?: () => void; // Unused?
  loading: boolean;
  helpers?: AssignmentFileType[];
}

export const TestDefinitions = (props: IProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<TestCategoryType[]>([]);
  const [testCases, setTestCases] = useState<TestCaseType[]>([]);
  const [rubricCategories, setRubricCategories] = useState<RubricCategory[]>([]);
  const [rubricComments, setRubricComments] = useState<Record<number, RubricComment[]>>({});
  const [activeFile, setActiveFile] = useState<string>('');

  const [activeSubmission, setActiveSubmission] = useState<SubmissionInfoType | undefined>(undefined);
  const [runContextMode, setRunContextMode] = useState<'solution' | 'example' | 'submission'>('solution');
  const [exampleCode, setExampleCode] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [activeTestId, setActiveTestId] = useState<number | null>(null);

  useEffect(() => {
    fetchTests();
  }, [props.currentAssignment.id]);

  useEffect(() => {
    // Default active file
    if (
      props.helpers &&
      props.helpers.length > 0 &&
      activeFile === 'main.py' &&
      !props.helpers.some((h) => h.name === 'main.py')
    ) {
      setActiveFile(props.helpers[0].name);
    }
  }, [props.helpers]);

  const [isRunning, setIsRunning] = useState(false);

  const getTestFileName = (tc: TestCaseType): string | undefined => {
    const cat = categories.find((c) => c.id === tc.testCategory);
    return cat?.targetFileName || cat?.name; // Fallback to name if targetFileName missing? Or just targetFileName.
  };

  const handleRunScript = async (testCase: TestCaseType) => {
    let fileId: number | undefined;
    let contextName = 'Assignment Files';
    let exampleCodeToSend: string | undefined;

    if (runContextMode === 'example') {
      // Example mode - use the example code editor content as the target file
      if (!exampleCode || exampleCode.trim() === '') {
        message.warning('Please paste your example code in the editor above.');
        return;
      }
      // Use the assignment file to get context (language, other files), but override content
      const fname = getTestFileName(testCase);
      const helperFile = props.helpers?.find((f) => f.name === fname);
      if (helperFile) {
        fileId = helperFile.id;
      }
      contextName = 'Example Submission';
      exampleCodeToSend = exampleCode;
    } else if (runContextMode === 'submission' && activeSubmission && activeSubmission.files) {
      // Submission mode - run against student's file
      const fname = getTestFileName(testCase);
      const subFile = (activeSubmission.files as any[]).find((f) => f.name === fname);
      if (subFile) {
        fileId = subFile.id;
        contextName = `Submission (${activeSubmission.students?.join(', ') || activeSubmission.id})`;
      } else {
        const fname = getTestFileName(testCase);
        message.warning(`File '${fname}' not found in selected submission. Falling back to template.`);
      }
    }

    // Fallback to Assignment Files (Template) for 'solution' mode or when submission file not found
    if (!fileId && props.helpers) {
      const fname = getTestFileName(testCase);
      const helperFile = props.helpers.find((f) => f.name === fname);
      if (helperFile) {
        fileId = helperFile.id;
        contextName = 'Assignment Files';
      }
    }

    if (!fileId) {
      const fname = getTestFileName(testCase);
      message.error(`Cannot find file '${fname}' to run against.`);
      return;
    }

    setIsRunning(true);
    try {
      const res = await autograderApi.executeFileAsyncCreate({
        asyncExecutionRequest: {
          fileId: fileId,
          testCode: testCase.testCode || testCase.text || '',
          forceExecute: true,
          exampleCode: exampleCodeToSend,
        },
      });
      message.success(`Execution queued against ${contextName} (Task: ${res.taskId}). Checking results...`);
    } catch (e: any) {
      message.error(`Failed to run script: ${e.message || 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      // 1. Fetch Test Categories & Tests
      if (props.currentAssignment.testCategories) {
        const cats = await loadIDList(props.currentAssignment.testCategories, {
          read: (id: number) => testCategoriesApi.retrieve({ id }),
        });
        setCategories(cats);
        const allTestIds = cats.reduce((acc, cat) => [...acc, ...(cat.testCases || [])], [] as number[]);
        const tcs = await loadIDList(allTestIds, { read: (id: number) => testCasesApi.retrieve({ id }) });
        setTestCases(tcs);
      } else {
        setCategories([]);
        setTestCases([]);
      }

      // 2. Fetch Rubrics (for linking)
      // We load rubric data to pass to the modal
      if (props.currentAssignment.id) {
        try {
          const rubricRequest = await assignmentsApi.rubricRetrieve({ id: props.currentAssignment.id });
          const rubric = rubricRequest as unknown as RubricFullData;
          setRubricCategories(rubric.rubricCategories);

          // Load comments for each category
          const commentsMap: Record<number, RubricComment[]> = {};

          // Initialize map for all categories
          rubric.rubricCategories.forEach((cat) => {
            commentsMap[cat.id] = [];
          });

          // Group comments by category
          rubric.rubricComments.forEach((comment) => {
            if (commentsMap[comment.category]) {
              commentsMap[comment.category].push(comment);
            }
          });

          setRubricComments(commentsMap);
        } catch (e) {
          console.error('Failed to load rubric', e);
        }
      }
    } catch (e) {
      console.error(e);
      message.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  // Auto-Category Management: Find or Create Category by Name (fileName)
  const getOrCreateCategory = async (name: string): Promise<number | null> => {
    const existing = categories.find((c) => c.name === name);
    if (existing) return existing.id;

    try {
      const newCat = await testCategoriesApi.create({
        testCategory: {
          name: name,
          targetFileName: name,
          assignment: props.currentAssignment.id,
          testScript: undefined,
          maxPoints: undefined,
          sortKey: undefined,
        },
      });
      setCategories((prev) => [...prev, newCat]);
      return newCat.id;
    } catch (e) {
      message.error(`Failed to create category for ${name}`);
      return null;
    }
  };

  const handleCreateTest = async (values: {
    fileName: string;
    testCode: string;
    type: string;
    rubricItem?: number;
  }) => {
    const catId = await getOrCreateCategory(values.fileName);
    if (!catId) return;

    try {
      const newTest = await testCasesApi.create({
        testCase: {
          description: `Test for ${values.fileName}`,
          type: values.type as TypeEnum,
          testCategory: catId,
          pointsPass: values.rubricItem ? 0 : 1, // If rubric linked, points determined by rubric
          pointsFail: 0,
          text: '',
          exposed: true,
          sortKey: testCases.filter((t) => t.testCategory === catId).length,
          testCode: values.testCode,
          explanation: '',
          rubricItem: values.rubricItem || null,
        },
      });
      setTestCases([...testCases, newTest]);
      setIsCreateModalOpen(false);

      // Auto-switch view to this file
      setActiveFile(values.fileName);
      setActiveTestId(newTest.id);
    } catch (e) {
      message.error('Failed to create test');
    }
  };

  const handleDeleteTest = async (testCtx: TestCaseType) => {
    try {
      await testCasesApi.destroy({ id: testCtx.id });
      setTestCases(testCases.filter((t) => t.id !== testCtx.id));
    } catch (e) {
      message.error('Failed to delete test');
    }
  };

  const handleSaveTest = async (testCtx: TestCaseType) => {
    try {
      const updated = await testCasesApi.partialUpdate({
        id: testCtx.id,
        patchedTestCase: testCtx as any,
      });
      setTestCases(testCases.map((t) => (t.id === updated.id ? updated : t)));
      return updated;
    } catch (e) {
      message.error('Failed to save test');
      return testCtx;
    }
  };

  // Derive unique files list
  const files = Array.from(
    new Set([
      ...(props.helpers?.map((h) => h.name) || []),
      ...testCases.map((t) => getTestFileName(t) || '').filter((f) => f),
    ]),
  ).sort();

  if (files.length === 0) files.push('main.py'); // Default if empty

  if (loading) return <Spin />;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={4}>Tests</Typography.Title>
        <Typography.Text type="secondary">
          Define unit tests, I/O tests, and scripts to grade submissions.
        </Typography.Text>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {/* File Tabs */}
          {files.map((file) => (
            <Button
              key={file}
              type={activeFile === file ? 'primary' : 'default'}
              onClick={() => setActiveFile(file)}
              style={{ borderRadius: 0 }}
            >
              {file}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Typography.Text strong>Run context:</Typography.Text>
        <Select
          style={{ width: 350 }}
          placeholder="Solution Code (Default)"
          onChange={(val: string) => {
            if (val === 'solution') {
              setRunContextMode('solution');
              setActiveSubmission(undefined);
            } else if (val === 'example') {
              setRunContextMode('example');
              setActiveSubmission(undefined);
              // Pre-fill example code with current assignment file content if empty
              if (!exampleCode) {
                const helperFile = props.helpers?.find((f) => f.name === activeFile);
                if (helperFile && helperFile.data) {
                  setExampleCode(helperFile.data);
                }
              }
            } else {
              // It's a submission ID
              const sub = props.submissions.find((s) => s.id === Number(val));
              if (sub) {
                setRunContextMode('submission');
                setActiveSubmission(sub);
              }
            }
          }}
          value={
            runContextMode === 'solution'
              ? 'solution'
              : runContextMode === 'example'
                ? 'example'
                : activeSubmission?.id?.toString()
          }
        >
          <Select.Option value="solution">📁 Assignment Files (Template)</Select.Option>
          <Select.Option value="example">✏️ Example Submission (Filled-out)</Select.Option>
          {props.submissions.length > 0 && (
            <Select.OptGroup label="Student Submissions">
              {props.submissions.map((s) => (
                <Select.Option key={s.id} value={s.id.toString()}>
                  {s.students && s.students.length > 0 ? `👤 ${s.students.join(', ')}` : `Submission ${s.id}`}
                </Select.Option>
              ))}
            </Select.OptGroup>
          )}
        </Select>
        <Tooltip title="Template: Run against Assignment Files as-is. Example: Provide a filled-out version to test against (includes all other assignment files). Submission: Test against real student code.">
          <Typography.Text type="secondary" style={{ cursor: 'help', fontSize: 12 }}>
            (?)
          </Typography.Text>
        </Tooltip>
      </div>

      {runContextMode === 'example' && (
        <div style={{ marginBottom: 20, border: '1px solid #1890ff', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              padding: '8px 12px',
              background: '#e6f7ff',
              borderBottom: '1px solid #1890ff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Typography.Text strong style={{ fontSize: 13, color: '#1890ff' }}>
                Example Submission for: {activeFile}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 10 }}>
                Write/paste a filled-out version of the template to test your test script against
              </Typography.Text>
            </div>
          </div>
          <div style={{ height: activeFile.endsWith('.ipynb') ? 600 : 250 }}>
            {activeFile.endsWith('.ipynb') ? (
              <NotebookEditor content={exampleCode} onChange={(val) => setExampleCode(val)} height="100%" />
            ) : (
              <CodeWindow
                code={exampleCode}
                name={activeFile || 'example.py'}
                onChange={(val: string) => setExampleCode(val)}
              />
            )}
          </div>
        </div>
      )}

      <div
        style={{
          border: '1px solid #f0f0f0',
          padding: 0,
          height: 'calc(100vh - 250px)',
          minHeight: 600,
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {(() => {
          const fileTests = testCases.filter((t) => getTestFileName(t) === activeFile);
          // Sort by ID is usually fine for creation order
          fileTests.sort((a, b) => a.id - b.id);

          let fileTest = fileTests.find((t) => t.id === activeTestId);
          // Default to first if activeTestId invalid/null
          if (!fileTest && fileTests.length > 0) {
            fileTest = fileTests[0];
          }

          if (!fileTest) {
            return (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    No test script defined for <b>{activeFile}</b>.
                  </span>
                }
                style={{ marginTop: 100 }}
              >
                <Button
                  type="primary"
                  onClick={() => handleCreateTest({ fileName: activeFile, testCode: '', type: 'script' })}
                >
                  Initialize Test Script
                </Button>
              </Empty>
            );
          }

          // Ensure we update activeTestId if we fell back to default
          // Side-effect in render is bad, but we use fileTest for rendering
          const currentTestId = fileTest.id;
          if (activeTestId !== currentTestId) {
            setActiveTestId(currentTestId);
          }

          // We have a test case, show editor
          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div
                style={{
                  padding: '10px 15px',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <span style={{ fontWeight: 500, color: '#666' }}>Test Script:</span>

                  {/* Test Selector (if multiple or to allow creating new) */}
                  <Select
                    key="test-selector"
                    value={currentTestId}
                    onChange={(val) => {
                      if (val === -1) {
                        setIsCreateModalOpen(true);
                      } else {
                        setActiveTestId(val);
                      }
                    }}
                    style={{ width: 300 }}
                  >
                    {fileTests.map((t, i) => {
                      // Resolve Rubric Item Name
                      let displayName = `Test Script ${i + 1}`;

                      if (t.rubricItem) {
                        // Find the comment
                        for (const cat of rubricCategories) {
                          const comments = rubricComments[cat.id] || [];
                          const found = comments.find((c) => c.id === t.rubricItem);
                          if (found) {
                            displayName = found.text ?? displayName; // Just text, no points
                            break;
                          }
                        }
                      } else if (t.description && t.description !== `Test for ${activeFile}`) {
                        displayName = t.description;
                      }

                      return (
                        <Select.Option key={t.id} value={t.id}>
                          {displayName}
                        </Select.Option>
                      );
                    })}
                    <Select.Option value={-1} style={{ borderTop: '1px solid #eee' }}>
                      <span style={{ color: '#1890ff' }}>+ New Test Script</span>
                    </Select.Option>
                  </Select>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button
                    icon={<CaretRightOutlined />}
                    loading={isRunning}
                    onClick={() => handleRunScript(fileTest!)}
                    disabled={loading}
                    title="Run this test script against the solution/starter code"
                  >
                    Run Script
                  </Button>
                  <Button icon={<PlusOutlined />} onClick={() => setIsBuilderOpen(true)}>
                    Add Code Block
                  </Button>
                  <Button danger size="small" onClick={() => handleDeleteTest(fileTest!)}>
                    Delete Script
                  </Button>
                  <Button type="primary" size="small" onClick={() => handleSaveTest(fileTest!)}>
                    Save Changes
                  </Button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <TestScriptEditor
                  code={fileTest.testCode || fileTest.text || ''}
                  onChange={(newCode) => {
                    // Update local state immediately
                    const updated = { ...fileTest!, testCode: newCode, text: newCode };
                    setTestCases(testCases.map((t) => (t.id === updated.id ? updated : t)));
                  }}
                  language={(() => {
                    const fname = getTestFileName(fileTest!) || activeFile;
                    const rawLang = CodePostFile.language({ name: fname } as any);
                    if (rawLang === 'jupyter notebook' || CodePostFile.extension(fname) === 'ipynb') {
                      return 'python';
                    }
                    return rawLang;
                  })()}
                  assignmentId={props.currentAssignment.id}
                  courseId={props.currentAssignment.course}
                  targetFileName={activeFile}
                  contextFiles={(() => {
                    const files = props.helpers || [];
                    return files;
                  })()}
                  rubricText={(() => {
                    if (!fileTest?.rubricItem) return undefined;
                    // Find the comment text
                    for (const cat of rubricCategories) {
                      const comments = rubricComments[cat.id] || [];
                      const found = comments.find((c) => c.id === fileTest!.rubricItem);
                      if (found)
                        return `${found.text || ''} (${found.pointDelta > 0 ? '+' : ''}${found.pointDelta} points)`;
                    }
                    return undefined;
                  })()}
                  // Rubric Linking Props
                  rubricCategories={rubricCategories}
                  rubricComments={rubricComments}
                  selectedRubricItem={fileTest!.rubricItem}
                  onRubricItemChange={(newId) => {
                    const updated = { ...fileTest!, rubricItem: newId };
                    setTestCases(testCases.map((t) => (t.id === updated.id ? updated : t)));
                    handleSaveTest(updated);
                  }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      <TestCreateModal
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTest}
        language={props.env?.language || 'python'}
        contextFiles={props.helpers || []}
        assignmentId={props.currentAssignment.id}
        courseId={props.currentAssignment.course}
        rubricCategories={rubricCategories}
        rubricComments={rubricComments}
        initialFileName={activeFile}
      />

      <TestBuilderModal
        open={isBuilderOpen}
        onCancel={() => setIsBuilderOpen(false)}
        language={(() => {
          const rawLang = CodePostFile.language({ name: activeFile } as any);
          if (rawLang === 'jupyter notebook' || CodePostFile.extension(activeFile) === 'ipynb') {
            return 'python';
          }
          return rawLang;
        })()}
        onInsert={(code) => {
          const fileTest = testCases.find((t) => getTestFileName(t) === activeFile);
          if (fileTest) {
            const newCode = (fileTest.testCode || '') + '\n' + code;
            const updated = { ...fileTest, testCode: newCode, text: newCode };
            setTestCases(testCases.map((t) => (t.id === updated.id ? updated : t)));
            // Optional: Auto-save?
            // handleSaveTest(updated);
          }
          setIsBuilderOpen(false);
        }}
      />
    </div>
  );
};
