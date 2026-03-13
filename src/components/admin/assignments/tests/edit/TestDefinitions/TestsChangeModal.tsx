// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useEffect, useState } from 'react';

/* library imports */
import { Button, Divider, Modal, Spin, Steps, Table, Tag } from 'antd';
import _ from 'lodash';

/* codePost object imports */
import { TestCaseType, TestCategoryType } from '../../../../../../types/models';
import { IBasicFile } from './../TestDefinitions';

/* codePost interface imports */
import { TestCasesByCategory } from '../../../../../core/testFetchUtils';

interface IProps {
  // files
  // files
  currentFile: IBasicFile;
  currentFileCode: string;

  // tests
  casesByCategory: TestCasesByCategory;
  categories: TestCategoryType[];
  addCategory: (name: string) => Promise<TestCategoryType>;
  deleteCategory: (id: number) => Promise<void>;
  addTest: (language: string | null, category: number, sourceFile?: boolean, name?: string) => Promise<void>;
  deleteTest: (testCase: TestCaseType) => Promise<void>;

  // misc
  checkChanges: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// Misc interfaces to help with handling diff storage
interface ICaseNamesByCategoryName {
  [categoryName: string]: Set<string>;
}

interface ICasesByCategoryName {
  [categoryName: string]: TestCaseType[];
}

enum STATUS {
  PARSING = 0,
  CONFIRM = 1,
  SUCCESS = 2,
}

export const TestsChangeModal = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [categoriesToAdd, setCategoriesToAdd] = useState<ICaseNamesByCategoryName>({});
  const [categoriesToDelete, setCategoriesToDelete] = useState<ICaseNamesByCategoryName>({});
  const [testsToAdd, setTestsToAdd] = useState<ICaseNamesByCategoryName>({});
  const [testsToDelete, setTestsToDelete] = useState<ICasesByCategoryName>({});
  const [status, setStatus] = useState<STATUS>(STATUS.PARSING);
  const [visible, setVisible] = useState(false);

  const checkForErrors = (currentCode: string) => {
    const errors: { lineNumber: number; log: string }[] = [];
    const re = /^([^#]*\s)*TestOutput(?!([ ]{1,}"([^"]+?)"[ ]{1,}"([^"]+?)"[ ]{1,}(true|false)( "([^"]*?)")?)).*/g;
    const lines = currentCode.split('\n');

    lines.forEach((l, i) => {
      const t = l.match(re);
      if (t) {
        errors.push({ lineNumber: i, log: t.toString() });
      }
    });

    return errors;
  };

  // ********************* GET DIFF BETWEEN FILES ******************************
  const parseTests = (currentCode: string) => {
    const parsedTests: { [categoryName: string]: Set<string> } = {};
    const re = /TestOutput[ ]{1,}"([^"]+?)"[ ]{1,}"([^"]+?)"[ ]{1,}(true|false)([ ]{1,}"([^"]*?)")?/g;

    const tests = currentCode.match(re);

    if (tests) {
      tests.forEach((t) => {
        // Syntax for the regex match is <TestOutput> <category> <test> <boolean> <log>
        const [, category, test, ,] = t.split(/(?:"[ ]{1,}|[ ]{1,}")+/);

        const categoryName = category.replace(/"/g, '');
        const testestName = test.replace(/"/g, '');

        if (categoryName in parsedTests) {
          parsedTests[categoryName].add(testestName);
        } else {
          parsedTests[categoryName] = new Set<string>([testestName]);
        }
      });
    }
    return parsedTests;
  };

  const compareDiff = (parsedTests: { [categoryName: string]: Set<string> }, casesByCategory: TestCasesByCategory) => {
    // 1. Pre-process data to make comparison faster
    //    a) We get categories by id for fast lookup
    //    b) We get test cases by name by category name. That way we can find the
    //       testcase obj corresponding to a (categoryName, testCaseName) in O(1)
    const categoriesByID: { [categoryID: number]: TestCategoryType } = props.categories.reduce(
      (acc: { [categoryID: number]: TestCategoryType }, val) => {
        acc[val.id] = val;
        return acc;
      },
      {},
    );

    const casesByCategoryName: { [categoryName: string]: { [testCaseName: string]: TestCaseType } } = {};
    Object.keys(props.casesByCategory).forEach((cat) => {
      const cases = casesByCategory[parseInt(cat, 10)];
      const categoryName = categoriesByID[parseInt(cat, 10)].name;
      cases.forEach((c) => {
        // We want to ignore any non file-defined tests in the comparison
        if (c.type === 'file') {
          if (categoryName in casesByCategoryName) {
            casesByCategoryName[categoryName][c.description] = c;
          } else {
            casesByCategoryName[categoryName] = { [c.description]: c };
          }
        } else {
          // Even if the category doesn't have file tests, we still want to include the category so
          // we don't end up creating duplicates
          if (!(categoryName in casesByCategoryName)) {
            casesByCategoryName[categoryName] = {};
          }
        }
      });
    });

    // 2. Create result data structures
    const categsToAdd: ICaseNamesByCategoryName = {};
    const categsToDelete: ICaseNamesByCategoryName = {};
    const casesToAdd: ICaseNamesByCategoryName = {};
    const casesToDelete: ICasesByCategoryName = {};

    // 3. Go through new data structure and find diffs to add
    // For clarity on names vs. objects, we adopt the following:
    Object.keys(parsedTests).forEach((categName) => {
      // Check for new categories
      if (!(categName in casesByCategoryName)) {
        categsToAdd[categName] = new Set(parsedTests[categName]);
        return;
      }

      // Check for new tests in existing categories
      parsedTests[categName].forEach((testName) => {
        if (!(testName in casesByCategoryName[categName])) {
          if (categName in casesToAdd) {
            casesToAdd[categName].add(testName);
          } else {
            casesToAdd[categName] = new Set([testName]);
          }
        }
      });
    });

    // 4. Go through old data structure and find diffs to delete
    Object.keys(casesByCategoryName).forEach((categName) => {
      // Check for deleted categories
      if (!(categName in parsedTests)) {
        // check to see if the category contains test cases that aren't file defined
        let canDelete = true;
        const thisCategory = props.categories.find((c) => c.name === categName);
        if (thisCategory && props.casesByCategory[thisCategory.id] !== undefined) {
          const thisCategoryCases = props.casesByCategory[thisCategory.id];
          // If the category has no cases then it can't be file defined
          if (thisCategoryCases.length === 0) canDelete = false;
          // If any of the cases aren't file defined, set canDelete to false
          thisCategoryCases.forEach((c) => c.type !== 'file' && (canDelete = false));
        }

        if (canDelete) {
          // We store the test names as well to display in the confirmation modal
          categsToDelete[categName] = new Set(Object.keys(casesByCategoryName[categName]));
          // We don't need to loop through the test cases if the category is to be deleted, so we return
          return;
        }
      }

      // Check for deleted tests in existing categories
      Object.keys(casesByCategoryName[categName]).forEach((testName) => {
        if (!(categName in parsedTests) || !parsedTests[categName].has(testName)) {
          const test = { ...casesByCategoryName[categName][testName] };
          if (categName in casesToDelete) {
            casesToDelete[categName].push(test);
          } else {
            casesToDelete[categName] = [test];
          }
        }
      });
    });

    return [categsToAdd, categsToDelete, casesToAdd, casesToDelete];
  };

  /******************************* State Variables ****************************/
  useEffect(() => {
    if (props.checkChanges) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- triggered by parent via boolean prop
      setStatus(STATUS.PARSING);
      const errors = checkForErrors(props.currentFileCode);
      if (errors.length > 0) {
        props.onCancel();
        Modal.error({
          width: 550,
          title: 'TestOutput syntax errors',
          content: (
            <div>
              {errors.map((error) => {
                return (
                  <div>
                    Line {error.lineNumber}: {error.log}
                  </div>
                );
              })}
              <Divider />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 10 }}> Correct syntax examples:</div>
                <div style={{ fontWeight: 500, fontStyle: 'italic' }}>
                  <div>TestOutput "Category 1" "Test 1" true "Great job!"</div>
                  <div>TestOutput "Style" "Checking for header" false "This is incorrect."</div>
                  <div>TestOutput "Algorithms" "O(N) test" true</div>
                </div>
              </div>
            </div>
          ),
        });
      } else {
        // No errors
        const parsedTests = parseTests(props.currentFileCode);
        const [newCategories, deletedCategories, newTests, deletedTests]: any = compareDiff(
          parsedTests,
          props.casesByCategory,
        );
        setCategoriesToAdd(newCategories);
        setCategoriesToDelete(deletedCategories);
        setTestsToAdd(newTests);
        setTestsToDelete(deletedTests);
        if (
          _.isEmpty(newCategories) &&
          _.isEmpty(deletedCategories) &&
          _.isEmpty(newTests) &&
          _.isEmpty(deletedTests)
        ) {
          props.onConfirm();
          props.onCancel();
        } else {
          setVisible(true);
          setStatus(STATUS.CONFIRM);
        }
      }
    }
  }, [props.checkChanges]);

  // ********************* API Chamges ******************************

  const onConfirm = async () => {
    const categoriesByName: { [categoryName: string]: TestCategoryType } = props.categories.reduce(
      (acc: { [categoryName: string]: TestCategoryType }, val) => {
        acc[val.name] = val;
        return acc;
      },
      {},
    );
    createCategories();
    deleteCategories(categoriesByName);
    createTests(categoriesByName);
    deleteTests(categoriesByName);
    props.onConfirm();
    setStatus(STATUS.SUCCESS);
  };

  const createCategories = () => {
    Object.keys(categoriesToAdd).forEach(async (catestName) => {
      const newCat = await props.addCategory(catestName);
      categoriesToAdd[catestName].forEach((testestName) => {
        props.addTest(null, newCat.id, true, testestName);
      });
    });
  };

  const deleteCategories = (categoriesByName: { [categoryName: string]: TestCategoryType }) => {
    Object.keys(categoriesToDelete).forEach((catestName) => {
      const catID = categoriesByName[catestName].id;
      props.deleteCategory(catID);
    });
  };

  const createTests = (categoriesByName: { [categoryName: string]: TestCategoryType }) => {
    Object.keys(testsToAdd).forEach((catestName) => {
      const catID = categoriesByName[catestName].id;
      testsToAdd[catestName].forEach((testestName) => {
        props.addTest(null, catID, true, testestName);
      });
    });
  };

  const deleteTests = (_categoriesByName: { [categoryName: string]: TestCategoryType }) => {
    Object.keys(testsToDelete).forEach((catestName) => {
      testsToDelete[catestName].forEach((test) => {
        props.deleteTest(test);
      });
    });
  };

  const onCancel = () => {
    setVisible(false);
    props.onCancel();
  };

  // ********************* GET DIFF BETWEEN FILES ******************************

  const steps = [
    {
      title: 'Check for Changes',
    },
    {
      title: 'Confirm Changes',
    },
    {
      title: 'Done!',
    },
  ];

  // Helper function to create table data for categories
  const createCategoryRows = (categories: ICaseNamesByCategoryName, changeType: 'ADDED' | 'DELETED') => {
    const color = changeType === 'ADDED' ? 'green' : 'volcano';
    return Object.keys(categories).map((name) => ({
      name,
      change: <Tag color={color}>{changeType}</Tag>,
    }));
  };

  // Helper function to create table data for test cases
  const createCaseRows = (
    data: ICaseNamesByCategoryName | ICasesByCategoryName,
    category: string,
    changeType: 'ADDED' | 'DELETED',
    isTestCase: boolean = false,
  ) => {
    const color = changeType === 'ADDED' ? 'green' : 'volcano';
    const items = data[category];

    if (items instanceof Set) {
      return Array.from(items).map((item: string) => ({
        name: item,
        category,
        change: <Tag color={color}>{changeType}</Tag>,
      }));
    } else if (Array.isArray(items)) {
      return items.map((item: TestCaseType) => ({
        name: isTestCase ? item.description : item,
        category,
        change: <Tag color={color}>{changeType}</Tag>,
      }));
    }
    return [];
  };

  // Render content based on status
  const renderContent = () => {
    switch (status) {
      case STATUS.PARSING:
        return (
          <div>
            <Spin />
            Just a moment, we're parsing your changes...
          </div>
        );

      case STATUS.CONFIRM: {
        const categoryColumns = [
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Change', dataIndex: 'change', key: 'change' },
        ];

        const caseColumns = [
          { title: 'Category', dataIndex: 'category', key: 'category' },
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Change', dataIndex: 'change', key: 'change' },
        ];

        const changedCategoryRows = [
          ...createCategoryRows(categoriesToAdd, 'ADDED'),
          ...createCategoryRows(categoriesToDelete, 'DELETED'),
        ];

        const changedCaseRows = [
          ...Object.keys(categoriesToAdd).flatMap((c) => createCaseRows(categoriesToAdd, c, 'ADDED')),
          ...Object.keys(testsToAdd).flatMap((c) => createCaseRows(testsToAdd, c, 'ADDED')),
          ...Object.keys(categoriesToDelete).flatMap((c) => createCaseRows(categoriesToDelete, c, 'DELETED')),
          ...Object.keys(testsToDelete).flatMap((c) => createCaseRows(testsToDelete, c, 'DELETED', true)),
        ];

        return (
          <div>
            <Divider>Changed Test Categories</Divider>
            <Table size="small" style={{ lineHeight: 1 }} columns={categoryColumns} dataSource={changedCategoryRows} />
            <Divider>Changed Test Cases</Divider>
            <Table size="small" style={{ lineHeight: 1 }} columns={caseColumns} dataSource={changedCaseRows} />
          </div>
        );
      }

      case STATUS.SUCCESS:
        return <div>Success!</div>;

      default:
        return null;
    }
  };

  // Render footer based on status
  const renderFooter = () => {
    switch (status) {
      case STATUS.PARSING:
        return [];

      case STATUS.CONFIRM:
        return [
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button key="ok" onClick={onConfirm} type="primary">
            Ok
          </Button>,
        ];

      case STATUS.SUCCESS:
        return [
          <Button key="done" onClick={onCancel} type="primary">
            Done
          </Button>,
        ];

      default:
        return [];
    }
  };

  const content = renderContent();
  const footer = renderFooter();

  return (
    <div>
      <Modal
        open={visible}
        title={`Save test changes`}
        onCancel={onCancel}
        width={700}
        destroyOnHidden={true}
        footer={footer}
      >
        <Steps
          size="small"
          current={status}
          items={steps.map((item) => ({
            key: item.title,
            title: item.title,
          }))}
        />
        {content}
      </Modal>
    </div>
  );
};
