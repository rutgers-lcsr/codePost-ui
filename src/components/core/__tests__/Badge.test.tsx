// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge', () => {
  // -----------------------------------------------------------------------
  // Label formatting
  // -----------------------------------------------------------------------
  describe('label formatting', () => {
    it('renders positive count with + prefix', () => {
      const { container } = render(<Badge count={3} />);
      expect(container.textContent).toContain('+3');
    });

    it('renders negative count with - prefix', () => {
      const { container } = render(<Badge count={-2} />);
      expect(container.textContent).toContain('-2');
    });

    it('renders zero as "0"', () => {
      const { container } = render(<Badge count={0} />);
      expect(container.textContent).toContain('0');
    });

    it('renders string count parsed as number', () => {
      const { container } = render(<Badge count="5" />);
      expect(container.textContent).toContain('+5');
    });

    it('renders negative string count', () => {
      const { container } = render(<Badge count="-1" />);
      expect(container.textContent).toContain('-1');
    });
  });

  // -----------------------------------------------------------------------
  // CSS class assignment
  // -----------------------------------------------------------------------
  describe('CSS classes', () => {
    it('applies badge--positive class for positive count', () => {
      const { container } = render(<Badge count={1} />);
      const badgeEl = container.querySelector('.badge--positive');
      expect(badgeEl).toBeTruthy();
    });

    it('applies badge--negative class for negative count', () => {
      const { container } = render(<Badge count={-1} />);
      const badgeEl = container.querySelector('.badge--negative');
      expect(badgeEl).toBeTruthy();
    });

    it('applies badge--neutral class for zero', () => {
      const { container } = render(<Badge count={0} />);
      const badgeEl = container.querySelector('.badge--neutral');
      expect(badgeEl).toBeTruthy();
    });

    it('applies badge--standard size by default', () => {
      const { container } = render(<Badge count={1} />);
      const badgeEl = container.querySelector('.badge--standard');
      expect(badgeEl).toBeTruthy();
    });

    it('applies badge--small size when specified', () => {
      const { container } = render(<Badge count={1} size="small" />);
      const badgeEl = container.querySelector('.badge--small');
      expect(badgeEl).toBeTruthy();
    });

    it('applies badge--faded class when faded', () => {
      const { container } = render(<Badge count={1} faded />);
      const badgeEl = container.querySelector('.badge--faded');
      expect(badgeEl).toBeTruthy();
    });

    it('applies badge--normal class when not faded', () => {
      const { container } = render(<Badge count={1} />);
      const badgeEl = container.querySelector('.badge--normal');
      expect(badgeEl).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // forcedStyle
  // -----------------------------------------------------------------------
  describe('forcedStyle', () => {
    it('overrides auto-detected style with forcedStyle', () => {
      const { container } = render(<Badge count={5} forcedStyle="negative" />);
      const badgeEl = container.querySelector('.badge--negative');
      expect(badgeEl).toBeTruthy();
      // Should NOT have +prefix when forcedStyle is set
      expect(container.textContent).toContain('5');
    });

    it('applies placeholder class when placeholder is true', () => {
      const { container } = render(<Badge count={0} forcedStyle="neutral" placeholder />);
      const badgeEl = container.querySelector('.badge--placeholder');
      expect(badgeEl).toBeTruthy();
    });
  });
});
