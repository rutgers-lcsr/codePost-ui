import { useState, useEffect } from 'react';
import { Input, InputNumber, Typography, Button, message, Divider, Select, Space } from 'antd';
import { InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { TestCategoryType, AssignmentType } from '../../../../../../infrastructure/types';
import { TestCategory } from '../../../../../../infrastructure/testCategory';
import { TestScriptEditor } from '../TestDefinitions/TestScriptEditor';
import { AssignmentFile, AssignmentFileType } from '../../../../../../infrastructure/file';
import { TestResourceManager } from './TestResourceManager';
import { Assignment } from '../../../../../../infrastructure/assignment';

interface IProps {
  category: TestCategoryType;
  assignment: AssignmentType;
  onUpdate: (cat: TestCategoryType) => void;
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
  const fetchAssignmentFiles = async () => {
    // Use the generic listObject if possible, or reliance on props?
    // For now, let's try to reload based on props, BUT if we uploaded, props are stale.
    // We need to fetch files for this assignment.
    // We can use a direct fetch to API: /assignments/{id}/files/
    try {
      const { files } = await Assignment.read(props.assignment.id);
      if (!files) {
        return;
      }
      const fileList: AssignmentFileType[] = [];
      for (const file of files) {
        const id = typeof file === 'number' ? file : file.id;
        if (!id) {
          continue;
        }

        const f = await AssignmentFile.read(id);
        if (f && !f.hidden) {
          fileList.push(f);
        }
      }
      setAssignmentFiles(fileList);

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAssignmentFiles();
  }, [props.assignment.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await TestCategory.update({
        id: props.category.id,
        name,
        maxPoints,
        testScript: script,
        targetFileName: targetFileName || null,
        // helperFiles: helperFiles, // Deprecated
      });
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
            <Space orientation='vertical'>
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
                      {(f as any).hidden && ' (Hidden)'}
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
            <Space orientation='vertical'>
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
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>

        </div>

        <div style={{ padding: '0 20px', marginBottom: 20, width: "100%" }}>
          {/* Resources Section moved to full width below header */}
          <TestResourceManager
            assignmentId={props.assignment.id}
            categoryId={props.category.id}
            resources={props.category.resources || []}
            onRefresh={async () => {
              // Reload category to get updated resources
              try {
                const updated = await TestCategory.read(props.category.id);
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
        <Typography.Text type="secondary" style={{ fontSize: 12, marginBottom: 10 }}>
          Write a Python script. Use <code>@test("Name", points=5, description="Optional description")</code> to define tests.
        </Typography.Text>

        <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 4 }}>
          <TestScriptEditor
            code={script}
            onChange={setScript}
            language="python"
            assignmentId={props.assignment.id}
            targetFileName={targetFileName || ''} // Pass selected file for AI generation context
            contextFiles={[]} // TODO: Pass helper files if needed
            onRubricItemChange={() => { }}
          />
        </div>
      </div>
    </div>
  );
};
