// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Button, ButtonProps } from 'antd';
import React, { CSSProperties, ReactNode, useContext, useMemo } from 'react';
import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';
import { colors } from '../../theme/colors';
import CPTooltip from './CPTooltip';
import withWindowWatcher, { IWithWindowWatcherProps } from './withWindowWatcher';

export type CPButtonType = 'primary' | 'secondary' | 'default' | 'dark' | 'danger' | 'highlight' | 'disabled' | 'link';

export interface ICPButtonProps extends IWithWindowWatcherProps {
  cpType?: CPButtonType;
  fallbackIcon?: ReactNode;
  small?: boolean;
  isLoading?: boolean;
  fallbackWidth?: number; // Optional: window width when the button falls back to icon
}

type CPButtonFullProps = ButtonProps & ICPButtonProps;

const CPButton = React.forwardRef<HTMLButtonElement, CPButtonFullProps>(
  (
    {
      cpType = 'secondary',
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
    },
    ref,
  ) => {
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
        baseStyle.border = 'solid 1px #8b949e';
        baseStyle.backgroundColor = 'rgba(255, 255, 255, 0.12)';
        baseStyle.color = 'rgba(255, 255, 255, 0.88)';
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
      if (cpType === 'default') {
        return 'default';
      }

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

      classes.push(`cp-button-${cpType}`);

      return classes.join(' ') || undefined;
    }, [className, children, small, cpType]);

    // Determine if button should fallback to icon-only based on window width
    const shouldFallbackToIcon = windowwidth < fallbackWidth && !!fallbackIcon;

    // Render icon-only button for small screens
    if (shouldFallbackToIcon) {
      return (
        <CPTooltip title={children}>
          <Button
            ref={ref}
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
        ref={ref}
        {...restProps}
        type={buttonType}
        shape={children ? undefined : 'circle'}
        style={customStyle}
        className={classNames}
      >
        {children}
      </Button>
    );
  },
);

CPButton.displayName = 'CPButton';

const CPButtonWithWindowWatcher = withWindowWatcher(CPButton);

export default CPButtonWithWindowWatcher;
