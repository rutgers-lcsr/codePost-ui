import React, { useContext } from 'react';

import { Icon, Tooltip } from 'antd';
import { TooltipProps } from 'antd/lib/tooltip';

import { ShowTooltipContext } from './tooltips';

import themeVars from '../../styles/abstracts/_theme';

type TooltipType = 'info' | 'question';

interface IProps extends TooltipProps {
  children?: React.ReactNode;
  type?: TooltipType;
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
  const { children, type, title, iconStyle, hideThisOnHideTips, hideChildrenOnHideTips, ...antprops } = props;
  const showTooltips = useContext(ShowTooltipContext);
  console.log(showTooltips);

  let icon;
  if (type !== undefined) {
    const iconType = type === 'info' ? 'info-circle' : 'question-circle';
    const iconColor =
      type === 'info'
        ? { color: themeVars.theme.neutralSecondaryText }
        : { color: themeVars.theme.neutralSecondaryText };
    icon = <Icon type={iconType} style={{ ...iconColor, ...iconStyle }} />;
  }

  const tooltipState = getTooltipState(showTooltips, hideThisOnHideTips, hideChildrenOnHideTips);

  switch (tooltipState) {
    case TOOLTIP_STATE.Show:
      return (
        <Tooltip title={props.title} {...antprops}>
          {props.children}
          {icon}
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
