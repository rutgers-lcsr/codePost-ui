import * as React from 'react';
import SearchBar from '../SearchBar';

import '../../styles/Grade.scss';

import { IRubricCategory, IRubricCategoryToRubricCommentsMap, IRubricComment } from '../../types/common';

import { Table, Td, Tr } from 'reactable';

interface IVisibleMap {
  [categoryID: number]: boolean;
}

interface IProps {
  rubricCategories: IRubricCategory[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  handleRubricCommentClick: (rubricComment: IRubricComment) => void;
}

interface IState {
  searchTerm: string;
  visibles: IVisibleMap;
}

class Rubric extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    searchTerm: '',
    visibles: {},
  };

  public toggleVisible = (rubricCategory: IRubricCategory, visible: boolean, event: any) => {
    this.setState({
      visibles: { ...this.state.visibles, [rubricCategory.id]: !visible },
    });
  };

  // Not used currently
  public onCancel = (event: any) => {
    this.setState({ searchTerm: '' });
  };

  public onChange = (value: string) => {
    this.setState({ searchTerm: value });
  };

  public render() {
    const { handleRubricCommentClick, rubricCategories, rubricComments } = this.props;
    const { searchTerm, visibles } = this.state;

    return (
      <div className="container-rubric">
        <SearchBar placeholder={'Search...'} onChange={this.onChange} onCancel={this.onCancel} />
        {rubricCategories.map((rubricCategory: IRubricCategory, index: number) => {
          const visible = visibles[rubricCategory.id] === undefined ? false : visibles[rubricCategory.id];
          return (
            <RubricCategory
              rubricCategory={rubricCategory}
              rubricComments={rubricComments[rubricCategory.id]}
              key={`${rubricCategory}-${index}`}
              handleDropDown={this.toggleVisible}
              visible={visible}
              searchTerm={searchTerm}
              handleRubricCommentClick={handleRubricCommentClick}
            />
          );
        })}
      </div>
    );
  }
}

interface IRubricCategoryProps {
  rubricCategory: IRubricCategory;
  rubricComments: IRubricComment[];
  visible: boolean;
  searchTerm: string;
  handleDropDown: (rubricCategory: IRubricCategory, visible: boolean, event: any) => void;
  handleRubricCommentClick: (rubricComment: IRubricComment) => void;
}

const RubricCategory = (props: IRubricCategoryProps) => {
  const { rubricCategory, rubricComments, handleRubricCommentClick, searchTerm, visible } = props;

  const buttonClass = visible ? 'button-up-arrow' : 'button-down-arrow';

  return (
    <div className="rubric-category">
      <div className="container-category" onClick={props.handleDropDown.bind(props, rubricCategory, visible)}>
        <div className="category-title">
          {rubricCategory.name}
          <div className={buttonClass} onClick={props.handleDropDown.bind(props, rubricCategory, visible)} />
        </div>
      </div>
      {visible && (
        <Table className={'table-rubric-category'} filterable={[' ']} filterBy={searchTerm} hideFilterInput={true}>
          {rubricComments.map((rubricComment: IRubricComment, index: number) => {
            return (
              <Tr key={index}>
                <Td column=" " value={rubricComment.text}>
                  <RubricComment rubricComment={rubricComment} handleRubricCommentClick={handleRubricCommentClick} />
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}
    </div>
  );
};

interface IRubricCommentProps {
  rubricComment: IRubricComment;
  handleRubricCommentClick: (rubricComment: IRubricComment) => void;
}

const RubricComment = (props: IRubricCommentProps) => {
  const { rubricComment } = props;

  const onClick = (event: any) => {
    props.handleRubricCommentClick(rubricComment);
  };

  return (
    <div className="rubric-item" onClick={onClick}>
      <div className="rubric-item-text">{rubricComment.text}</div>
      <div className="rubric-item-point-delta">{rubricComment.pointDelta}</div>
    </div>
  );
};

export default Rubric;
