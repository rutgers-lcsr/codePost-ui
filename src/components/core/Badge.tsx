import { Badge as AntBadge } from 'antd';

type BadgeSize = 'standard' | 'small';
type BadgeStyle = 'neutral' | 'positive' | 'negative';

interface IBadgeProps {
  count: number | string;
  faded?: boolean;
  forcedStyle?: BadgeStyle;
  size?: BadgeSize;
  placeholder?: boolean;
  hideZero?: boolean;
}

const Badge = (props: IBadgeProps) => {
  const { count, faded, forcedStyle, size, placeholder, ...extraProps } = props;

  const _size = size === undefined ? 'standard' : size;

  let showZero = false;

  const numericCount = typeof count === 'number' ? count : parseFloat(count);

  let label = `${count}`;
  let className = `badge badge--${_size}`;
  if (numericCount < 0) {
    label = `${count}`;
    className += ' badge--negative';
  } else if (numericCount > 0) {
    label = `+${count}`;
    className += ' badge--positive';
  } else {
    showZero = true;
    label = '0';
    className += ' badge--neutral';
  }

  if (forcedStyle !== undefined) {
    label = `${count}`;
    className = `badge badge--${_size} badge--${forcedStyle} ${placeholder ? 'badge--placeholder' : ''}`;
  }

  if (faded !== undefined && faded) {
    className += ' badge--faded';
  } else {
    className += ' badge--normal';
  }
  return <AntBadge count={label} className={className} showZero={props.hideZero ? false : showZero} {...extraProps} />;
};

export default Badge;
