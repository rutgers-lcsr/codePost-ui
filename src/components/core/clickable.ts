// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import React from 'react';

/**
 * Props that make a non-button element (antd Card, Tag, …) behave like a
 * button for keyboard and screen-reader users: focusable, announced as a
 * button, and activatable with Enter/Space.
 */
export const clickableProps = (
  onClick: () => void,
): {
  onClick: () => void;
  role: 'button';
  tabIndex: number;
  onKeyDown: (e: React.KeyboardEvent) => void;
} => ({
  onClick,
  role: 'button',
  tabIndex: 0,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  },
});
