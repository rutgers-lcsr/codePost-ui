// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useState, useEffect, useCallback } from 'react';
import { Input, InputNumber, Typography, Button, message, Divider, Select, Space } from 'antd';
import { InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { AssignmentFileType, AssignmentType, TestCategoryType } from '../../../../../../types/models';
import { File as CodePostFile } from '../../../../../../utils/file';
import { TestScriptEditor } from '../TestDefinitions/TestScriptEditor';
import { TestResourceManager } from './TestResourceManager';
import { assignmentsApi, assignmentFilesApi, testCategoriesApi } from '../../../../../../api-client/clients';
import type { PatchedTestCategory } from '../../../../../../api-client';

interface IProps {
  category: TestCategoryType;
  assignment: AssignmentType;
  onUpdate: (cat: TestCategoryType) => void;
  helpers?: AssignmentFileType[];
}

export const TestCategoryUI = (props: IProps) => {
  const [name, setName] = useState(props.category.name);
  const [maxPoints, setMaxPoints] = useState(props.category.maxPoints || 0);
  const [script, setScript] = useState(props.category.testScript || '');
  const [targetFileName, setTargetFileName] = useState(props.category.targetFileName || undefined);
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentFileType[]>([]);
  // const [helperFiles, setHelperFiles] = useState<number[]>(props.category.helperFiles || []);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if category prop changes (switching categories)
  useEffect(() => {
    setName(props.category.name);
    setMaxPoints(props.category.maxPoints || 0);
    setScript(props.category.testScript || '');
    setTargetFileName(props.category.targetFileName || undefined);
    // setHelperFiles(props.category.helperFiles || []);
  }, [props.category]);

  // Improved loadFiles that fetches standard list
  const fetchAssignmentFiles = useCallback(async () => {
    // Use the generic listObject if possible, or reliance on props?
    // For now, let's try to reload based on props, BUT if we uploaded, props are stale.
    // We need to fetch files for this assignment.
    // We can use a direct fetch to API: /assignments/{id}/files/
    try {
      const { files } = (await assignmentsApi.retrieve({
        id: props.assignment.id,
      })) as unknown as AssignmentType;
      if (!files) {
        return;
      }
      const fileList: AssignmentFileType[] = [];
      for (const fileId of files) {
        if (!fileId) {
          continue;
        }

        const f = (await assignmentFilesApi.retrieve({
          id: fileId,
        })) as unknown as AssignmentFileType;
        if (f && !f.hidden) {
          fileList.push(f);
        }
      }
      setAssignmentFiles(fileList);
    } catch (e) {
      console.error(e);
    }
  }, [props.assignment.id]);

  useEffect(() => {
    fetchAssignmentFiles();
  }, [fetchAssignmentFiles]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Omit<PatchedTestCategory, 'id' | 'testCases' | 'resources'> = {
        name,
        maxPoints,
        testScript: script,
        targetFileName: targetFileName || null,
        // helperFiles: helperFiles, // Deprecated
      };
      const updated = (await testCategoriesApi.partialUpdate({
        id: props.category.id,
        patchedTestCategory: payload,
      })) as unknown as TestCategoryType;
      props.onUpdate(updated);
      message.success('Category saved');
    } catch (e) {
      console.error(e);
      message.error('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    name !== props.category.name ||
    maxPoints !== (props.category.maxPoints || 0) ||
    script !== (props.category.testScript || '') ||
    targetFileName !== (props.category.targetFileName || undefined);
  // JSON.stringify(helperFiles.sort()) !== JSON.stringify((props.category.helperFiles || []).sort());

  // Detect language of the target file
  const targetFileObj = assignmentFiles.find((f) => f.name === targetFileName);
  const detectedLanguage = targetFileObj ? CodePostFile.language(targetFileObj) : 'python';
  const normalizedLanguage = detectedLanguage.toLowerCase();
  const isJsLike =
    normalizedLanguage.includes('javascript') ||
    normalizedLanguage.includes('typescript') ||
    normalizedLanguage.includes('node');
  const isCppLike =
    normalizedLanguage.includes('c++') || normalizedLanguage === 'c' || normalizedLanguage.includes('cpp');

  const languageLabel =
    normalizedLanguage === 'r'
      ? 'R'
      : normalizedLanguage.startsWith('java')
        ? 'Java'
        : isJsLike
          ? 'JavaScript/Node'
          : isCppLike
            ? 'C/C++'
            : normalizedLanguage.includes('ruby')
              ? 'Ruby'
              : normalizedLanguage.includes('php')
                ? 'PHP'
                : 'Python';

  const syntaxHint =
    normalizedLanguage === 'r'
      ? 'run_test("Name", 5, "Optional description", function() { ... }, 30)'
      : normalizedLanguage.startsWith('java')
        ? '@Test(name="Name", points=5)'
        : isJsLike
          ? 'test("Name", 5, "Optional description", () => { ... }, 30);'
          : isCppLike
            ? 'TEST(Name, 5.0) { ... }'
            : normalizedLanguage.includes('ruby')
              ? 'run_test("Name", 5, "Optional description") do ... end'
              : normalizedLanguage.includes('php')
                ? 'Tester::test("Name", 5, "Optional description", function () { ... }, 30);'
                : '@test(name="Name", points=5)';

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header / Settings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space orientation="vertical">
          <div>
            <Space orientation="vertical">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Category Name
              </Typography.Text>
              <Input value={name} onChange={(e) => setName(e.target.value)} style={{ width: 250, display: 'block' }} />
            </Space>
          </div>
          <div>
            <Space orientation="vertical">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Target File
              </Typography.Text>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Select
                  style={{ width: 250 }}
                  value={targetFileName}
                  onChange={setTargetFileName}
                  placeholder="Select file to test"
                  allowClear
                >
                  {assignmentFiles.map((f) => (
                    <Select.Option key={f.id} value={f.name}>
                      {f.name}
                      {f.hidden && ' (Hidden)'}
                    </Select.Option>
                  ))}
                </Select>
                <Space size={'small'}>
                  <InfoCircleOutlined />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Select the file that the tests will be run against.
                  </Typography.Text>
                </Space>
              </div>
            </Space>
          </div>
          <div>
            <Space orientation="vertical">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Max Points
              </Typography.Text>
              <InputNumber
                value={maxPoints}
                onChange={(val) => setMaxPoints(val as number)}
                style={{ width: 80, display: 'block' }}
                disabled
                title="Calculated from @test(points=...) in script"
              />
            </Space>
          </div>
        </Space>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}></div>

        <div style={{ padding: '0 20px', marginBottom: 20, width: '100%' }}>
          {/* Resources Section moved to full width below header */}
          <TestResourceManager
            assignmentId={props.assignment.id}
            categoryId={props.category.id}
            resources={props.category.resources || []}
            onRefresh={async () => {
              // Reload category to get updated resources
              try {
                const updated = (await testCategoriesApi.retrieve({
                  id: props.category.id,
                })) as unknown as TestCategoryType;
                props.onUpdate(updated);
              } catch (e) {
                console.error(e);
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px 10px 20px' }}>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={isSaving} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>

      <Divider style={{ margin: '10px 0' }} />

      {/* Script Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography.Text strong style={{ marginBottom: 10 }}>
          Test Script
        </Typography.Text>
        {/* TODO: Make sure test decorators are by language */}
        <Typography.Text type="secondary" style={{ fontSize: 12, marginBottom: 10 }}>
          Write a {languageLabel} script. Use <code>{syntaxHint}</code> to define tests.
        </Typography.Text>

        <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 4 }}>
          <TestScriptEditor
            code={script}
            onChange={setScript}
            language={detectedLanguage}
            assignmentId={props.assignment.id}
            courseId={props.assignment.course}
            targetFileName={targetFileName || ''} // Pass selected file for AI generation context
            contextFiles={assignmentFiles} // Pass assignment files for context extraction
            onRubricItemChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
};
