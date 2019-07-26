import React, { useContext } from 'react';

import { Icon, Tooltip } from 'antd';
import { TooltipProps } from 'antd/lib/tooltip';

import { ShowTooltipContext } from './tooltips';

import themeVars from '../../styles/abstracts/_theme';

interface IProps extends TooltipProps {
  children?: React.ReactNode;
  infoIcon?: boolean;
  iconStyle?: React.CSSProperties;
  title: string | React.ReactNode;
  hideThisOnHideTips?: boolean;
  hideChildrenOnHideTips?: boolean;
}

enum TOOLTIP_STATE {
  Show,
  HideText,
  HideTextAndChildren,
}

const getTooltipState = (
  showTooltips: boolean,
  hideOnToggle: boolean | undefined,
  hideChildrenOnToggle: boolean | undefined,
) => {
  if (showTooltips) return TOOLTIP_STATE.Show; // Show all tooltips
  if (!hideOnToggle) return TOOLTIP_STATE.Show; // Show this tooltip, even when the context sets tooltips to hidden
  if (!hideChildrenOnToggle) return TOOLTIP_STATE.HideText; // Hide text only
  return TOOLTIP_STATE.HideTextAndChildren; // Hide text and children
};

const CPTooltip = (props: IProps) => {
  const { children, infoIcon, title, iconStyle, hideThisOnHideTips, hideChildrenOnHideTips, ...antprops } = props;
  const showTooltips = useContext(ShowTooltipContext);

  let icon;
  if (infoIcon) {
    icon = (
      <Icon
        type="info-circle"
        theme={showTooltips ? 'twoTone' : 'outlined'}
        twoToneColor={themeVars.theme.brandPrimary}
        style={iconStyle}
      />
    );
  }

  const tooltipState = getTooltipState(showTooltips, hideThisOnHideTips, hideChildrenOnHideTips);

  switch (tooltipState) {
    case TOOLTIP_STATE.Show && icon:
      return (
        <Tooltip title={props.title} {...antprops}>
          {props.children}
          {icon}
        </Tooltip>
      );
    case TOOLTIP_STATE.Show:
      // Don't want to include an undefined icon variable, as it might affect styling
      // One example of styling affected is if the child element is a span element and there is a line-height defined
      return (
        <Tooltip title={props.title} {...antprops}>
          {props.children}
        </Tooltip>
      );
    case TOOLTIP_STATE.HideText:
      return (
        <Tooltip title={''} {...antprops}>
          {props.children}
        </Tooltip>
      );
    case TOOLTIP_STATE.HideTextAndChildren:
      return <div />;
  }
};

export default CPTooltip;
