/**********************************************************************************************************************/
/* This commponent is a sider component that has two selectors, and (optionally) children to render under the selectors
/**********************************************************************************************************************/

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Divider, Menu, Spin } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost imports */
import CPDropdown from './CPDropdown';

import { IOption } from '../../types/common';

/**********************************************************************************************************************/

type ThemeType = 'light' | 'dark';

interface IOptionWithDisabled extends IOption {
  isDisabled: boolean;
}

interface IProps {
  title1?: string; // title above the first selector
  title2?: string; // title above the second selector

  // First Selector
  onFirstSelectorClick: (e: ClickParam) => void; // callback when the first selector is clicked
  activeFirstSelector?: IOption; // active first selector item - controlled
  firstSelectorItems: IOptionWithDisabled[];

  // Second Selector
  onSecondSelectorClick: (e: ClickParam) => void; // callback when the first selector is clicked
  activeSecondSelector?: IOption; // active first selector item - controlled
  secondSelectorItems: IOptionWithDisabled[];

  theme?: ThemeType;
  isLoadingMenu?: boolean;
  children?: React.ReactNode;
}

const getOverlay = (items: IOptionWithDisabled[], onClick: (e: ClickParam) => void) => {
  return (
    <Menu onClick={onClick}>
      {items.map((item: IOptionWithDisabled, index: number) => {
        return (
          <Menu.Item key={item.value} disabled={item.isDisabled}>
            {item.label}
          </Menu.Item>
        );
      })}
    </Menu>
  );
};

const MultiSelectorSider = (props: IProps) => {
  const theme = props.theme ? props.theme : 'light';
  const firstSelectorOverlay = getOverlay(props.firstSelectorItems, props.onFirstSelectorClick);
  const secondSelectorOverlay = getOverlay(props.secondSelectorItems, props.onSecondSelectorClick);

  return (
    <div style={{ padding: '18px 20px 0 16px' }}>
      <div className="cp-label cp-label--medium cp-label--bold" style={{ paddingLeft: 15, paddingBottom: 10 }}>
        {props.title1}
      </div>
      <CPDropdown
        key="selector1"
        value={props.activeFirstSelector ? props.activeFirstSelector.label : 'Select...'}
        overlay={firstSelectorOverlay}
        overlayStyle={{ maxHeight: '300px', overflowY: 'scroll' }}
        placement="bottomLeft"
        theme={theme}
        justifyContent="space-between"
      />
      <div
        className="cp-label cp-label--medium cp-label--bold"
        style={{ paddingLeft: 15, paddingBottom: 10, paddingTop: 25 }}
      >
        {props.title2}
      </div>
      {props.isLoadingMenu ? (
        <Spin />
      ) : (
        <CPDropdown
          key="selector2"
          value={props.activeSecondSelector ? props.activeSecondSelector.label : 'Select...'}
          overlay={secondSelectorOverlay}
          overlayStyle={{ maxHeight: '300px', overflowY: 'scroll' }}
          placement="bottomLeft"
          theme={theme}
          justifyContent="space-between"
        />
      )}
      <Divider style={{ margin: '10 0 10 0' }} />
      {props.children}
    </div>
  );
};

export default MultiSelectorSider;
