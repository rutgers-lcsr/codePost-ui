import * as React from 'react';

import { Input, Menu } from 'antd';

import { ClickParam } from 'antd/lib/menu';

const SubMenu = Menu.SubMenu;

const Search = Input.Search;

import { IRubricCategoryToRubricCommentsMap } from '../../types/common';

import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';

interface IRubricMenuProps {
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  handleRubricCommentClick: (rubricComment: RubricCommentType) => void;
}

interface IRubricMenuState {
  searchTerm: string;
}

class RubricMenu extends React.Component<IRubricMenuProps, IRubricMenuState> {
  public state: Readonly<IRubricMenuState> = {
    searchTerm: '',
  };

  public onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchTerm: e.target.value });
  };

  public onClick = (param: ClickParam) => {
    const [categoryID, commentID] = param.key.split('-').slice(-2);

    const rubricComment = this.props.rubricComments[+categoryID].find((comment: RubricCommentType) => {
      return comment.id === +commentID;
    });

    if (rubricComment !== undefined) {
      this.props.handleRubricCommentClick(rubricComment);
    }
  };

  public buildRubricMenu = (
    rubricCategories: RubricCategoryType[],
    rubricCommentMap: IRubricCategoryToRubricCommentsMap,
  ) => {
    return rubricCategories.map((rubricCategory: RubricCategoryType) => {
      const rubricComments = rubricCommentMap[rubricCategory.id].filter((rubricComment: RubricCommentType) => {
        return rubricComment.text.toUpperCase().includes(this.state.searchTerm.toUpperCase());
      });
      const rows = rubricComments.map((rubricComment: RubricCommentType) => {
        let points = '';
        if (rubricComment.pointDelta > 0) {
          points = `-${rubricComment.pointDelta}`;
        } else if (rubricComment.pointDelta < 0) {
          points = `+${rubricComment.pointDelta * -1}`;
        } else {
          points = `${rubricComment.pointDelta}`;
        }

        return (
          <Menu.Item key={`comment-${rubricCategory.id}-${rubricComment.id}`} onClick={this.onClick}>
            <span>{rubricComment.text}</span>
            <span style={{ position: 'absolute', right: '20px' }}>{points}</span>
          </Menu.Item>
        );
      });

      return (
        <SubMenu key={`category-${rubricCategory.id}`} title={<span>{rubricCategory.name}</span>}>
          {rows}
        </SubMenu>
      );
    });
  };

  public render() {
    const rubricMenu = this.buildRubricMenu(this.props.rubricCategories, this.props.rubricComments);
    const rubricKeys = this.props.rubricCategories.map((rubricCategory: RubricCategoryType) => {
      return `category-${rubricCategory.id}`;
    });
    return (
      <div>
        <div style={{ padding: '18px 20px 20px 16px' }} id="rubric-menu-title">
          <div className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
            Rubric
          </div>
          <Search placeholder="Search..." onChange={this.onSearch} value={this.state.searchTerm} />
        </div>
        <Menu defaultOpenKeys={rubricKeys} selectedKeys={[]} mode="inline" className="rubric-menu" id="rubric-menu">
          {rubricMenu}
        </Menu>
      </div>
    );
  }
}

export default RubricMenu;
