import { TestCategory, TestCategoryType } from '../../../../../infrastructure/testCategory';
import { SubmissionType } from '../../../../../infrastructure/submission';

export const bySubmissionColumns = (categories: TestCategoryType[]) => {
  const columns = [
    {
      title: 'Student(s)',
      dataIndex: 'students',
      key: 'students',
    },
    ...TestCategory.sort(categories).map((category) => {
      return {
        title: category.name,
        dataIndex: category.id.toString(),
        key: category.id.toString(),
        align: 'center' as 'center',
      };
    }),
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      align: 'center' as 'center',
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
  },
  {
    title: 'Failed',
    dataIndex: 'failed',
    key: 'failed',
    align: 'center' as 'center',
  },
  {
    title: 'Error',
    dataIndex: 'error',
    key: 'error',
    align: 'center' as 'center',
  },
  {
    title: 'Not run',
    dataIndex: 'notrun',
    key: 'notrun',
    align: 'center' as 'center',
  },
];
