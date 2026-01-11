import { FC, useCallback } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { IRubricCategoryToRubricCommentsMap } from '../../../../types/common';
import { AssignmentType } from '../../../../infrastructure/assignment';
import { RubricCategoryType } from '../../../../infrastructure/rubricCategory';
import CPButton from '../../../../components/core/CPButton';

interface IProps {
  assignment: AssignmentType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  isDisabled: boolean;
}

const RubricFileDownload: FC<IProps> = ({ assignment, rubricCategories, rubricComments, isDisabled }) => {
  const getNestedRubricForDownload = useCallback(
    (categories: RubricCategoryType[], comments: IRubricCategoryToRubricCommentsMap) => {
      return categories.map((cat) => ({
        name: cat.name,
        pointLimit: cat.pointLimit,
        rubricComments: comments[cat.id].map((comment) => ({
          text: comment.text,
          pointDelta: comment.pointDelta,
          sortKey: comment.sortKey,
          explanation: comment.explanation,
          instructionText: comment.instructionText,
        })),
      }));
    },
    [],
  );

  const downloadRubric = useCallback(() => {
    const rubric = getNestedRubricForDownload(rubricCategories, rubricComments);
    const a = document.createElement('a');
    a.href = `data:text/json;charset=utf-8, ${encodeURIComponent(JSON.stringify(rubric, null, 2))}`;
    a.download = `${assignment.name}-rubric.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [assignment.name, rubricCategories, rubricComments, getNestedRubricForDownload]);

  return (
    <CPButton
      cpType="secondary"
      onClick={downloadRubric}
      disabled={isDisabled}
      icon={<DownloadOutlined />}
      fallbackIcon={<DownloadOutlined />}
      fallbackWidth={1250}
    >
      Download
    </CPButton>
  );
};

export default RubricFileDownload;
