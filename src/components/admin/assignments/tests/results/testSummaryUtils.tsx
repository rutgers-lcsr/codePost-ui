// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Spin } from 'antd';
import { TestCategoryType } from '../../../../../types/models';

interface SubmissionRow {
  [key: string]: number | string | React.ReactNode;
  passed: number;
}

interface TestRow {
  passedValue: number;
  failedValue: number;
  errorValue: number;
  nullValue: number;
}

export const bySubmissionColumns = (shouldSort: boolean, categories: TestCategoryType[]) => {
  const sortedCategories = [...categories].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));

  const categoryColumns = sortedCategories.map((category) => ({
    title: (
      <span>
        {category.name} {!shouldSort && <Spin />}
      </span>
    ),
    dataIndex: category.name,
    key: category.id.toString(),
    align: 'center' as const,
    ...(shouldSort && {
      sorter: (a: SubmissionRow, b: SubmissionRow) => (a[category.id] as number) - (b[category.id] as number),
    }),
  }));

  const summaryColumn =
    categories.length > 0
      ? [
          {
            title: <span>Summary {!shouldSort && <Spin />}</span>,
            dataIndex: 'summary',
            key: 'summary',
            align: 'center' as const,
            ...(shouldSort && { sorter: (a: SubmissionRow, b: SubmissionRow) => a.passed - b.passed }),
          },
        ]
      : [];

  return [
    {
      title: 'Student(s)',
      dataIndex: 'students',
      key: 'students',
    },
    ...categoryColumns,
    ...summaryColumn,
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      align: 'center' as const,
    },
  ];
};

export const byTestColumns = [
  {
    title: 'Test',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Passed',
    dataIndex: 'passed',
    key: 'passed',
    align: 'center' as const,
    sorter: (a: TestRow, b: TestRow) => a.passedValue - b.passedValue,
  },
  {
    title: 'Failed',
    dataIndex: 'failed',
    key: 'failed',
    align: 'center' as const,
    sorter: (a: TestRow, b: TestRow) => a.failedValue - b.failedValue,
  },
  {
    title: 'Error',
    dataIndex: 'error',
    key: 'error',
    align: 'center' as const,
    sorter: (a: TestRow, b: TestRow) => a.errorValue - b.errorValue,
  },
  {
    title: 'Not run',
    dataIndex: 'notRun',
    key: 'notRun',
    align: 'center' as const,
    sorter: (a: TestRow, b: TestRow) => a.nullValue - b.nullValue,
  },
];
