// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { FC, useState, useCallback } from 'react';
import { UploadOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Collapse, Modal, Spin, Steps, Typography, Upload } from 'antd';
import ReactMarkdown from 'react-markdown';
import { IRubricCategoryToRubricCommentsMap, Assignment } from '../../../../types/common';
import { RubricCategory, RubricComment } from '../../../../api-client';
import CPButton from '../../../../components/core/CPButton';

interface IProps {
  assignment: Assignment;
  rubricCategories: RubricCategory[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  onRubricUpload: (categories: RubricCategory[], comments: IRubricCategoryToRubricCommentsMap) => void;
  isDisabled: boolean;
}

interface IDownloadCategory {
  name: string;
  pointLimit: number;
  helpText: string;
  rubricComments: IDownloadComment[];
}

interface IDownloadComment {
  text: string;
  pointDelta: number;
  sortKey?: number;
  explanation?: string;
  instructionText?: string;
}

enum STATUS {
  CLOSED,
  OPEN,
  FILE_UPLOADED,
  LOADING,
  UPLOAD_ERRORS,
}

const RubricFileUpload: FC<IProps> = ({
  assignment,
  rubricCategories,
  rubricComments: _rubricComments,
  onRubricUpload,
  isDisabled,
}) => {
  const [status, setStatus] = useState<STATUS>(STATUS.CLOSED);
  const [newCategories, setNewCategories] = useState<RubricCategory[]>([]);
  const [newComments, setNewComments] = useState<IRubricCategoryToRubricCommentsMap>({});
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadFileName, setUploadFileName] = useState('');

  const toggleStatus = useCallback(() => {
    setStatus((prev) => (prev === STATUS.CLOSED ? STATUS.OPEN : STATUS.CLOSED));
  }, []);

  const goBack = useCallback(() => {
    setNewCategories([]);
    setNewComments({});
    setUploadErrors([]);
    setUploadFileName('');
    setStatus(STATUS.OPEN);
  }, []);

  const parseRubric = useCallback(
    (rubric: IDownloadCategory[]) => {
      const categories: RubricCategory[] = [];
      const comments: any = {};

      let categoryID = -1;
      let commentID = -1;
      rubric.forEach((newCategory: IDownloadCategory, index: number) => {
        const commentList: RubricComment[] = [];
        const categoryPayload = {
          id: categoryID,
          name: newCategory.name,
          rubricComments: [],
          assignment: assignment.id,
          pointLimit: newCategory.pointLimit,
          sortKey: index,
          helpText: newCategory.helpText,
          atMostOnce: false,
        } as unknown as RubricCategory;

        (newCategory.rubricComments || []).forEach((newComment: IDownloadComment, indexComment: number) => {
          let sortKey = indexComment;
          if (newComment.sortKey !== undefined) {
            sortKey = newComment.sortKey;
          }

          const explanation = newComment.explanation || '';
          const instructionText = newComment.instructionText || '';

          commentList.push({
            id: commentID,
            text: newComment.text,
            pointDelta: newComment.pointDelta,
            category: categoryPayload.id,
            sortKey,
            explanation,
            instructionText,
            templateTextOn: false,
          } as unknown as RubricComment);
          commentID = commentID - 1;
        });

        comments[categoryPayload.id] = commentList;
        categories.push(categoryPayload);

        categoryID = categoryID - 1;
      });

      return {
        rubricCategories: categories,
        rubricComments: comments,
      };
    },
    [assignment.id],
  );

  const isRubric = useCallback((rubric: IDownloadCategory[]) => {
    const errors: string[] = [];
    if (rubric && Array.isArray(rubric)) {
      rubric.forEach((cat) => {
        if (typeof cat.name !== 'string') {
          errors.push(`Name field of ${cat.name || 'category'} must be a string`);
        }
        let numDuplicateName = 0;
        rubric.forEach((cat2) => {
          if (cat2.name === cat.name) {
            numDuplicateName += 1;
          }
        });
        if (numDuplicateName > 1) {
          errors.push(`Multiple categories with the same name (${cat.name})`);
        }
        if (cat.rubricComments && Array.isArray(cat.rubricComments)) {
          cat.rubricComments.forEach((comm) => {
            if (typeof comm.text !== 'string') {
              errors.push('Make sure every comment text field contains a string');
            }
            if (typeof comm.pointDelta !== 'number') {
              errors.push('Make sure every comment pointDelta field contains a number');
            }
          });
        }
      });
      return errors;
    }
    errors.push('Uploaded JSON object is empty or invalid.');
    return errors;
  }, []);

  const handleRubricUpload = useCallback(
    (file: File, result: string) => {
      setStatus(STATUS.LOADING);
      try {
        const rubric = JSON.parse(result);
        const errors = isRubric(rubric);

        if (errors.length === 0) {
          const formatted = parseRubric(rubric);
          setNewCategories(formatted.rubricCategories);
          setNewComments(formatted.rubricComments);
          setUploadFileName(file.name);
          setStatus(STATUS.FILE_UPLOADED);
        } else {
          setUploadErrors(errors);
          setUploadFileName(file.name);
          setStatus(STATUS.UPLOAD_ERRORS);
        }
      } catch (error) {
        setUploadErrors(["The rubric you uploaded isn't a valid JSON object."]);
        setUploadFileName(file.name);
        setStatus(STATUS.UPLOAD_ERRORS);
      }
    },
    [isRubric, parseRubric],
  );

  const saveRubric = useCallback(() => {
    setStatus(STATUS.LOADING);
    onRubricUpload(newCategories, newComments);
    toggleStatus();
  }, [onRubricUpload, newCategories, newComments, toggleStatus]);

  const beforeUpload = useCallback(
    (file: any) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const resultStr = typeof reader.result === 'string' ? reader.result : '';
          handleRubricUpload(file, resultStr);
        }
      };
      reader.readAsText(file);
      return false;
    },
    [handleRubricUpload],
  );

  const stepsList = ['Upload', 'Review'];
  let currentStep;
  switch (status) {
    case STATUS.CLOSED:
    case STATUS.OPEN:
      currentStep = 0;
      break;
    case STATUS.UPLOAD_ERRORS:
    case STATUS.FILE_UPLOADED:
      currentStep = 1;
      break;
    default:
      currentStep = 0;
  }

  const exampleText = `    [
        {
          "name" : "Category 1 name",
          "pointLimit" : 2,
          "rubricComments" : [{ 
            "text" : "this is a new comment",
            "pointDelta" : 0,
            "sortKey" : 0,
            "explanation" : "",
            "instructionText" : "",
          }],
        }
        ...
      ]`;

  let content;
  let footer;

  switch (status) {
    case STATUS.LOADING:
      content = <Spin />;
      break;
    case STATUS.OPEN:
      content = (
        <div>
          <div>
            <div>
              Upload a rubric encoded in <Typography.Text code>.json</Typography.Text> format. This will replace any
              existing rubric in place for this assignment.
            </div>
            <br />
            <Collapse
              defaultActiveKey={['json']}
              items={[
                {
                  key: 'json',
                  label: 'Required JSON format',
                  children: (
                    <>
                      <WarningOutlined /> One common mistake: don&apos;t use trailing commas (e.g.{' '}
                      <Typography.Text code>[el1, el2,]</Typography.Text> should be{' '}
                      <Typography.Text code>[el1, el2]</Typography.Text>) <br /> <br />
                      <ReactMarkdown>{exampleText}</ReactMarkdown>
                    </>
                  ),
                },
              ]}
            />
            <br />
            <br />
            <Upload beforeUpload={beforeUpload} listType="text" multiple={true}>
              <Button>
                <UploadOutlined /> Upload
              </Button>
            </Upload>
          </div>
        </div>
      );
      footer = [
        <Button key="cancel" onClick={toggleStatus}>
          Cancel
        </Button>,
      ];
      break;
    case STATUS.UPLOAD_ERRORS:
      content = uploadErrors.map((error, index) => (
        <div key={index}>
          <div className="uploadErrorText">{error}</div>
          <br />
        </div>
      ));
      footer = [
        <Button key="back" onClick={goBack}>
          Go back
        </Button>,
      ];
      break;
    case STATUS.FILE_UPLOADED: {
      const isReplacement = rubricCategories.length > 0;
      content = (
        <div>
          <div>
            Uploaded file: <Typography.Text code>{uploadFileName}</Typography.Text>
          </div>
          <br />
          <br />
          {isReplacement ? (
            <div>
              <Typography.Text type="warning">Warning: </Typography.Text> Continuing will overwrite your existing
              rubric.
            </div>
          ) : null}
        </div>
      );
      footer = [
        <Button key="back" onClick={goBack}>
          Go back
        </Button>,
        <Button key="continue" onClick={saveRubric} type={isReplacement ? undefined : 'primary'}>
          {isReplacement ? 'Overwrite' : 'Save'}
        </Button>,
      ];
      break;
    }
  }

  return (
    <div className="admin-rubric__FileDialog">
      <CPButton
        cpType="secondary"
        onClick={toggleStatus}
        disabled={isDisabled}
        icon={<UploadOutlined />}
        fallbackIcon={<UploadOutlined />}
        fallbackWidth={1250}
      >
        Upload
      </CPButton>

      <Modal
        open={status !== STATUS.CLOSED}
        title="Rubric File Upload"
        onCancel={toggleStatus}
        onOk={saveRubric}
        width={600}
        footer={footer}
      >
        <Steps
          size="small"
          current={currentStep}
          items={stepsList.map((item) => ({
            key: item,
            title: item,
          }))}
        />
        <br />
        {content}
      </Modal>
    </div>
  );
};

export default RubricFileUpload;
