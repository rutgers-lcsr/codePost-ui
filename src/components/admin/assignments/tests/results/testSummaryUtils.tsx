import { TestCategory, TestCategoryType } from '../../../../../infrastructure/testCategory';

export const bySubmissionColumns = (shouldSort: boolean, categories: TestCategoryType[]) => {
  const columns = [
    {
      title: 'Student(s)',
      dataIndex: 'students',
      key: 'students',
    },
    ...TestCategory.sort(categories).map((category) => {
      return {
        title: category.name,
        dataIndex: category.name,
        key: category.id.toString(),
        align: 'center' as 'center',
        ...(shouldSort && { sorter: (a: any, b: any) => a[category.id] - b[category.id] }),
      };
    }),
    categories.length > 0 && {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      align: 'center' as 'center',
      ...(shouldSort && { sorter: (a: any, b: any) => a.passed - b.passed }),
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      align: 'center' as 'center',
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
    align: 'center' as 'center',
    sorter: (a: any, b: any) => a.passedValue - b.passedValue,
  },
  {
    title: 'Failed',
    dataIndex: 'failed',
    key: 'failed',
    align: 'center' as 'center',
    sorter: (a: any, b: any) => a.failedValue - b.failedValue,
  },
  {
    title: 'Error',
    dataIndex: 'error',
    key: 'error',
    align: 'center' as 'center',
    sorter: (a: any, b: any) => a.errorValue - b.errorValue,
  },
  {
    title: 'Not run',
    dataIndex: 'notRun',
    key: 'notRun',
    align: 'center' as 'center',
    sorter: (a: any, b: any) => a.nullValue - b.nullValue,
  },
];
