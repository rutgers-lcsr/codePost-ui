/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports */
import { Button, Collapse, Empty, Input, Layout, Menu, Modal } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost object imports */
import { AssignmentType } from '../../../../../../../infrastructure/assignment';
import { TestCase, TestCaseType } from '../../../../../../../infrastructure/testCase';
import { TestCategory, TestCategoryType } from '../../../../../../../infrastructure/testCategory';
import { SolutionFileType } from '../../../../../../../infrastructure/solutionFile';

/* codePost component imports */
import { TestItem } from './TestItem';

/* codePost utils imports */
import { fetchTestData, TestCasesByCategory } from '../../testUtils';

const { Panel } = Collapse;
const { Sider, Content } = Layout;

interface IProps {
  currentAssignment: AssignmentType;
  files: SolutionFileType[];
}

export const TestsList = (props: IProps) => {
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

  const addCategory = async (name: string) => {
    const payload = {
      id: -1,
      name: name,
      assignment: props.currentAssignment.id,
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
      return tc.id != oldCase.id;
    });
    const newCases = { ...casesByCategory };
    newCases[newCase.testCategory] = [...filteredTests, newCase];
    setCasesByCategory(newCases);
  };

  const addTestCase = (newCase: TestCaseType) => {
    const newCases = { ...casesByCategory };
    newCases[newCase.testCategory] = [...casesByCategory[newCase.testCategory], newCase];
    setCasesByCategory(newCases);
  };

  const addTest = (category: number) => {
    const dummyTestCase = {
      id: newTestCounter,
      name: '',
      expectedOutput: '',
      pointsPass: 0,
      pointsFail: 0,
      language: 'python',
      type: 'functional',
      text: '',
      assignment: props.currentAssignment.id,
      sortKey: 0,
      fileName: '',
      testCategory: category,
    };
    setNewTestCounter(newTestCounter - 1);
    addTestCase(dummyTestCase);
  };

  const changeIndex = (e: ClickParam) => {
    setCurrentCategory(e.key);
  };

  /******************************* Return  ****************************/
  const testItems = (currentCategory && casesByCategory[parseInt(currentCategory, 10)] && (
    <Collapse>
      {TestCase.sort(casesByCategory[parseInt(currentCategory, 10)]).map((testCase) => {
        return (
          <Panel header={testCase.name} key={testCase.id}>
            <TestItem
              currentAssignment={props.currentAssignment}
              testCase={testCase}
              saveTest={saveTest}
              files={props.files}
            />
          </Panel>
        );
      })}
    </Collapse>
  )) || <Empty />;

  return categories.length > 0 ? (
    <div>
      <Layout style={{ maxHeight: 450 }}>
        <Sider theme="light">
          {'Categories'}
          <Menu selectedKeys={[currentCategory]} mode="inline" onClick={changeIndex}>
            {TestCategory.sort(categories).map((category) => {
              return (
                <Menu.Item key={category.id.toString()} style={{ height: 'fit-content', minHeight: 40 }}>
                  {category.name}
                </Menu.Item>
              );
            })}
            <div>
              <AddCategoryModal addCategory={addCategory} />
            </div>
          </Menu>
        </Sider>
        <Content style={{ maxHeight: '70vh', overflow: 'auto', fontSize: 12 }}>
          <div>{testItems}</div>
          {currentCategory && <Button onClick={addTest.bind({}, parseInt(currentCategory, 10))}>Add Test</Button>}
        </Content>
      </Layout>
    </div>
  ) : (
    <AddCategoryModal addCategory={addCategory} />
  );
};

interface IUploadProps {
  addCategory: (name: string) => Promise<void>;
}

const AddCategoryModal = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');

  /******************************* API / State Change Functions ****************************/
  const onSave = async () => {
    await props.addCategory(name);
    setName('');
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
      <Button onClick={toggleVisible} style={{ marginTop: 20 }}>
        Add Test Category
      </Button>
      <Modal visible={visible} onCancel={toggleVisible} footer={null} width={750}>
        <Input onChange={onChange} value={name} placeholder="Category Name" />
        <Button onClick={onSave} type="primary" style={{ marginTop: 20 }}>
          Save
        </Button>
      </Modal>
    </div>
  );
};
