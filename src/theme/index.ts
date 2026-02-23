// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { ThemeConfig } from 'antd';
import { colors } from './colors';

/**
 * Ant Design Theme Configuration
 *
 * This configuration is used by the ConfigProvider in index.tsx
 * All colors are imported from ./colors.ts for consistency
 */
const themeConfig: ThemeConfig = {
  token: {
    fontFamily: 'Avenir Next, Lato, sans-serif',
    colorPrimary: '#198665',
    colorLink: '#1473ccff',
    colorSuccess: colors.brandPrimary,
    colorWarning: '#a26510ff',
    colorError: colors.actionRed,
    colorInfo: colors.actionBlue,
    colorBgLayout: '#f2f2f2',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: colors.neutralBorder,
    colorBorderSecondary: 'rgba(0, 0, 0, 0.06)',
    colorTextHeading: 'rgba(0, 0, 0, 0.9)',
    colorText: colors.neutralTitle,
    colorTextSecondary: colors.neutralSecondaryText,
    colorTextPlaceholder: 'rgba(0, 0, 0, 0.45)',
    colorTextDisabled: 'rgba(0, 0, 0, 0.25)',
    fontSize: 14,
    borderRadius: 4,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
    zIndexPopupBase: 2000,
  },
  components: {
    Layout: {
      bodyBg: '#f2f2f2',
      headerBg: colors.brandBlack,
      headerHeight: 64,
      headerPadding: '0 61px',
      headerColor: '#000000',
      siderBg: colors.brandBlack,
      triggerBg: colors.brandBlackHighlight,
      triggerColor: '#ffffff',
    },
    Menu: {
      itemBg: colors.brandBlack,
      subMenuItemBg: '#f7f7f7ff',
      itemBorderRadius: 4,
      itemColor: 'rgba(38, 36, 36, 0.85)',
      itemHoverColor: colors.brandPrimary,
      itemActiveBg: 'rgba(36, 190, 133, 0.2)',
      itemSelectedBg: '#198665',
      itemSelectedColor: '#fff',
      darkItemBg: colors.brandBlack,
      darkSubMenuItemBg: colors.brandBlackHighlight,
      darkItemSelectedBg: '#198665',
      darkItemSelectedColor: '#fff',
      darkItemHoverBg: 'rgba(36, 190, 133, 0.2)',
      darkItemColor: 'rgba(255, 255, 255, 0.85)',
      darkItemHoverColor: colors.brandPrimary,
    },
    Typography: {
      linkDecoration: 'none',
      linkHoverDecoration: 'none',
      colorTextSecondary: 'rgba(0, 0, 0, 0.65)', // Darker for WCAG AA contrast
    },
    Breadcrumb: {
      itemColor: 'rgba(0, 0, 0, 0.8)',
      lastItemColor: 'rgba(0, 0, 0, 0.8)',
    },
    Button: {
      defaultBg: '#ffffff',
      defaultHoverBg: '#f5f5f5',
      defaultActiveBg: '#e8f6ef',
      defaultColor: 'rgba(0, 0, 0, 0.8)',
      defaultHoverColor: '#198665',
      defaultActiveColor: '#14694f',
      defaultBorderColor: 'rgba(0, 0, 0, 0.1)',
      defaultHoverBorderColor: '#198665',
      defaultActiveBorderColor: '#198665',
      primaryShadow: '0 2px 0 rgba(0, 0, 0, 0.045)',
      dangerShadow: '0 2px 0 rgba(0, 0, 0, 0.045)',
      paddingInline: 16,
      paddingBlock: 8,
    },
    Collapse: {
      headerBg: '#f2f2f2',
      contentBg: '#ffffff',
      headerPadding: '8px 16px',
      contentPadding: '16px',
    },
    Tooltip: {
      zIndexPopup: 2500,
    },
    Modal: {
      // headerBg: '#1b1b1b',
      titleColor: 'rgba(0, 0, 0, 0.8)',
      contentBg: '#ffffff',
      colorBgBase: '#000000',
    },
    Tabs: {
      itemColor: 'rgba(0, 0, 0, 0.8)',
      itemHoverColor: '#198665',
      itemSelectedColor: '#198665',
      inkBarColor: '#198665',
    },
    Input: {
      addonBg: '#f5f5f5',
      hoverBorderColor: '#198665',
      activeBorderColor: '#198665',
      hoverBg: '#ffffff',
      activeBg: '#ffffff',
      activeShadow: '0 0 0 2px rgba(25, 134, 101, 0.2)',
    },
    Select: {
      selectorBg: '#ffffff',
      hoverBorderColor: '#198665',
      activeBorderColor: '#198665',
      activeOutlineColor: 'rgba(25, 134, 101, 0.2)',
      optionSelectedColor: '#198665',
      optionSelectedBg: 'rgba(25, 134, 101, 0.1)',
      optionActiveBg: 'rgba(25, 134, 101, 0.05)',
      multipleItemBg: 'rgba(25, 134, 101, 0.1)',
      multipleItemBorderColor: 'rgba(25, 134, 101, 0.25)',
    },
    Tag: {
      defaultBg: 'rgba(25, 134, 101, 0.1)',
      defaultColor: '#198665',
    },
    Badge: {
      indicatorZIndex: 1,
    },
  },
};

export default themeConfig;

// Re-export colors for convenience
export { colors, brandColors, actionColors, greenPalette, neutralColors, neutralDarkColors } from './colors';
