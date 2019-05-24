import * as React from 'react';

import { Input, Menu } from 'antd';

const SubMenu = Menu.SubMenu;

const Search = Input.Search;

import { IRubricCategoryToRubricCommentsMap } from '../../types/common';

import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';

interface ICPRubricMenuProps {
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
}

interface ICPRubricMenuState {
  searchTerm: string;
}

class CPRubricMenu extends React.Component<ICPRubricMenuProps, ICPRubricMenuState> {
  public state: Readonly<ICPRubricMenuState> = {
    searchTerm: '',
  };

  public onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchTerm: e.target.value });
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
          points = `+${rubricComment.pointDelta}`;
        } else {
          points = `${rubricComment.pointDelta}`;
        }

        return (
          <Menu.Item key={`rubric-comment-${rubricCategory.id}-${rubricComment.id}`}>
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
        <div style={{ padding: '18px 20px 20px 16px' }} id="cp-rubric-menu-title">
          <div className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
            Rubric
          </div>
          <Search placeholder="Search..." onChange={this.onSearch} value={this.state.searchTerm} />
        </div>
        <Menu defaultOpenKeys={rubricKeys} mode="inline" className="cp-rubric-menu" id="cp-rubric-menu">
          {rubricMenu}
        </Menu>
      </div>
    );
  }
}

export default CPRubricMenu;
