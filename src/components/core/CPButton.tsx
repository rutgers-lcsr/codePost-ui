import { Button, ButtonProps } from 'antd';
import React, { CSSProperties, ReactNode, useContext, useMemo } from 'react';
import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';
import { colors } from '../../theme/colors';
import CPTooltip from './CPTooltip';
import withWindowWatcher, { IWithWindowWatcherProps } from './withWindowWatcher';

export type CPButtonType = 'primary' | 'secondary' | 'dark' | 'danger' | 'highlight' | 'disabled' | 'link';

export interface ICPButtonProps extends IWithWindowWatcherProps {
  cpType: CPButtonType;
  fallbackIcon?: ReactNode;
  small?: boolean;
  isLoading?: boolean;
  fallbackWidth?: number; // Optional: window width when the button falls back to icon
}

type CPButtonFullProps = ButtonProps & ICPButtonProps;

const CPButton: React.FC<CPButtonFullProps> = ({
  cpType,
  fallbackIcon,
  fallbackWidth = 900,
  isLoading,
  small,
  windowwidth = 1920,
  windowheight: _windowheight,
  children,
  className,
  style,
  ...restProps
}) => {
  const { consoleTheme } = useContext(ConsoleThemeContext);

  // Compute custom styles based on cpType and theme
  const customStyle = useMemo((): CSSProperties => {
    const baseStyle: CSSProperties = { ...style };

    if (cpType === 'danger') {
      baseStyle.backgroundColor = consoleTheme.buttonDangerBg;
      baseStyle.color = consoleTheme.buttonSecondaryColor;
      baseStyle.border = consoleTheme.buttonDangerBorder;
    }

    if (cpType === 'secondary') {
      baseStyle.backgroundColor = consoleTheme.buttonSecondaryBg;
      baseStyle.border = consoleTheme.buttonSecondaryBorder;
      baseStyle.color = consoleTheme.buttonSecondaryColor;
    }

    if (cpType === 'dark') {
      baseStyle.border = 'solid 1px #5e5e5e';
      baseStyle.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      baseStyle.color = 'rgba(255, 255, 255, 0.5)';
    }

    if (cpType === 'highlight') {
      baseStyle.border = `solid 1px ${colors.brandPrimary}`;
      baseStyle.color = colors.brandPrimary;
    }

    if (isLoading) {
      baseStyle.cursor = 'wait';
    }

    return baseStyle;
  }, [cpType, consoleTheme, style, isLoading]);

  // Compute button type for Ant Design
  const buttonType = useMemo(() => {
    if (['primary', 'danger', 'link'].includes(cpType)) {
      return cpType as ButtonProps['type'];
    }
    return 'default';
  }, [cpType]);

  // Compute class names
  const classNames = useMemo(() => {
    const classes: string[] = [];

    if (className) {
      classes.push(className);
    }

    // Add minimum width for buttons with text
    if (children && !small) {
      classes.push('cp-button-with-text');
    }

    return classes.join(' ') || undefined;
  }, [className, children, small]);

  // Determine if button should fallback to icon-only based on window width
  const shouldFallbackToIcon = windowwidth < fallbackWidth && !!fallbackIcon;

  // Render icon-only button for small screens
  if (shouldFallbackToIcon) {
    return (
      <CPTooltip title={children}>
        <Button
          {...restProps}
          type={buttonType}
          shape="circle"
          icon={fallbackIcon}
          style={customStyle}
          className={classNames}
        />
      </CPTooltip>
    );
  }

  // Render normal button
  return (
    <Button
      {...restProps}
      type={buttonType}
      shape={children ? undefined : 'circle'}
      style={customStyle}
      className={classNames}
    >
      {children}
    </Button>
  );
};

CPButton.displayName = 'CPButton';

const CPButtonWithWindowWatcher = withWindowWatcher(CPButton);

export default CPButtonWithWindowWatcher;
