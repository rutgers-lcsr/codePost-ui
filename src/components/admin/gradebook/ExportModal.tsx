// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Flex, Modal, Select, Typography, message } from 'antd';
import { Course, GradebookResponse } from '../../../api-client';
import { CourseGradebookService } from '../../../services/courseGradebook';
import { buildRows, sectionOptions } from './gradebookMath';

const { Text } = Typography;

interface IProps {
  open: boolean;
  onClose: () => void;
  course: Course;
  data: GradebookResponse;
}

/** A labelled multi-select with All / None shortcuts, for picking export columns. */
const ColumnPicker: React.FC<{
  label: string;
  options: Array<{ value: number; label: string }>;
  value: number[];
  onChange: (v: number[]) => void;
}> = ({ label, options, value, onChange }) => (
  <div>
    <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
      <Text strong>{label}</Text>
      <Flex gap={4}>
        <Button size="small" type="link" style={{ padding: 0 }} onClick={() => onChange(options.map((o) => o.value))}>
          All
        </Button>
        <Button size="small" type="link" style={{ padding: 0 }} onClick={() => onChange([])}>
          None
        </Button>
      </Flex>
    </Flex>
    <Select
      mode="multiple"
      allowClear
      aria-label={label}
      style={{ width: '100%' }}
      maxTagCount="responsive"
      placeholder={`No ${label.toLowerCase()} — none will be exported`}
      value={value}
      onChange={onChange}
      options={options}
    />
  </div>
);

/** Choose what goes into the gradebook CSV: which assignment/quiz columns and, optionally,
 *  a single section's students. Totals are recomputed server-side over the selection. */
const ExportModal: React.FC<IProps> = ({ open, onClose, course, data }) => {
  const [assignments, setAssignments] = React.useState<number[]>([]);
  const [quizzes, setQuizzes] = React.useState<number[]>([]);
  const [section, setSection] = React.useState<string | undefined>(undefined);
  const [exporting, setExporting] = React.useState(false);

  // Re-seed "everything selected" each time the dialog opens.
  React.useEffect(() => {
    if (open) {
      setAssignments(data.assignments.map((a) => a.id));
      setQuizzes(data.quizzes.map((q) => q.id));
      setSection(undefined);
    }
  }, [open, data]);

  const sections = React.useMemo(() => sectionOptions(buildRows(data)), [data]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await CourseGradebookService.exportCsv(course.id!, {
        label: [course.name, course.period, section].filter(Boolean).join('-'),
        // Omit a param when everything is selected, so the server exports "all" even if
        // columns are added between opening the dialog and clicking Export.
        assignments: assignments.length === data.assignments.length ? undefined : assignments.join(','),
        quizzes: quizzes.length === data.quizzes.length ? undefined : quizzes.join(','),
        section,
      });
      onClose();
    } catch {
      message.error('Failed to export the gradebook.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      title="Export gradebook CSV"
      open={open}
      onCancel={onClose}
      okText="Export"
      onOk={handleExport}
      confirmLoading={exporting}
      okButtonProps={{ disabled: assignments.length === 0 && quizzes.length === 0 }}
      destroyOnHidden
    >
      <Flex vertical gap={16} style={{ marginTop: 16 }}>
        <ColumnPicker
          label="Assignments"
          options={data.assignments.map((a) => ({ value: a.id, label: a.name }))}
          value={assignments}
          onChange={setAssignments}
        />
        <ColumnPicker
          label="Quizzes"
          options={data.quizzes.map((q) => ({ value: q.id, label: q.title }))}
          value={quizzes}
          onChange={setQuizzes}
        />
        {sections.length > 0 && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              Students
            </Text>
            <Select
              allowClear
              aria-label="Restrict to a section"
              placeholder="All sections"
              style={{ width: '100%' }}
              value={section}
              onChange={setSection}
              options={sections.map((s) => ({ value: s, label: s }))}
            />
          </div>
        )}
        <Text type="secondary" style={{ fontSize: 12 }}>
          Total and percent columns are recomputed over the selected columns only.
        </Text>
      </Flex>
    </Modal>
  );
};

export default ExportModal;
