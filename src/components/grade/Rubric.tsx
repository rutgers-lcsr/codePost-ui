import * as React from 'react';
import SearchBar from '../SearchBar';

import ReactMarkdown from 'react-markdown';

import { IRubricCategoryToRubricCommentsMap } from '../../types/common';

import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';

import { Button } from 'react-md';

interface IVisibleMap {
  [categoryID: number]: boolean;
}

interface IProps {
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  handleRubricCommentClick: (rubricComment: RubricCommentType) => void;
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

  public constructor(props: any) {
    super(props);
    const visibles = {};
    this.props.rubricCategories.forEach((cat) => {
      visibles[cat.id] = true;
    });
    this.state = { searchTerm: '', visibles };
  }

  public toggleVisible = (rubricCategory: RubricCategoryType, visible: boolean, event: any) => {
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
      <div className="grade-rubric">
        <div className="grade-rubric__title">Assignment Rubric</div>
        <SearchBar placeholder={'Search...'} onChange={this.onChange} onCancel={this.onCancel} />
        <div className="grade-rubric__scrollable-container">
          {rubricCategories.map((rubricCategory: RubricCategoryType, index: number) => {
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
      </div>
    );
  }
}

interface IRubricCategoryProps {
  rubricCategory: RubricCategoryType;
  rubricComments: RubricCommentType[];
  visible: boolean;
  searchTerm: string;
  handleDropDown: (rubricCategory: RubricCategoryType, visible: boolean, event: any) => void;
  handleRubricCommentClick: (rubricComment: RubricCommentType) => void;
}

const RubricCategory = (props: IRubricCategoryProps) => {
  const { rubricCategory, rubricComments, handleRubricCommentClick, searchTerm, visible } = props;

  const buttonIcon = visible ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  const arrowClassName = visible ? 'button--rubric-arrow button--rubric-arrow--up' : 'button--rubric-arrow';

  return (
    <div className="grade-rubric__category">
      <div
        className="grade-rubric__category__title-row"
        onClick={props.handleDropDown.bind(props, rubricCategory, visible)}
      >
        <div className="grade-rubric__category__title-row__title">
          <Button key={rubricCategory.id} className={arrowClassName} icon={true}>
            {buttonIcon}
          </Button>
          <ReactMarkdown source={rubricCategory.name} />
        </div>
      </div>
      {visible &&
        rubricComments
          .filter((rubricComment: RubricCommentType) => {
            return rubricComment.text.toUpperCase().includes(searchTerm.toUpperCase());
          })
          .map((rubricComment: RubricCommentType, index: number) => {
            return (
              <RubricComment
                key={index}
                rubricComment={rubricComment}
                handleRubricCommentClick={handleRubricCommentClick}
              />
            );
          })}
    </div>
  );
};

interface IRubricCommentProps {
  rubricComment: RubricCommentType;
  handleRubricCommentClick: (rubricComment: RubricCommentType) => void;
}

const RubricComment = (props: IRubricCommentProps) => {
  const { rubricComment } = props;

  const onClick = (event: any) => {
    props.handleRubricCommentClick(rubricComment);
  };

  return (
    <div className="grade-rubric__category__comment-row" onClick={onClick}>
      <div className="grade-rubric__category__comment-row__text">{rubricComment.text}</div>
      <div className="grade-rubric__category__comment-row__point-delta">{rubricComment.pointDelta}</div>
    </div>
  );
};

export default Rubric;
