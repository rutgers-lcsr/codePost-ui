import { Badge as AntBadge } from 'antd';
import { colors } from '../../theme';

type BadgeSize = 'standard' | 'small';
type BadgeStyle = 'neutral' | 'positive' | 'negative';

interface IBadgeProps {
  count: number | string;
  faded?: boolean;
  forcedStyle?: BadgeStyle;
  size?: BadgeSize;
  placeholder?: boolean;
  showZero?: boolean;
}

const Badge: React.FC<IBadgeProps> = (props) => {
  const { count, faded, forcedStyle, size, placeholder, ...extraProps } = props;

  const _size = size === undefined ? 'standard' : size;

  let showZero = false;

  const numericCount = typeof count === 'number' ? count : parseFloat(count);

  let label = `${count}`;
  let className = `badge badge--${_size}`;
  let badgeStyle: 'negative' | 'positive' | 'neutral' = 'neutral';

  if (numericCount < 0) {
    label = `${count}`;
    className += ' badge--negative';
    badgeStyle = 'negative';
  } else if (numericCount > 0) {
    label = `+${count}`;
    className += ' badge--positive';
    badgeStyle = 'positive';
  } else {
    showZero = true;
    label = '0';
    className += ' badge--neutral';
    badgeStyle = 'neutral';
  }

  if (forcedStyle !== undefined) {
    label = `${count}`;
    className = `badge badge--${_size} badge--${forcedStyle} ${placeholder ? 'badge--placeholder' : ''}`;
    badgeStyle = forcedStyle;
  }

  if (faded !== undefined && faded) {
    className += ' badge--faded';
  } else {
    className += ' badge--normal';
  }

  // Get background color based on badge style
  const getBackgroundColor = () => {
    switch (badgeStyle) {
      case 'positive':
        return colors.brandPrimary; // brandPrimary
      case 'negative':
        return colors.actionRed; // actionRed
      case 'neutral':
      default:
        return undefined; // Let CSS handle it
    }
  };

  const backgroundColor = getBackgroundColor();

  return (
    <AntBadge
      count={label}
      className={className}
      classNames={{ indicator: className }}
      styles={backgroundColor ? { indicator: { backgroundColor } } : undefined}
      showZero={props.showZero || showZero}
      {...extraProps}
    />
  );
};

export default Badge;
