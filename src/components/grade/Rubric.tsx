import * as React from 'react';
import SearchBar from '../SearchBar';

import '../../styles/Grade.scss';

import { IRubricCategory, IRubricComment } from '../../types/common';

import { Table, Td, Tr } from 'reactable';

interface IVisibleMap {
  [categoryId: number]: boolean;
}

interface IProps {
  rubric: IRubricCategory[];
  handleRubricCommentClick: any;
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

  public toggleVisible = (category: IRubricCategory, visible: boolean, event: any) => {
    this.setState({
      visibles: { ...this.state.visibles, [category.id]: !visible },
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
    const { handleRubricCommentClick, rubric } = this.props;
    const { searchTerm, visibles } = this.state;

    return (
      <div className="container-rubric">
        <SearchBar placeholder={'Search...'} onChange={this.onChange} onCancel={this.onCancel} />
        {rubric.map((category: IRubricCategory, index: number) => {
          const visible = visibles[category.id] === undefined ? false : visibles[category.id];
          return (
            <RubricCategory
              category={category}
              key={`${category}-${index}`}
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
  category: IRubricCategory;
  visible: boolean;
  searchTerm: string;
  handleDropDown: (category: IRubricCategory, visible: boolean, event: any) => void;
  handleRubricCommentClick: any;
}

const RubricCategory = (props: IRubricCategoryProps) => {
  const { category, handleRubricCommentClick, searchTerm, visible } = props;

  const buttonClass = visible ? 'button-up-arrow' : 'button-down-arrow';

  return (
    <div className="rubric-category">
      <div
        className="container-category"
        onClick={props.handleDropDown.bind(props, category, visible)}
      >
        <div className="category-title">
          {category.name}
          <div
            className={buttonClass}
            onClick={props.handleDropDown.bind(props, category, visible)}
          />
        </div>
      </div>
      {visible && (
        <Table
          className={'table-rubric-category'}
          filterable={[' ']}
          filterBy={searchTerm}
          hideFilterInput={true}
        >
          {category.categoryComments.map((comment: IRubricComment, index: number) => {
            return (
              <Tr key={index}>
                <Td column=" " value={comment.text}>
                  <RubricComment
                    comment={comment}
                    handleRubricCommentClick={handleRubricCommentClick}
                  />
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
  comment: IRubricComment;
  handleRubricCommentClick: any;
}

const RubricComment = (props: IRubricCommentProps) => {
  const { comment } = props;

  const onClick = (event: any) => {
    props.handleRubricCommentClick(comment);
  };

  return (
    <div className="rubric-item" onClick={onClick}>
      <div className="rubric-item-text">{comment.text}</div>
      <div className="rubric-item-point-delta">{comment.pointDelta}</div>
    </div>
  );
};

export default Rubric;
