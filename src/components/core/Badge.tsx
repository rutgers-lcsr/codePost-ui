import * as React from 'react';

import { Badge as AntBadge } from 'antd';

type BadgeSize = 'standard' | 'small';
type BadgeStyle = 'neutral' | 'positive' | 'negaitve';

interface IBadgeProps {
  count: number;
  faded?: boolean;
  forcedStyle?: BadgeStyle;
  size?: BadgeSize;
}

const Badge = (props: IBadgeProps) => {
  const { count, faded, forcedStyle, size, ...extraProps } = props;

  const _size = size === undefined ? 'standard' : size;

  let label = `${count}`;
  let className = `badge badge--${_size}`;
  if (count < 0) {
    label = `${count}`;
    className += ' badge--negative';
  } else if (count > 0) {
    label = `+${count}`;
    className += ' badge--positive';
  } else {
    label = 'Ø';
    className += ' badge--neutral';
  }

  if (forcedStyle !== undefined) {
    label = `${count}`;
    className = `badge badge--${_size} badge--${forcedStyle}`;
  }

  if (faded !== undefined && faded) {
    className += ' badge--faded';
  } else {
    className += ' badge--normal';
  }

  return <AntBadge count={label} className={className} {...extraProps} />;
};

export default Badge;
