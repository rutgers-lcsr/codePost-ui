// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, CardProps, Flex } from 'antd';

/** Card's semantic styles, minus the callback form (this wrapper merges its own `title` entry). */
type CardStyles = Extract<CardProps['styles'], Record<string, unknown>>;

interface IProps extends Omit<CardProps, 'styles'> {
  styles?: CardStyles;
}

/**
 * Card whose header wraps instead of clipping.
 *
 * antd renders `title` and `extra` as one non-wrapping flex row, and `.ant-card-head-title`
 * is `flex: 1` with `overflow: hidden` — so when the header buttons don't fit (they don't, in
 * the narrow left column of the quizzes two-pane layout) the title silently collapses to a
 * sliver behind them. Putting both through the title slot lets `extra` drop to a second line
 * instead.
 */
const PanelCard: React.FC<IProps> = ({ title, extra, styles, children, ...rest }) => (
  <Card
    title={
      <Flex align="center" justify="space-between" gap={8} wrap style={{ rowGap: 8 }}>
        {title}
        {extra}
      </Flex>
    }
    styles={{
      ...styles,
      // Undo the head title's ellipsis clamp; the vertical padding keeps a wrapped
      // header off the card border (antd's head has horizontal padding only).
      title: { whiteSpace: 'normal', overflow: 'visible', padding: '12px 0', ...styles?.title },
    }}
    {...rest}
  >
    {children}
  </Card>
);

export default PanelCard;
