import { useEffect, useState } from 'react';
import { Button, Empty, message, Select, Spin, Typography, Tooltip } from 'antd';
import { AssignmentType, TestCaseType, TestCategoryType } from '../../../../../infrastructure/types';
import { TestCase } from '../../../../../infrastructure/testCase';
import { TestCategory } from '../../../../../infrastructure/testCategory';
import { RubricCategory, RubricCategoryType } from '../../../../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../../../../infrastructure/rubricComment';
import { loadIDList } from '../../../../../infrastructure/generics';
import { SubmissionInfoType } from '../../../../../infrastructure/submission';
import { EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { TestScriptEditor } from './TestDefinitions/TestScriptEditor';
import { AssignmentFileType, File as CodePostFile } from '../../../../../infrastructure/file';

import { TestCreateModal } from './TestDefinitions/TestCreateModal';
import { TestBuilderModal } from './TestDefinitions/TestBuilderModal';
import { CaretRightOutlined, PlusOutlined } from '@ant-design/icons';
import { Execution } from '../../../../../infrastructure/execution';
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
  const [rubricCategories, setRubricCategories] = useState<RubricCategoryType[]>([]);
  const [rubricComments, setRubricComments] = useState<Record<number, RubricCommentType[]>>({});
  const [activeFile, setActiveFile] = useState<string>('');

  const [activeSubmission, setActiveSubmission] = useState<SubmissionInfoType | undefined>(undefined);
  const [runContextMode, setRunContextMode] = useState<'solution' | 'example' | 'submission'>('solution');
  const [exampleCode, setExampleCode] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  useEffect(() => {
    fetchTests();
  }, [props.currentAssignment.id]);

  useEffect(() => {
    // Default active file
    if (props.helpers && props.helpers.length > 0 && activeFile === 'main.py' && !props.helpers.some(h => h.name === 'main.py')) {
      setActiveFile(props.helpers[0].name);
    }
  }, [props.helpers]);

  const [isRunning, setIsRunning] = useState(false);

  const handleRunScript = async (testCase: TestCaseType) => {
    let fileId: number | undefined;
    let contextName = "Assignment Files";
    let exampleCodeToSend: string | undefined;

    if (runContextMode === 'example') {
      // Example mode - use the example code editor content as the target file
      if (!exampleCode || exampleCode.trim() === '') {
        message.warning('Please paste your example code in the editor above.');
        return;
      }
      // Use the assignment file to get context (language, other files), but override content
      const helperFile = props.helpers?.find(f => f.name === testCase.fileName);
      if (helperFile) {
        fileId = helperFile.id;
      }
      contextName = "Example Submission";
      exampleCodeToSend = exampleCode;
    } else if (runContextMode === 'submission' && activeSubmission && activeSubmission.files) {
      // Submission mode - run against student's file
      const subFile = (activeSubmission.files as any[]).find(f => f.name === testCase.fileName);
      if (subFile) {
        fileId = subFile.id;
        contextName = `Submission (${activeSubmission.students?.join(', ') || activeSubmission.id})`;
      } else {
        message.warning(`File '${testCase.fileName}' not found in selected submission. Falling back to template.`);
      }
    }

    // Fallback to Assignment Files (Template) for 'solution' mode or when submission file not found
    if (!fileId && props.helpers) {
      const helperFile = props.helpers.find(f => f.name === testCase.fileName);
      if (helperFile) {
        fileId = helperFile.id;
        contextName = "Assignment Files";
      }
    }

    if (!fileId) {
      message.error(`Cannot find file '${testCase.fileName}' to run against.`);
      return;
    }

    setIsRunning(true);
    try {
      const res = await Execution.executeFileAsync({
        file_id: fileId,
        test_code: testCase.testCode || testCase.text || '',
        force_execute: true,
        example_code: exampleCodeToSend
      });
      message.success(`Execution queued against ${contextName} (Task: ${res.task_id}). Checking results...`);
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
        const cats = await loadIDList(props.currentAssignment.testCategories, TestCategory);
        setCategories(cats);
        const allTestIds = cats.reduce((acc, cat) => [...acc, ...(cat.testCases || [])], [] as number[]);
        const tcs = await loadIDList(allTestIds, TestCase);
        setTestCases(tcs);
      } else {
        setCategories([]);
        setTestCases([]);
      }

      // 2. Fetch Rubrics (for linking)
      // We load rubric data to pass to the modal
      if (props.currentAssignment.rubricCategories) {
        const rCats = await loadIDList(props.currentAssignment.rubricCategories, RubricCategory);
        setRubricCategories(rCats);

        // Load comments for each category
        const commentsMap: Record<number, RubricCommentType[]> = {};
        for (const cat of rCats) {
          if (cat.rubricComments && cat.rubricComments.length > 0) {
            const comments = await loadIDList(cat.rubricComments, RubricComment);
            commentsMap[cat.id] = comments;
          }
        }
        setRubricComments(commentsMap);
      }

    } catch (e) {
      console.error(e);
      message.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  // Auto-Category Management: Find or Create Category by Name (fileName)
  const getOrCreateCategory = async (name: string): Promise<number | null> => {
    const existing = categories.find(c => c.name === name);
    if (existing) return existing.id;

    try {
      const newCat = await TestCategory.create({
        id: -1,
        name: name,
        assignment: props.currentAssignment.id,
      });
      setCategories(prev => [...prev, newCat]);
      return newCat.id;
    } catch (e) {
      message.error(`Failed to create category for ${name}`);
      return null;
    }
  };

  const handleCreateTest = async (values: { fileName: string; testCode: string; type: string; rubricItem?: number }) => {
    const catId = await getOrCreateCategory(values.fileName);
    if (!catId) return;

    try {
      const newTest = await TestCase.create({
        id: -1,
        description: `Test for ${values.fileName}`,
        type: values.type,
        testCategory: catId,
        pointsPass: values.rubricItem ? 0 : 1, // If rubric linked, points determined by rubric
        pointsFail: 0,
        text: "",
        fileName: values.fileName,
        exposed: true,
        sortKey: testCases.filter(t => t.testCategory === catId).length,
        testCode: values.testCode,
        dataSet: null,
        explanation: "",
        rubricItem: values.rubricItem || null
      });
      setTestCases([...testCases, newTest]);
      setIsCreateModalOpen(false);

      // Auto-switch view to this file
      setActiveFile(values.fileName);

    } catch (e) {
      message.error("Failed to create test");
    }
  };

  const handleDeleteTest = async (testCtx: TestCaseType) => {
    try {
      await TestCase.delete(testCtx);
      setTestCases(testCases.filter(t => t.id !== testCtx.id));
    } catch (e) {
      message.error("Failed to delete test");
    }
  };

  const handleSaveTest = async (testCtx: TestCaseType) => {
    try {
      const updated = await TestCase.update(testCtx as any);
      setTestCases(testCases.map(t => t.id === updated.id ? updated : t));
      return updated;
    } catch (e) {
      message.error("Failed to save test");
      return testCtx;
    }
  };

  // Derive unique files list
  const files = Array.from(new Set([
    ...(props.helpers?.map(h => h.name) || []),
    ...testCases.map(t => t.fileName || "").filter(f => f)
  ])).sort();

  if (files.length === 0) files.push('main.py'); // Default if empty

  if (loading) return <Spin />;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={4}>Tests</Typography.Title>
        <Typography.Text type="secondary">Define unit tests, I/O tests, and scripts to grade submissions.</Typography.Text>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {/* File Tabs */}
          {files.map(file => (
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
                const helperFile = props.helpers?.find(f => f.name === activeFile);
                if (helperFile && helperFile.data) {
                  setExampleCode(helperFile.data);
                }
              }
            } else {
              // It's a submission ID
              const sub = props.submissions.find(s => s.id === Number(val));
              if (sub) {
                setRunContextMode('submission');
                setActiveSubmission(sub);
              }
            }
          }}
          value={runContextMode === 'solution' ? 'solution' : runContextMode === 'example' ? 'example' : activeSubmission?.id?.toString()}
        >
          <Select.Option value="solution">📁 Assignment Files (Template)</Select.Option>
          <Select.Option value="example">✏️ Example Submission (Filled-out)</Select.Option>
          {props.submissions.length > 0 && (
            <Select.OptGroup label="Student Submissions">
              {props.submissions.map(s => (
                <Select.Option key={s.id} value={s.id.toString()}>
                  {s.students && s.students.length > 0 ? `👤 ${s.students.join(', ')}` : `Submission ${s.id}`}
                </Select.Option>
              ))}
            </Select.OptGroup>
          )}
        </Select>
        <Tooltip title="Template: Run against Assignment Files as-is. Example: Provide a filled-out version to test against (includes all other assignment files). Submission: Test against real student code.">
          <Typography.Text type="secondary" style={{ cursor: 'help', fontSize: 12 }}>(?)</Typography.Text>
        </Tooltip>
      </div>

      {runContextMode === 'example' && (
        <div style={{ marginBottom: 20, border: '1px solid #1890ff', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: '#e6f7ff', borderBottom: '1px solid #1890ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography.Text strong style={{ fontSize: 13, color: '#1890ff' }}>Example Submission for: {activeFile}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 10 }}>
                Write/paste a filled-out version of the template to test your test script against
              </Typography.Text>
            </div>
          </div>
          <div style={{ height: activeFile.endsWith('.ipynb') ? 600 : 250 }}>
            {activeFile.endsWith('.ipynb') ? (
              <NotebookEditor
                content={exampleCode}
                onChange={(val) => setExampleCode(val)}
                height="100%"
              />
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


      <div style={{ border: '1px solid #f0f0f0', padding: 0, height: 'calc(100vh - 250px)', minHeight: 600, background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
        {(() => {
          const fileTest = testCases.find(t => t.fileName === activeFile);

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
                <Button type="primary" onClick={() => handleCreateTest({ fileName: activeFile, testCode: '', type: 'script' })}>
                  Initialize Test Script
                </Button>
              </Empty>
            );
          }

          // We have a test case, show editor
          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '10px 15px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#666' }}>Test Script for {activeFile}</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button
                    icon={<CaretRightOutlined />}
                    loading={isRunning}
                    onClick={() => handleRunScript(fileTest)}
                    disabled={loading}
                    title="Run this test script against the solution/starter code"
                  >
                    Run Script
                  </Button>
                  <Button icon={<PlusOutlined />} onClick={() => setIsBuilderOpen(true)}>Add Test Case</Button>
                  <Button danger size="small" onClick={() => handleDeleteTest(fileTest)}>Delete Script</Button>
                  <Button type="primary" size="small" onClick={() => handleSaveTest(fileTest)}>Save Changes</Button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <TestScriptEditor
                  code={fileTest.testCode || fileTest.text || ""}
                  onChange={(newCode) => {
                    // Update local state immediately
                    const updated = { ...fileTest, testCode: newCode, text: newCode };
                    setTestCases(testCases.map(t => t.id === updated.id ? updated : t));
                  }}
                  language={(() => {
                    const ext = CodePostFile.extension(fileTest.fileName || activeFile);
                    const rawLang = CodePostFile.language2(ext);
                    if (rawLang === 'jupyter notebook' || ext === 'ipynb' || (fileTest.fileName || activeFile).endsWith('.ipynb')) {
                      return 'python';
                    }
                    return rawLang;
                  })()}
                  assignmentId={props.currentAssignment.id}
                  targetFileName={activeFile}
                  contextFiles={props.helpers || []}
                />
              </div>
            </div>
          );
        })()}
      </div>

      <TestCreateModal
        visible={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTest}
        language={props.env ? props.env.language : 'python'}
        contextFiles={props.helpers || []}
        assignmentId={props.currentAssignment.id}
        rubricCategories={rubricCategories}
        rubricComments={rubricComments}
        initialFileName={activeFile}
      />

      <TestBuilderModal
        visible={isBuilderOpen}
        onCancel={() => setIsBuilderOpen(false)}
        language={(() => {
          const ext = CodePostFile.extension(activeFile);
          const rawLang = CodePostFile.language2(ext);
          if (rawLang === 'jupyter notebook' || ext === 'ipynb' || activeFile.endsWith('.ipynb')) {
            return 'python';
          }
          return rawLang;
        })()}
        onInsert={(code) => {
          const fileTest = testCases.find(t => t.fileName === activeFile);
          if (fileTest) {
            const newCode = (fileTest.testCode || "") + "\n" + code;
            const updated = { ...fileTest, testCode: newCode, text: newCode };
            setTestCases(testCases.map(t => t.id === updated.id ? updated : t));
            // Optional: Auto-save?
            // handleSaveTest(updated);
          }
          setIsBuilderOpen(false);
        }}
      />
    </div>
  );
};
