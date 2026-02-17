import { Spin } from 'antd';
import { TestCategoryType } from '../../../../../types/models';

export const bySubmissionColumns = (shouldSort: boolean, categories: TestCategoryType[]) => {
  const sortedCategories = [...categories].sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
  const columns = [
    {
      title: 'Student(s)',
      dataIndex: 'students',
      key: 'students',
    },
    ...sortedCategories.map((category) => {
      return {
        title: (
          <span>
            {category.name} {!shouldSort && <Spin />}
          </span>
        ),
        dataIndex: category.name,
        key: category.id.toString(),
        align: 'center' as const,
        ...(shouldSort && { sorter: (a: any, b: any) => a[category.id] - b[category.id] }),
      };
    }),
    categories.length > 0 && {
      title: <span>Summary {!shouldSort && <Spin />}</span>,
      dataIndex: 'summary',
      key: 'summary',
      align: 'center' as const,
      ...(shouldSort && { sorter: (a: any, b: any) => a.passed - b.passed }),
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      align: 'center' as const,
    },
  ];
  return columns;
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
    sorter: (a: any, b: any) => a.passedValue - b.passedValue,
  },
  {
    title: 'Failed',
    dataIndex: 'failed',
    key: 'failed',
    align: 'center' as const,
    sorter: (a: any, b: any) => a.failedValue - b.failedValue,
  },
  {
    title: 'Error',
    dataIndex: 'error',
    key: 'error',
    align: 'center' as const,
    sorter: (a: any, b: any) => a.errorValue - b.errorValue,
  },
  {
    title: 'Not run',
    dataIndex: 'notRun',
    key: 'notRun',
    align: 'center' as const,
    sorter: (a: any, b: any) => a.nullValue - b.nullValue,
  },
];
