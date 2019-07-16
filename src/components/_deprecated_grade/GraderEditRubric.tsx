import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  Drawer,
  FontIcon,
  TableBody,
  TableColumn,
  TableRow,
  TextField,
  Toolbar,
} from 'react-md';
import Select from 'react-select';

import { IRubricCategoryToRubricCommentsMap } from '../../types/common';

import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../infrastructure/rubricComment';

interface IGraderEditRubricProps {
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  refreshRubric: () => void;
  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
}

interface IGraderEditRubricState {
  drawerVisible: boolean;
  newCommentCategory: RubricCategoryType | null;
  newComment: RubricCommentType | null;
  isLoading: boolean;
}

class GraderEditRubric extends React.Component<IGraderEditRubricProps, IGraderEditRubricState> {
  public state: Readonly<IGraderEditRubricState> = {
    drawerVisible: false,
    newCommentCategory: null,
    newComment: null,
    isLoading: false,
  };

  public openEditDrawer = () => {
    this.setState({
      newComment: null,
      newCommentCategory: null,
      drawerVisible: true,
      isLoading: false,
    });
  };

  public closeEditDrawer = () => {
    this.setState({
      newComment: null,
      newCommentCategory: null,
      drawerVisible: false,
      isLoading: false,
    });
  };

  public handleVisibility = (visible: boolean) => {
    this.setState({ drawerVisible: visible });
  };

  public buildCategoryOptions = (rubricCategories: RubricCategoryType[]) => {
    return rubricCategories.map((rubricCategory: RubricCategoryType) => {
      return { value: rubricCategory.id, label: rubricCategory.name, category: { ...rubricCategory } };
    });
  };

  public changeSelectedComment = (rubricComment?: RubricCommentType) => {
    if (rubricComment) {
      const category = this.props.rubricCategories.find((rubricCategory: RubricCategoryType) => {
        return rubricCategory.id === rubricComment.category;
      });
      if (!category) {
        this.setState({ newComment: null, newCommentCategory: null });
      } else {
        this.setState({ newComment: rubricComment, newCommentCategory: category });
      }
    } else {
      this.setState({ newComment: null, newCommentCategory: null });
    }
  };

  public onChangeCategory = (selected: any) => {
    if (selected) {
      const newComment = { ...this.state.newComment, category: selected.category.id } as RubricCommentType;
      this.setState({ newCommentCategory: selected.category, newComment });
    }
  };

  public goBack = () => {
    this.setState({ newComment: null, newCommentCategory: null });
  };

  public addNewComment = () => {
    const newComment: RubricCommentType = {
      id: -1,
      category: -1,
      pointDelta: 0,
      text: '',
      sortKey: 0,
      comments: [],
    };
    this.setState({ newComment });
  };

  public saveComment = () => {
    if (!this.state.newComment) {
      return;
    }

    if (this.state.newComment.category < 0) {
      this.props.addErrorToast('The rubric comment must include a category.', undefined);
      return;
    }

    if (this.state.newComment.text.length === 0) {
      this.props.addErrorToast('Rubric comment text may not be blank.', undefined);
      return;
    }

    this.setState({ isLoading: true });
    if (this.state.newComment.id < 0) {
      RubricComment.create(this.state.newComment)
        .then((result: RubricComment) => {
          this.props.addToast('Successfully created new rubric comment.', undefined);
          this.props.refreshRubric();
          this.closeEditDrawer();
        })
        .catch((errors) => {
          Object.keys(errors).forEach((key) => {
            errors[key].forEach((error: string) => {
              this.props.addErrorToast(`[${key}] ${error}`, undefined);
              this.closeEditDrawer();
            });
          });
        });
    } else {
      RubricComment.update(this.state.newComment)
        .then((result: RubricComment) => {
          this.props.addToast('Successfully updated rubric comment.', undefined);
          this.props.refreshRubric();
          this.closeEditDrawer();
        })
        .catch((errors) => {
          Object.keys(errors).forEach((key) => {
            errors[key].forEach((error: string) => {
              this.props.addErrorToast(`[${key}] ${error}`, undefined);
              this.closeEditDrawer();
            });
          });
        });
    }
    return;
  };

  public deleteComment = () => {
    if (!this.state.newComment) {
      return;
    }

    if (this.state.newComment.id < 0) {
      return;
    }

    this.setState({ isLoading: true });

    RubricComment.delete(this.state.newComment.id)
      .then(() => {
        this.props.addToast('Successfully deleted rubric comment.', undefined);
        this.props.refreshRubric();
        this.closeEditDrawer();
      })
      .catch((errors) => {
        this.props.addErrorToast(
          'Something went wrong. The rubric comment is probably already linked to student submissions.',
          undefined,
        );
        this.props.refreshRubric();
        this.closeEditDrawer();
      });
  };

  public updateNewCommentText = (text: string) => {
    const newComment = { ...this.state.newComment, text } as RubricCommentType;
    this.setState({ newComment });
  };

  public updateNewCommentPoints = (pointDelta: number) => {
    const newComment = { ...this.state.newComment, pointDelta } as RubricCommentType;
    this.setState({ newComment });
  };

  public render() {
    const categoryOptions = this.buildCategoryOptions(this.props.rubricCategories);

    let currentCategoryOption = null;
    if (this.state.newCommentCategory) {
      currentCategoryOption = categoryOptions.find((option: any) => {
        return this.state.newCommentCategory!.id === option.value;
      });
    }

    const closeBtn = (
      <Button onClick={this.closeEditDrawer} icon>
        {'close'}
      </Button>
    );

    const backBtn = (
      <Button onClick={this.goBack} icon>
        {'arrow_back'}
      </Button>
    );

    let actions: any = [];
    let content = <div />;
    if (this.state.isLoading) {
      content = <CircularProgress id="progress" />;
    } else if (this.state.newComment === null) {
      actions = [closeBtn];
      content = (
        <div style={{ height: 'calc(100% - 120px)', padding: '8px' }}>
          <div onClick={this.addNewComment} className="button--add-a-rubric-comment">
            Add a rubric comment
          </div>
          <div style={{ margin: 'auto', textAlign: 'center', padding: '5px' }}>—OR—</div>
          <div style={{ margin: 'auto', textAlign: 'center', padding: '5px' }}>
            Select an existing rubric comment below
          </div>
          <hr />
          <div
            style={{
              margin: '8px -8px 8px -8px',
              textAlign: 'center',
              padding: '12px 0px',
              backgroundColor: '#f2f2f2',
            }}
          >
            Rubric comments that have been linked to submissions are not editable. Ask an Admin to help.
          </div>
          <div style={{ height: 'calc(100% - 260px', overflowY: 'auto' }}>
            {this.props.rubricCategories.map((rubricCategory: RubricCategoryType) => {
              return (
                <RubricCategoryBlock
                  key={`category-block-${rubricCategory.id}`}
                  rubricCategory={rubricCategory}
                  rubricComments={this.props.rubricComments[rubricCategory.id]}
                  changeSelectedComment={this.changeSelectedComment}
                />
              );
            })}
          </div>
        </div>
      );
    } else {
      actions = [backBtn, closeBtn];
      content = (
        <div>
          <div
            style={{
              backgroundColor: '#f2f2f2',
              padding: '60px 50px 20px 20px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#333333' }}>Category</div>
            <Select options={categoryOptions} value={currentCategoryOption} onChange={this.onChangeCategory} />
            <TextField
              value={this.state.newComment ? this.state.newComment.pointDelta : 0}
              label={'Comment points'}
              onChange={this.updateNewCommentPoints}
              step={0.5}
              pattern="^d+(\.|\,)\d{1}"
              min={0}
              type="number"
              style={{ width: '50%', marginTop: '30px' }}
            />
            <TextField
              label={'Comment text'}
              value={this.state.newComment ? this.state.newComment.text : ''}
              onChange={this.updateNewCommentText}
              maxRows={10}
              rows={1}
              style={{ width: '100%', marginTop: '30px', marginBottom: '30px' }}
            />
          </div>
          <div style={{ padding: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            {this.state.newComment.id >= 0 ? (
              <Button flat primary style={{ color: '#f64852' }} onClick={this.deleteComment}>
                Delete
              </Button>
            ) : null}
            <Button flat primary onClick={this.saveComment}>
              Save
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'inline-block' }}>
        <Button primary onClick={this.openEditDrawer}>
          Edit
        </Button>
        <Drawer
          id="grader-rubric-edit-drawer"
          className="drawer--grader-edit-rubric"
          style={{ width: '350px' }}
          visible={this.state.drawerVisible}
          onVisibilityChange={this.handleVisibility}
          title="Edit Rubric"
          type={Drawer.DrawerTypes.TEMPORARY}
          position={'left'}
          header={
            <Toolbar
              style={{ marginTop: '60px' }}
              actions={actions}
              className="md-divider-border md-divider-border--bottom"
            />
          }
        >
          {content}
        </Drawer>
      </div>
    );
  }
}

interface IRubricCategoryBlockProps {
  rubricCategory: RubricCategoryType;
  rubricComments: RubricCommentType[];
  changeSelectedComment: (rubricComment?: RubricCommentType) => void;
}

const RubricCategoryBlock = (props: IRubricCategoryBlockProps) => {
  return (
    <div style={{ padding: '10px', margin: '10px', borderRadius: '5px', border: '1px solid #CCCCCC' }}>
      <div style={{ fontSize: '20px', color: '#333333' }}>{props.rubricCategory.name}</div>
      <br />
      <DataTable plain className="table--grader-edit-rubric">
        <TableBody style={{ borderTop: '1px solid #CCCCCC' }}>
          {props.rubricComments.map((rubricComment: RubricCommentType) => {
            const hasLinkedComments = rubricComment.comments.length > 0;

            if (hasLinkedComments) {
              return (
                <TableRow
                  key={`rubric-comment-${rubricComment.id}`}
                  className="table--grader-edit-rubric__row--disabled"
                >
                  <TableColumn>
                    <FontIcon>link</FontIcon>
                  </TableColumn>
                  <TableColumn>{rubricComment.text}</TableColumn>
                  <TableColumn>{rubricComment.pointDelta}</TableColumn>
                </TableRow>
              );
            }
            return (
              <TableRow
                key={`rubric-comment-${rubricComment.id}`}
                className="table--grader-edit-rubric__row"
                onClick={props.changeSelectedComment.bind(props, rubricComment)}
              >
                <TableColumn />
                <TableColumn>{rubricComment.text}</TableColumn>
                <TableColumn>{rubricComment.pointDelta}</TableColumn>
              </TableRow>
            );
          })}
        </TableBody>
      </DataTable>
    </div>
  );
};

export default GraderEditRubric;
