/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports  */
import { Button, Spin } from 'antd';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/* codePost object imports  */
import {
  Environment,
  EnvironmentType,
  TestsSourceType,
  TestTemplateType,
} from '../../../../../../../infrastructure/autograder/environment';
import { SolutionFileType } from '../../../../../../../infrastructure/autograder/solutionFile';
import { FileType } from '../../../../../../../infrastructure/file';
import { HelperFileType } from '../../../../../../../infrastructure/autograder/helperFile';
import { SubmissionType } from '../../../../../../../infrastructure/submission';

/* codePost other imports  */
import { SubmissionPicker } from '../utils/SubmissionPicker';
import { CodeIDE } from './CodeIDE';

interface ViewSourceProps {
  env: EnvironmentType;
  solutions: SolutionFileType[];
  helpers: HelperFileType[];
  submissions: SubmissionType[];
}

// FIXME: This component shares the same basic structure as ProMode.
// Abstract out the menu codeviewer + code switcher into a base component
export const ViewSource = (props: ViewSourceProps) => {
  /******************************** State variables ****************************/
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<TestTemplateType[]>([]);
  const [main, setMain] = useState('');
  const [currentFiles, setCurrentFiles] = useState<(SolutionFileType | FileType)[]>(props.solutions);

  /******************************** Set up ****************************/
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const source: TestsSourceType = await Environment.eject(props.env.id);
      setMain(source.main);
      setTests(source.templates);
      setLoading(false);
    };
    fetchData();
  }, [props.env.id]);

  /******************************** Utils ****************************/
  // FIXME: Turn zipping of a directory into a generic helper function
  const download = () => {
    const zip = new JSZip();
    zip.file('main.sh', main);
    let dir = zip.folder('tests');
    tests.map((test) => {
      dir.file(`Test${test.id}${test.extension}`, test.code);
    });
    dir = zip.folder('files');
    currentFiles.map((file) => {
      dir.file(file.name, file.code);
    });
    props.helpers.map((file) => {
      dir.file(file.name, file.code);
    });

    zip.generateAsync({ type: 'blob' }).then(function(content: any) {
      saveAs(content, `test-directory.zip`);
    });
  };

  /******************************** Return helpers ****************************/
  const bashGroup = {
    files: [{ name: 'main.sh', code: main, canSave: false }],
    isDisabled: false,
  };

  const helperFiles = props.helpers.map((file) => {
    return { title: <div>{file.name} (Helper)</div>, name: file.name, code: file.code, canSave: false };
  });

  const submissionFiles = currentFiles.map((file) => {
    return { name: file.name, code: file.code, canSave: false };
  });

  const fileGroup = {
    subMenuTitle: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        files
        <SubmissionPicker solutionFiles={props.solutions} submissions={props.submissions} setFiles={setCurrentFiles} />
      </div>
    ),
    files: [...helperFiles, ...submissionFiles],
    isDisabled: true,
  };

  const templateGroup = {
    subMenuTitle: <div>tests</div>,
    files: tests.map((test) => {
      return { code: test.code, name: `Test${test.id}${test.extension}`, canSave: false };
    }),
    isDisabled: false,
  };

  /************************** Return  ****************************/
  if (loading) {
    return <Spin />;
  }
  return (
    <div>
      <Button onClick={download} style={{ float: 'right', marginBottom: 10 }} type="primary" icon="download">
        Download
      </Button>
      <CodeIDE groups={[bashGroup, fileGroup, templateGroup]} />
    </div>
  );
};
