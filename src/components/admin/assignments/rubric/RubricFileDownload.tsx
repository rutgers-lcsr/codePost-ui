/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { DownloadOutlined } from '@ant-design/icons';

/* codePost imports */
import { IRubricCategoryToRubricCommentsMap } from '../../../../types/common';

import { AssignmentType } from '../../../../infrastructure/assignment';
import { RubricCategoryType } from '../../../../infrastructure/rubricCategory';

import CPButton from '../../../../components/core/CPButton';

/**********************************************************************************************************************/

interface IProps {
  /* data */
  assignment: AssignmentType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;

  /* UI controllers */
  isDisabled: boolean;
}

/**********************************************************************************************************************/

class RubricFileDownload extends React.Component<IProps> {
  // create a nested rubric object from existing rubric for download purposes
  public getNestedRubricForDownload = (
    rubricCategories: RubricCategoryType[],
    rubricComments: IRubricCategoryToRubricCommentsMap,
  ) => {
    return rubricCategories.map((cat) => {
      return {
        name: cat.name,
        pointLimit: cat.pointLimit,
        rubricComments: rubricComments[cat.id].map((comment) => {
          return {
            text: comment.text,
            pointDelta: comment.pointDelta,
            sortKey: comment.sortKey,
            explanation: comment.explanation,
            instructionText: comment.instructionText,
          };
        }),
      };
    });
  };

  // Function called upon downloading
  public downloadRubric = () => {
    const { rubricCategories, rubricComments } = this.props;
    const rubric = this.getNestedRubricForDownload(rubricCategories, rubricComments);

    // Execute download
    const a = document.createElement('a');
    // pretty-print JSON so download is more human-readable
    a.href = `data:text/json;charset=utf-8, ${encodeURIComponent(JSON.stringify(rubric, null, 2))}`;
    a.download = `${this.props.assignment.name}-rubric.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  public render() {
    return (
      <CPButton
        cpType="secondary"
        onClick={this.downloadRubric}
        disabled={this.props.isDisabled}
        icon={<DownloadOutlined />}
        fallbackIcon={<DownloadOutlined />}
        fallbackWidth={1250}
      >
        Download
      </CPButton>
    );
  }
}
export default RubricFileDownload;
