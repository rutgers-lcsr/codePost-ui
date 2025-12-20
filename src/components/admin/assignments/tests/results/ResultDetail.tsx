/* react imports */
import { useEffect, useState } from 'react';

import { Badge, Button, Card, Empty, Layout, Modal, Radio, Select, Typography } from 'antd';

/* codePost object imports */
import { SubmissionInfoType } from '../../../../../infrastructure/submission';
import { SubmissionTest, SubmissionTestType } from '../../../../../infrastructure/submissionTest';
import { TestCaseType } from '../../../../../infrastructure/testCase';
import { TestCategoryType } from '../../../../../infrastructure/testCategory';
import { colors } from '../../../../../theme/colors';

import TestsList from '../../../../code-review/code-panel/TestsList';

import { RESULT_STATUS, TestCasesByCategory, TestsBySubmission } from '../../../../core/testFetchUtils';

import * as ReactWindow from 'react-window';
import useWindowSize from '../../../../core/useWindowSize';

const List = (ReactWindow as any).FixedSizeList || (ReactWindow as any).default?.FixedSizeList;

interface IProps {
  visible: boolean;
  onCancel: () => void;
  testsBySubmission: TestsBySubmission;
  casesByCategory: TestCasesByCategory;
  categories: TestCategoryType[];
  submissions: SubmissionInfoType[];

  filterCategory: TestCategoryType | undefined;
  filterCase: TestCaseType | undefined;
  filterStatus: RESULT_STATUS | undefined;
  filterSubmission: SubmissionInfoType | undefined;
}

export const ResultDetail = (props: IProps) => {
  const [filterCategory, setFilterCategory] = useState<TestCategoryType | undefined>(props.filterCategory);
  const [filterCase, setFilterCase] = useState<TestCaseType | undefined>(props.filterCase);
  const [filterStatus, setFilterStatus] = useState<RESULT_STATUS | undefined>(props.filterStatus);
  const [filterSubmission, setFilterSubmission] = useState<SubmissionInfoType | undefined>(props.filterSubmission);

  const windowSize = useWindowSize();

  /********************** Props on change functions **********************************/
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (props.visible) setFilterCategory(props.filterCategory);
  }, [props.filterCategory, props.visible]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (props.visible) setFilterCase(props.filterCase);
  }, [props.filterCase, props.visible]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (props.visible) setFilterStatus(props.filterStatus);
  }, [props.filterStatus, props.visible]);
  useEffect(() => {
    const newSub = props.filterSubmission
      ? props.filterSubmission
      : props.submissions !== undefined && props.submissions.length > 0
        ? props.submissions[0]
        : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (props.visible) setFilterSubmission(newSub);
  }, [props.filterSubmission, props.visible, props.submissions]);

  /********************** State change functions **********************************/

  const handleCategoryChange = (value: string) => {
    const categoryID = parseInt(value, 10);
    const category = props.categories.find((c) => c.id === categoryID);
    if (category) {
      setFilterCategory(category);
    } else {
      setFilterCategory(undefined);
    }
  };

  const handleCaseChange = (value: string) => {
    const caseID = parseInt(value, 10);
    const cases =
      filterCategory && filterCategory.id in props.casesByCategory ? props.casesByCategory[filterCategory.id] : [];
    const testCase = cases.find((c) => c.id === caseID);
    if (testCase) {
      setFilterCase(testCase);
    } else {
      setFilterCase(undefined);
    }
  };

  const handleSubmissionChange = (submission: SubmissionInfoType) => {
    setFilterSubmission(submission);
  };

  const handleStatusChange = (e: any) => {
    if (e.target.value === '-1') {
      setFilterStatus(undefined);
    } else {
      // @ts-expect-error: legacy-ts-ignore
      const newStatus: RESULT_STATUS = RESULT_STATUS[e.target.value];
      setFilterStatus(newStatus);
    }
  };

  /**********************  utils **********************************/
  // figure out if a submission should be marked inactive based on the current filters
  const isInactive = (submission: SubmissionInfoType) => {
    // No status filter return all submissios
    if (filterStatus === undefined) return false;

    const thisSubmissionTests = props.testsBySubmission[submission.id] || [];
    // if there's a test filter, check to see that the submission has a test for that case with the right status
    if (filterCase) {
      return (
        SubmissionTest.getLatest(thisSubmissionTests).find(
          (t) => sameStatus(t, filterStatus) && t.testCase === filterCase.id,
        ) === undefined
      );
    }

    if (filterCategory) {
      const filterCaseIDS = props.casesByCategory[filterCategory.id].map((tc) => tc.id);
      return (
        SubmissionTest.getLatest(thisSubmissionTests).find(
          (t) => sameStatus(t, filterStatus) && filterCaseIDS.includes(t.testCase),
        ) === undefined
      );
    }

    // Else see if any test matches the filter status
    return SubmissionTest.getLatest(thisSubmissionTests).find((t) => sameStatus(t, filterStatus)) === undefined;
  };

  // does a submission test have the same status as a given status type
  const sameStatus = (t: SubmissionTestType, status: RESULT_STATUS) => {
    switch (status) {
      case RESULT_STATUS.Passed:
        return t.passed;
      case RESULT_STATUS.Failed:
        return !t.passed && !t.isError;
      case RESULT_STATUS.Error:
        return t.isError;
    }
  };

  /********************** Render utils **********************************/

  let testsToShow: SubmissionTestType[] = [];

  if (filterSubmission) {
    if (!(filterSubmission.id in props.testsBySubmission)) {
      testsToShow = [];
    } else {
      testsToShow = SubmissionTest.getLatest(props.testsBySubmission[filterSubmission.id] || []).filter((t) => {
        const meetsCategory = filterCategory ? t.testCategory === filterCategory.id : true;
        const meetsCase = filterCase ? t.testCase === filterCase.id : true;
        const meetsStatus = filterStatus !== undefined ? sameStatus(t, filterStatus) : true;
        return meetsCategory && meetsCase && meetsStatus;
      });
    }
  }

  const cases =
    filterCategory && filterCategory.id in props.casesByCategory ? props.casesByCategory[filterCategory.id] : [];

  const categorySelect = (
    <Select
      value={(filterCategory && filterCategory.id.toString()) || '0'}
      onChange={handleCategoryChange}
      style={{ minWidth: 200 }}
    >
      <Select.Option key={'0'} value={'0'}>
        <b>All categories</b>
      </Select.Option>
      {props.categories.map((category) => {
        return (
          <Select.Option key={category.id} value={category.id.toString()}>
            {category.name}
          </Select.Option>
        );
      })}
    </Select>
  );

  const caseSelect = (
    <Select
      value={(filterCase && filterCase.id.toString()) || '0'}
      onChange={handleCaseChange}
      style={{ minWidth: 200 }}
    >
      <Select.Option key={'0'} value={'0'}>
        <b>All tests</b>
      </Select.Option>
      {cases.map((testCase) => {
        return (
          <Select.Option key={testCase.id} value={testCase.id.toString()}>
            {testCase.description}
          </Select.Option>
        );
      })}
    </Select>
  );

  const statusSelect = (
    <Radio.Group
      value={filterStatus !== undefined ? RESULT_STATUS[filterStatus] : '-1'}
      onChange={handleStatusChange}
      buttonStyle="solid"
    >
      <Radio.Button className="test-btn" key={'-1'} value={'-1'}>
        <b>All</b>
      </Radio.Button>
      <Radio.Button
        className="test-btn--passed"
        key={RESULT_STATUS[RESULT_STATUS.Passed]}
        value={RESULT_STATUS[RESULT_STATUS.Passed]}
      >
        Passed
      </Radio.Button>
      <Radio.Button
        className="test-btn--failed"
        key={RESULT_STATUS[RESULT_STATUS.Failed]}
        value={RESULT_STATUS[RESULT_STATUS.Failed]}
      >
        Failed
      </Radio.Button>
      <Radio.Button
        className="test-btn--error"
        key={RESULT_STATUS[RESULT_STATUS.Error]}
        value={RESULT_STATUS[RESULT_STATUS.Error]}
      >
        Error
      </Radio.Button>
    </Radio.Group>
  );

  const submissionMenu = (
    <List
      itemData={props.submissions}
      height={windowSize.height - 450}
      itemCount={props.submissions.length}
      itemSize={54}
      width="100%"
    >
      {({ index, style }: any) => {
        const el = props.submissions[index];
        const extraStyle = {
          display: 'flex',
          height: 54,
          alignItems: 'stretch',
          borderBottom: '1px solid rgb(232,232,232)',
          cursor: 'pointer',
        };

        const inactiveStyle = { color: 'grey', backgroundColor: 'rgb(0,0,0,0.02)', fontStyle: 'italic' };
        const defaultStyle = { backgroundColor: 'rgb(0,0,0,0)' };
        const selectedStyle = { color: 'white', backgroundColor: colors.brandPrimary };

        const thisStyle = isInactive(el)
          ? inactiveStyle
          : filterSubmission && filterSubmission.id === el.id
            ? selectedStyle
            : defaultStyle;

        return (
          <div style={{ ...style, ...extraStyle }} onClick={handleSubmissionChange.bind({}, el)}>
            <div style={{ width: '100%', ...thisStyle, padding: '16px' }}>{el.students.toString()}</div>
          </div>
        );
      }}
    </List>
  );

  const closeButton = (
    <Button type="primary" onClick={props.onCancel}>
      Close
    </Button>
  );
  return (
    <Modal width={'85%'} open={props.visible} footer={[closeButton]} onCancel={props.onCancel}>
      <div className="display-flex align-items-center" style={{ marginBottom: 20 }}>
        <div className="display-flex  align-items-center">Category:&nbsp; {categorySelect}</div>
        <div className="display-flex  align-items-center" style={{ marginLeft: 15, marginRight: 15 }}>
          Test case:&nbsp; {caseSelect}
        </div>
        <div className="display-flex align-items-center">{statusSelect}</div>
      </div>
      <Layout>
        <Layout.Sider theme="light">
          <div style={{ marginBottom: 20 }}>
            <Typography.Title level={4}>Students</Typography.Title>
          </div>
          {submissionMenu}
        </Layout.Sider>
        <Layout.Content style={{ minHeight: 600 }}>
          {filterCase && testsToShow.length > 0 ? (
            <TestDetail testCase={filterCase} test={(testsToShow && testsToShow[0]) || undefined} />
          ) : testsToShow.length > 0 ? (
            <TestsList />
          ) : (
            <Card style={{ margin: 20 }}>
              <Empty description={'No tests.'} />
            </Card>
          )}
        </Layout.Content>
      </Layout>
    </Modal>
  );
};

interface IResultProps {
  test: SubmissionTestType | undefined;
  testCase: TestCaseType;
}

const TestDetail = (props: IResultProps) => {
  const status = props.test ? (
    props.test.passed ? (
      <span style={{ color: colors.brandPrimary }}>Passed</span>
    ) : props.test.isError ? (
      <span style={{ color: 'blue' }}>Error</span>
    ) : (
      <span style={{ color: 'red' }}>Failed</span>
    )
  ) : (
    <span style={{ color: 'grey' }}>Not Run</span>
  );
  let pointsBadge;
  if (props.test) {
    if (props.test.passed) {
      const points = `${props.testCase.pointsPass > 0 ? '+' : props.testCase.pointsPass < 0 ? '-' : ''}${props.testCase.pointsPass
        }`;
      pointsBadge = <Badge count={points} style={{ backgroundColor: '#52c41a' }} />;
    } else {
      const points = `${props.testCase.pointsFail > 0 ? '+' : props.testCase.pointsPass < 0 ? '-' : ''}${props.testCase.pointsFail
        }`;
      pointsBadge = <Badge count={points} style={{ backgroundColor: 'red' }} />;
    }
  }
  return (
    <div style={{ margin: 20 }}>
      <Card>
        <Typography.Title level={3}>
          {status}&nbsp;{pointsBadge}
        </Typography.Title>
        <br />
        {props.test && (
          <div>
            <Typography.Title level={4}>Logs:</Typography.Title>
            <span>{props.test.logs}</span>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResultDetail;
