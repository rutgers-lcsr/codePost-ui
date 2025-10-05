import React, { useContext } from 'react';

import { InfoCircleOutlined, InfoCircleTwoTone } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { AbstractTooltipProps } from 'antd/lib/tooltip';

import { ShowTooltipContext } from './tooltips';

import themeVars from '../../styles/abstracts/_theme.js';

interface IProps extends AbstractTooltipProps {
  children?: React.ReactElement;
  infoIcon?: boolean;
  iconStyle?: React.CSSProperties;
  title: string | React.ReactNode;
  hideThisOnHideTips?: boolean;
  hideChildrenOnHideTips?: boolean;
  disabled?: boolean;
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
    icon = showTooltips ? (
      <InfoCircleTwoTone style={iconStyle} />
    ) : (
      <InfoCircleOutlined style={iconStyle} twoToneColor={themeVars.theme.brandPrimary} />
    );
  }

  const tooltipState = getTooltipState(showTooltips, hideThisOnHideTips, hideChildrenOnHideTips);

  // Avoids https://github.com/ant-design/ant-design/issues/10795
  if (props.disabled && props.children) {
    return <span>{props.children}</span>;
  }

  switch (tooltipState) {
    case TOOLTIP_STATE.Show:
      // Don't want to include an undefined icon variable, as it might affect styling
      // One example of styling affected is if the child element is a span element and there is a line-height defined
      if (icon) {
        return (
          <Tooltip title={props.title} {...antprops}>
            <span>
              {props.children}
              {icon}
            </span>
          </Tooltip>
        );
      }
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
