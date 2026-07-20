// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Staff view of a per-student dataset variant pool: who's assigned which variant, and an
// override control. Rows are created automatically (see core.services.dataset_assignment)
// as students access the assignment — this panel never creates or deletes them.
import * as React from 'react';
import { Empty, Select, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { studentDataSetAssignmentsApi } from '../../../../api-client/clients';
import { StudentDataSetAssignment } from '../../../../api-client';
import { AssignmentDataSetType } from '../../../../types/models';
import { useAssignmentCapabilities } from '../../../../stores/usePermissionsStore';

const { Text } = Typography;

interface IProps {
  assignmentId: number;
  datasets: AssignmentDataSetType[];
}

const StudentDataSetAssignmentsPanel: React.FC<IProps> = ({ assignmentId, datasets }) => {
  const assignCaps = useAssignmentCapabilities(assignmentId);
  const canManage = assignCaps.manage_datasets !== false;
  const [rows, setRows] = React.useState<StudentDataSetAssignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<number | null>(null);

  const variants = React.useMemo(() => datasets.filter((d) => d.isStudentVariant), [datasets]);

  const load = React.useCallback(() => {
    setLoading(true);
    studentDataSetAssignmentsApi
      .list({ assignment: assignmentId })
      .then(setRows)
      .catch(() => message.error('Failed to load dataset assignments.'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const override = async (rowId: number, datasetId: number) => {
    setSavingId(rowId);
    try {
      await studentDataSetAssignmentsApi.partialUpdate({
        id: rowId,
        patchedStudentDataSetAssignment: { dataset: datasetId },
      });
      message.success('Assignment updated.');
      load();
    } catch {
      message.error('Failed to update the assignment.');
    } finally {
      setSavingId(null);
    }
  };

  if (variants.length < 2) {
    return (
      <Empty
        description="Mark two or more datasets as a per-student variant pool (in the Datasets tab) to assign students one each."
      />
    );
  }

  const columns = [
    { title: 'Student', dataIndex: 'studentEmail', key: 'studentEmail' },
    {
      title: 'Assigned variant',
      key: 'dataset',
      render: (_: unknown, row: StudentDataSetAssignment) => (
        <Select
          size="small"
          style={{ minWidth: 220 }}
          value={row.dataset}
          disabled={!canManage}
          loading={savingId === row.id}
          onChange={(datasetId) => override(row.id!, datasetId)}
          options={variants.map((v) => ({ value: v.id, label: v.name }))}
        />
      ),
    },
    {
      title: 'How assigned',
      key: 'assignedBy',
      render: (_: unknown, row: StudentDataSetAssignment) =>
        row.assignedByEmail ? (
          <Tag color="blue">Overridden by {row.assignedByEmail}</Tag>
        ) : (
          <Tag>Auto-assigned</Tag>
        ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text type="secondary" style={{ fontSize: 13 }}>
        Each student is assigned exactly one dataset variant the first time they access the
        assignment (evenly balanced across the pool). Group submissions share one variant.
        Override a student here if needed.
      </Text>
      {loading ? (
        <Spin />
      ) : rows.length === 0 ? (
        <Empty description="No students have been assigned a variant yet — assignment happens automatically when they first access the assignment's datasets." />
      ) : (
        <Table rowKey="id" size="small" columns={columns} dataSource={rows} pagination={false} />
      )}
    </Space>
  );
};

export default StudentDataSetAssignmentsPanel;
