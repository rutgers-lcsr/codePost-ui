import * as React from 'react';
import { Button, DialogContainer } from 'react-md';

import { IRubricCategory3, IRubricComment, IRubricCommentsByCategory } from '../../types/common';

interface IProps {
  activeRubricCategories: IRubricCategory3[] | undefined;
  activeRubricComments: IRubricCommentsByCategory | undefined;
  addErrorToast: (text: string, action: string | undefined) => void;
  addToast: (text: string, action: string | undefined) => void;
}

interface IDownloadCategory {
  id: number;
  name: string;
  pointLimit: number | undefined;
  assignment: number;
  rubricComments: IRubricComment[];
}

interface IState {
  dialogVisible: boolean;
}

class RubricFileDialog extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    dialogVisible: false,
  };

  public toggleDialog = () => {
    const { dialogVisible } = this.state;
    this.setState({
      dialogVisible: !dialogVisible,
    });
  };

  public createJson = () => {
    const { activeRubricCategories, activeRubricComments } = this.props;
    if (activeRubricCategories && activeRubricComments) {
      const downloadRubric: IDownloadCategory[] = [];
      activeRubricCategories.forEach((cat) => {
        const newCat: IDownloadCategory = {
          id: cat.id,
          name: cat.name,
          pointLimit: cat.pointLimit,
          rubricComments: [],
          assignment: cat.assignment,
        };
        if (activeRubricComments[cat.id]) {
          activeRubricComments[cat.id].forEach((comm) => {
            newCat.rubricComments.push(comm);
          });
        }
        downloadRubric.push(newCat);
      });
      return downloadRubric;
    }
    return;
  };

  public downloadRubric = () => {
    const rubric = this.createJson();
    const a = document.createElement('a');
    a.href = `data:attachment/json, ${JSON.stringify(rubric)}`;
    a.download = 'rubric.json';

    document.body.appendChild(a);
    a.click();
    this.props.addToast('Rubric downloaded succesfully', undefined);
  };

  public render() {
    const { dialogVisible } = this.state;
    const dialogActions = [];
    dialogActions.push({
      secondary: true,
      children: 'Cancel',
      onClick: this.toggleDialog,
    });

    return (
      <div>
        <Button raised onClick={this.toggleDialog} primary={true} flat={true}>
          Upload / Download Rubric
        </Button>
        <DialogContainer
          id="rubricFile-dialog"
          visible={dialogVisible}
          title="Manage rubric files"
          onHide={this.toggleDialog}
          actions={dialogActions}
          modal
        >
          <div>
            Download rubric as a json format:
            <Button
              key="download-rubric"
              className="Btn"
              flat={true}
              iconChildren={'cloud_download'}
              onClick={this.downloadRubric}
              primary={true}
            >
              Download JSON rubric
            </Button>
          </div>
          <div>
            Upload file to replace rubric:
            <Button key="upload-rubric" className="Btn" flat={true} iconChildren={'cloud_upload'}>
              Upload JSON rubric
            </Button>
          </div>
        </DialogContainer>
      </div>
    );
  }
}
export default RubricFileDialog;
