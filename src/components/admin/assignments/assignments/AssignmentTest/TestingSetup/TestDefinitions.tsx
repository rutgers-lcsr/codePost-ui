/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports */
import { Button, Collapse, Input, Layout, Menu, Modal, Row, Switch, Tag } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost object imports */
import { AssignmentType } from '../../../../../../infrastructure/assignment';
import { TestCase, TestCaseType } from '../../../../../../infrastructure/testCase';
import { TestCategory, TestCategoryType } from '../../../../../../infrastructure/testCategory';
import { SolutionFileType } from '../../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../../infrastructure/autograder/helperFile';
import { SubmissionType } from '../../../../../../infrastructure/submission';
import { EnvironmentType } from '../../../../../../infrastructure/autograder/environment';

import ReactMarkdown from 'react-markdown';

/* codePost component imports */
import { TestItem } from './TestDefinitions/TestItem';
import { ProMode } from './TestDefinitions/ProMode';

/* codePost utils imports */
import { fetchTestData, TestCasesByCategory } from '../testUtils';

const { Panel } = Collapse;
const { Sider, Content } = Layout;

interface IProps {
  currentAssignment: AssignmentType;
  solutions: SolutionFileType[];
  helpers: HelperFileType[];
  submissions: SubmissionType[];
  env: EnvironmentType;
}

export const TestDefinitions = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [casesByCategory, setCasesByCategory] = useState<TestCasesByCategory>({});
  const [categories, setCategories] = useState<TestCategoryType[]>([]);
  const [newTestCounter, setNewTestCounter] = useState(-1);
  const [currentCategory, setCurrentCategory] = useState('');

  /******************************* Fetch Data ****************************/
  useEffect(() => {
    const fetchData = async () => {
      const [categories, casesByCategory]: any = await fetchTestData(props.currentAssignment);
      setCategories(categories);
      setCasesByCategory(casesByCategory);
      setCurrentCategory(categories.length > 0 ? categories[0].id.toString() : '');
    };

    fetchData();
  }, [props.currentAssignment]);

  /******************************* API / State Change Functions  ****************************/
  const saveTest = async (testcase: TestCaseType) => {
    let newTest;
    if (testcase.id < 0) {
      newTest = await TestCase.create(testcase);
    } else {
      newTest = await TestCase.update(testcase);
    }

    replaceTestCase(newTest, testcase);
    return newTest;
  };

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

  const addTestCase = (newCase: TestCaseType) => {
    const newCases = { ...casesByCategory };
    newCases[newCase.testCategory] = [...casesByCategory[newCase.testCategory], newCase];
    setCasesByCategory(newCases);
  };

  const addTest = (category: number) => {
    const dummyTestCase = {
      id: newTestCounter,
      sortKey: 0,
      testCategory: category,
      description: 'New Test',
      type: 'io',
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
    setNewTestCounter(newTestCounter - 1);
    addTestCase(dummyTestCase);
  };

  const changeIndex = (e: ClickParam) => {
    setCurrentCategory(e.key);
  };

  /******************************* Return  ****************************/
  let testContent;
  const thisCategory = categories.find((cat) => {
    return cat.id === parseInt(currentCategory, 10);
  });
  if (!thisCategory) {
    testContent = <div />;
  } else {
    switch (thisCategory.type) {
      case 'normal':
        const testItems = currentCategory && casesByCategory[parseInt(currentCategory, 10)] && (
          <Collapse>
            {TestCase.sort(casesByCategory[parseInt(currentCategory, 10)]).map((testCase, i) => {
              return (
                <Panel header={`${i + 1}. ${testCase.description}`} key={testCase.id}>
                  <TestItem
                    currentAssignment={props.currentAssignment}
                    testCase={testCase}
                    saveTest={saveTest}
                    files={props.solutions}
                    env={props.env}
                  />
                </Panel>
              );
            })}
          </Collapse>
        );
        testContent = (
          <Content style={{ margin: 15 }}>
            <div>{testItems}</div>
            <div style={{ marginTop: 15, display: 'flex', justifyContent: 'center' }}>
              {currentCategory && (
                <Button type="primary" onClick={addTest.bind({}, parseInt(currentCategory, 10))}>
                  Add Test
                </Button>
              )}
            </div>
          </Content>
        );
        break;
      case 'bash':
        testContent = (
          <Content style={{ margin: 15 }}>
            <ProMode
              currentCategory={thisCategory}
              solutions={props.solutions}
              helpers={props.helpers}
              submissions={props.submissions}
              replaceCategory={replaceTestCategory}
              testCases={TestCase.sort(casesByCategory[parseInt(currentCategory, 10)])}
            />
          </Content>
        );
        break;
      case 'external':
        // FIXME:
        testContent = (
          <Content style={{ margin: 15 }}>
            <div>Externally set category</div>
          </Content>
        );
        break;
    }
  }

  const exampleText = `\`\`\`
  main.sh
  files/
    #### Files from a student submission or soluton code ####
    submissionFile1
    submissionFile2
  helpers/
    #### Helper files uploaded in environment set up ####
    helperFile1
    helperFile2
  tests/
    #### Each test case below gets converted to a test file ####
    testCase1File
    testCase2File
  \`\`\``;

  return categories.length > 0 ? (
    <div>
      <Collapse>
        <Panel header="Instructions" key="1">
          Write each of your tests below, and run them on either solution code, or a student's submission. Each test
          case will be converted to a test file in the following directory structure:
          <br />
          <br />
          <ReactMarkdown source={exampleText} />
        </Panel>
      </Collapse>
      <div style={{ maxHeight: 500, overflow: 'auto', fontSize: 11 }}>
        <Layout style={{ maxHeight: 450 }}>
          <Sider theme="light">
            <Menu selectedKeys={[currentCategory]} mode="inline" onClick={changeIndex}>
              {TestCategory.sort(categories).map((category) => {
                return (
                  <Menu.Item key={category.id.toString()} style={{ height: 'fit-content', minHeight: 40 }}>
                    {category.name} {category.type === 'bash' && <Tag>Shell</Tag>}
                  </Menu.Item>
                );
              })}
              <div style={{ marginTop: 15, display: 'flex', justifyContent: 'center' }}>
                <AddCategoryModal addCategory={addCategory} />
              </div>
            </Menu>
          </Sider>
          {testContent}
        </Layout>
      </div>
    </div>
  ) : (
    <AddCategoryModal addCategory={addCategory} />
  );
};

interface IUploadProps {
  addCategory: (name: string, proMode: boolean) => Promise<void>;
}

const AddCategoryModal = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [proMode, setProMode] = useState(false);

  /******************************* API / State Change Functions ****************************/
  const onSave = async () => {
    await props.addCategory(name, proMode);
    setName('');
    setVisible(!visible);
  };

  /******************************* State Change Functions ****************************/
  const toggleVisible = () => {
    setVisible(!visible);
  };

  const onChange = (e: any) => {
    setName(e.target.value);
  };

  /******************************* Return *****************************************/
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <Button onClick={toggleVisible} type="primary" style={{ marginTop: 20 }}>
        Add Test Category
      </Button>
      <Modal visible={visible} onCancel={toggleVisible} onOk={onSave} width={400} style={{ padding: 25 }}>
        <Input onChange={onChange} value={name} placeholder="Category Name" />
        <Row>
          Category is pro mode:
          <Switch onChange={setProMode} checked={proMode} />
        </Row>
      </Modal>
    </div>
  );
};
