// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* This commponent is a sider component that has two selectors, and (optionally) children to render under the selectors
/**********************************************************************************************************************/

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* antd imports */
import { Divider, Spin } from 'antd';
import type { MenuProps } from 'antd';

/* codePost imports */
import CPDropdown from './CPDropdown';
import CPTooltip from './CPTooltip';

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
  onFirstSelectorClick: MenuProps['onClick']; // callback when the first selector is clicked
  activeFirstSelector?: IOption; // active first selector item - controlled
  firstSelectorItems: IOptionWithDisabled[];

  // Second Selector
  onSecondSelectorClick: MenuProps['onClick']; // callback when the first selector is clicked
  activeSecondSelector?: IOption; // active first selector item - controlled
  secondSelectorItems: IOptionWithDisabled[];
  disabledMessage: string;

  theme?: ThemeType;
  isLoadingMenu?: boolean;
  children?: React.ReactNode;
}

const getMenuItems = (items: IOptionWithDisabled[], disabledMessage: string) => {
  return items.map((item: IOptionWithDisabled) => {
    if (item.isDisabled) {
      return {
        key: item.value,
        disabled: item.isDisabled,
        label: (
          <CPTooltip title={disabledMessage} placement={'right'}>
            <div>{item.label}</div>
          </CPTooltip>
        ),
      };
    } else {
      return {
        key: item.value,
        label: item.label,
      };
    }
  });
};

const MultiSelectorSider = (props: IProps) => {
  const theme = props.theme ? props.theme : 'light';
  const firstSelectorItems = getMenuItems(props.firstSelectorItems, '');
  const secondSelectorItems = getMenuItems(props.secondSelectorItems, props.disabledMessage);

  return (
    <div style={{ padding: '18px 20px 0 16px' }}>
      <div className="cp-label cp-label--medium cp-label--bold" style={{ paddingLeft: 15, paddingBottom: 10 }}>
        {props.title1}
      </div>
      <CPDropdown
        key="selector1"
        value={props.activeFirstSelector ? props.activeFirstSelector.label : 'Select...'}
        menu={{ items: firstSelectorItems, onClick: props.onFirstSelectorClick }}
        popupRender={(menu) => <div style={{ maxHeight: '300px', overflowY: 'auto' }}>{menu}</div>}
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
          menu={{ items: secondSelectorItems, onClick: props.onSecondSelectorClick }}
          popupRender={(menu) => <div style={{ maxHeight: '300px', overflowY: 'auto' }}>{menu}</div>}
          placement="bottomLeft"
          theme={theme}
          justifyContent="space-between"
          disabled={props.activeFirstSelector === undefined}
        />
      )}
      <Divider style={{ margin: '10 0 10 0' }} />
      {props.children}
    </div>
  );
};

export default MultiSelectorSider;
