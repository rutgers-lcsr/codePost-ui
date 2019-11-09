/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports */
import { Layout, Menu, Switch, Divider } from 'antd';

/* codePost object imports */
import { AssignmentType } from '../../../../../../infrastructure/assignment';
import { TestCase, TestCaseType } from '../../../../../../infrastructure/testCase';
import { TestCategory, TestCategoryType } from '../../../../../../infrastructure/testCategory';
import { SolutionFileType } from '../../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../../infrastructure/autograder/helperFile';
import { SubmissionType } from '../../../../../../infrastructure/submission';
import { EnvironmentType } from '../../../../../../infrastructure/autograder/environment';

/* codePost component imports */
import { TestItem } from './TestDefinitions/TestItem';
// import { ProMode } from './TestDefinitions/ProMode';
import { ViewSource } from './TestDefinitions/ViewSource';
import { AddCategoryModal } from './TestDefinitions/AddCategoryModal';
import { EditCategoryModal } from './TestDefinitions/EditCategoryModal';
import { AddTestModal } from './TestDefinitions/AddTestModal';

/* codePost utils imports */
import { fetchTestData, TestCasesByCategory } from '../testFetchUtils';
import { hasNativeTestSupport } from './utils/languageUtils';

const { Sider, Content } = Layout;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  solutions: SolutionFileType[];
  helpers: HelperFileType[];
  submissions: SubmissionType[];
  env: EnvironmentType;
}

enum DETAIL_TYPE {
  EditTests,
  ViewSource,
}

export const TestDefinitions = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [casesByCategory, setCasesByCategory] = useState<TestCasesByCategory>({});
  const [categories, setCategories] = useState<TestCategoryType[]>([]);
  const [panel, setPanel] = useState<DETAIL_TYPE>(DETAIL_TYPE.EditTests);
  const [activeTest, setActiveTest] = useState<TestCaseType | undefined>(undefined);

  /******************************* Fetch Data ****************************/
  useEffect(() => {
    const fetchData = async () => {
      const [categories, casesByCategory]: any = await fetchTestData(props.currentAssignment);
      setCategories(categories);
      setCasesByCategory(casesByCategory);
    };

    fetchData();
  }, [props.currentAssignment]);

  /******************************* Category functions  ****************************/

  const addCategory = async (name: string, proMode: boolean) => {
    const payload = {
      id: -1,
      name: name,
      assignment: props.currentAssignment.id,
      type: proMode ? 'bash' : 'normal',
    };
    const newCategory = await TestCategory.create(payload);

    setCategories([...categories, newCategory]);
    const newCases = { ...casesByCategory };
    newCases[newCategory.id] = [];
    setCasesByCategory(newCases);
  };

  const updateCategory = (testCategory: TestCategoryType) => {
    return TestCategory.update(testCategory).then((newCategory) => {
      replaceTestCategory(newCategory);
    });
  };

  const deleteCategory = (testCategory: TestCategoryType) => {
    return TestCategory.delete(testCategory.id).then(() => {
      setCategories(categories.filter((el) => el.id !== testCategory.id));
    });
  };

  const saveTest = async (testcase: TestCaseType) => {
    let newTest;
    if (testcase.id < 0) {
      newTest = await TestCase.create(testcase);
    } else {
      newTest = await TestCase.update(testcase);
    }

    replaceTestCase(newTest, testcase);
    setActiveTest(testcase);
    return newTest;
  };

  const addTest = async (language: string | null, category: number) => {
    // If a language doesn't have native support, default to a bash unit test
    const externalOnly = !props.env || !props.env.language;
    const hasNativeSupport = !externalOnly && language && hasNativeTestSupport(language);
    const dummyTestCase = {
      id: -1,
      sortKey: 0,
      testCategory: category,
      description: 'New Test',
      type: hasNativeSupport ? 'io' : externalOnly ? 'external' : 'bash-unit',
      pointsPass: 0,
      pointsFail: 0,
      text: '',
      function: '',
      fileName: '',
      expectedOutput: '',
      input: '',
      checkReturn: true,
      modified: '',
    };

    const newTestCase = await saveTest(dummyTestCase);
    const newCases = { ...casesByCategory };
    newCases[newTestCase.testCategory] = [...casesByCategory[newTestCase.testCategory], newTestCase];
    setCasesByCategory(newCases);
    setActiveTest(newTestCase);
  };

  const deleteTest = (testCase: TestCaseType) => {
    const newCases = { ...casesByCategory };
    newCases[testCase.testCategory] = newCases[testCase.testCategory].filter((el) => el.id !== testCase.id);

    // Load new test
    const sorted = TestCase.sort(casesByCategory[testCase.testCategory]);
    const index = sorted.findIndex((el) => el.id === testCase.id);
    if (index === 0) {
      if (sorted.length > 1) {
        setActiveTest(sorted[1]);
      } else {
        setActiveTest(undefined);
      }
    } else {
      setActiveTest(sorted[index - 1]);
    }

    setCasesByCategory(newCases);
    return TestCase.delete(testCase.id);
  };

  /******************************* State Change Functions  ****************************/

  const replaceTestCase = (newCase: TestCaseType, oldCase: TestCaseType) => {
    const filteredTests = casesByCategory[newCase.testCategory].filter((tc) => {
      return tc.id !== oldCase.id;
    });
    const newCases = { ...casesByCategory };
    newCases[newCase.testCategory] = [...filteredTests, newCase];
    setCasesByCategory(newCases);
  };

  const replaceTestCategory = (newCategory: TestCategoryType) => {
    const filteredCategories = categories.filter((cat) => {
      return cat.id !== newCategory.id;
    });
    setCategories([...filteredCategories, newCategory]);
  };

  /******************************* Return  ****************************/

  const externalOnly = !props.env || !props.env.language;

  switch (panel) {
    case DETAIL_TYPE.ViewSource:
      return (
        <div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              fontSize: 15,
              alignItems: 'center',
              padding: 10,
            }}
          >
            View Source: &nbsp; <Switch defaultChecked={true} onChange={setPanel.bind({}, DETAIL_TYPE.EditTests)} />
          </div>
          <ViewSource
            submissions={props.submissions}
            solutions={props.solutions}
            helpers={props.helpers}
            env={props.env}
          />
        </div>
      );
    case DETAIL_TYPE.EditTests:
      return categories.length > 0 ? (
        <div>
          <div style={{ fontSize: 11 }} id="Autograder">
            <Layout>
              <Sider theme="light">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#ccc',
                    justifyContent: 'space-between',
                    padding: '0 15px',
                    fontSize: '14px',
                    height: '30px',
                  }}
                >
                  Tests
                  <div>
                    <AddCategoryModal addCategory={addCategory} externalOnly={externalOnly} icon={true} />
                    &nbsp; &nbsp;
                    <AddTestModal addTest={addTest.bind({}, props.env.language)} categories={categories} />
                  </div>
                </div>
                <Menu
                  defaultOpenKeys={categories.map((el) => el.id.toString())}
                  mode="inline"
                  style={{ height: '100%' }}
                >
                  {TestCategory.sort(categories).map((category) => {
                    return (
                      <Menu.SubMenu
                        key={category.id}
                        title={
                          <span>
                            {category.name}{' '}
                            <EditCategoryModal
                              testCategory={category}
                              updateCategory={updateCategory}
                              deleteCategory={deleteCategory}
                              externalOnly={externalOnly}
                            />{' '}
                          </span>
                        }
                      >
                        {category.id in casesByCategory
                          ? TestCase.sort(casesByCategory[category.id]).map((el) => (
                              <Menu.Item
                                key={el.id}
                                style={{ height: 'fit-content', minHeight: 40 }}
                                onClick={() => {
                                  setActiveTest(el);
                                }}
                              >
                                {el.description}
                              </Menu.Item>
                            ))
                          : null}
                      </Menu.SubMenu>
                    );
                  })}
                  <div style={{ marginTop: 15, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
                    {externalOnly ? null : (
                      <div>
                        <Divider />
                        <div
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: '10px',
                          }}
                        >
                          View source: &nbsp;
                          <Switch defaultChecked={false} onChange={setPanel.bind({}, DETAIL_TYPE.ViewSource)} />
                        </div>
                      </div>
                    )}
                  </div>
                </Menu>
              </Sider>
              <Content style={{ margin: 15 }}>
                <div>
                  {activeTest && (
                    <TestItem
                      key={activeTest.id}
                      currentAssignment={props.currentAssignment}
                      testCase={activeTest}
                      saveTest={saveTest}
                      files={props.solutions}
                      env={props.env}
                      deleteTest={deleteTest}
                      submissions={props.submissions}
                    />
                  )}
                </div>
              </Content>
            </Layout>
          </div>
        </div>
      ) : (
        <AddCategoryModal addCategory={addCategory} externalOnly={externalOnly} />
      );
  }
};
