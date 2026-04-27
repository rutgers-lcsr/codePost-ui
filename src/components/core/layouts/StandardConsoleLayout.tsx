// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import {
  ArrowLeftOutlined,
} from '@ant-design/icons';

/* antd imports */
import { Button, Layout, Tooltip } from 'antd';

/* codePost imports */
import layoutVars from '../../../styles/layout/_layoutVars';

import useFixedWindow from '../useFixedWindow';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

/* import { LOCAL_SETTINGS } from '../../utils/LocalSettings'; */

const { Header } = Layout;

export type ConsoleType = 'grade' | 'subheader';

type ConsoleTheme = 'light' | 'dark';

/**********************************************************************************************************************/

interface IStandardConsoleLayoutProps {
  consoleTypes?: ConsoleType[];
  header: React.ReactNode;
  sider: React.ReactElement[];
  siderIcons: Array<React.ComponentType<{ style?: React.CSSProperties }>>;
  content: React.ReactNode;
  children?: React.ReactNode;
  siderTitles: Array<string | React.ReactNode>;
  siderTooltips?: Array<string | React.ReactNode>; // Optional: separate tooltip text (e.g. with shortcuts)
  editRubricMode: boolean;
  activePanel?: number | null;
  onActivePanelChange?: (index: number | null) => void;
  panelDefaultWidths?: { [key: string]: number };
}

const StandardConsoleLayout = (props: IStandardConsoleLayoutProps) => {
  useFixedWindow();
  const [consoleTheme, setConsoleTheme] = React.useState(consoleThemes.light);
  const toggleConsoleTheme = React.useCallback((toTheme: ConsoleTheme) => {
    if (toTheme === 'light') {
      setConsoleTheme(consoleThemes.light);
    } else {
      setConsoleTheme(consoleThemes.dark);
    }
  }, []);

  const themeContextValue = React.useMemo(
    () => ({ consoleTheme, toggleConsoleTheme }),
    [consoleTheme, toggleConsoleTheme],
  );

  const [siderWidth, setSiderWidth] = React.useState(300);
  const [internalActivePanel, setInternalActivePanel] = React.useState<number | null>(2); // Default to Files

  // Use prop if provided, otherwise internal state
  const activePanel = props.activePanel !== undefined ? props.activePanel : internalActivePanel;

  const setActivePanel = (index: number | null) => {
    if (props.onActivePanelChange) {
      props.onActivePanelChange(index);
    } else {
      setInternalActivePanel(index);
    }
  };

  const [resizerHover, setResizerHover] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);

  /* Removed legacy persistence logic for now */
  /*
  React.useEffect(() => {
    // Legacy persistence logic
  }, [props.sider.length]);
  */

  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const lastActivePanelRef = React.useRef<number>(1);
  // Stores the user's sider width before a panel with a default width override was activated,
  // so we can restore it when switching away from that panel.
  const widthBeforeOverrideRef = React.useRef<number | null>(null);

  // Clamp sidebar width when the browser window is resized so the main
  // content area always has at least ~500 px of usable space.
  React.useEffect(() => {
    const handleResize = () => {
      // 50 px = icon rail, 500 px = minimum reserved for main content
      const maxW = Math.max(200, window.innerWidth - 50 - 500);
      setSiderWidth((prev) => Math.min(prev, maxW));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update last active panel when it changes
  React.useEffect(() => {
    if (activePanel !== null) {
      lastActivePanelRef.current = activePanel;

      const key = props.sider[activePanel]?.key;
      const hasDefaultWidth = !!(key && props.panelDefaultWidths?.[key]);

      if (hasDefaultWidth) {
        // Save the current width before overriding (only if not already saved)
        if (widthBeforeOverrideRef.current === null) {
          widthBeforeOverrideRef.current = siderWidth;
        }
        setSiderWidth(props.panelDefaultWidths![key!]);
      } else if (widthBeforeOverrideRef.current !== null) {
        // Leaving a panel that had a default width — restore the previous width
        setSiderWidth(widthBeforeOverrideRef.current);
        widthBeforeOverrideRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel]);

  // Sync internal state with prop if prop changes (optional, but good for consistency)
  React.useEffect(() => {
    if (props.activePanel !== undefined) {
      setInternalActivePanel(props.activePanel);
    }
  }, [props.activePanel]);

  const backToSubmissionsButton =
    localStorage.getItem('source') === 'codePost' ? null : (
      <Button
        type="primary"
        size="large"
        icon={<ArrowLeftOutlined />}
        style={{
          position: 'absolute',
          left: 10,
          bottom: 10,
          zIndex: 999999,
          boxShadow: '0 8px 16px 0 rgba(0,0,0,0.2)',
        }}
        onClick={() => window.open(`/`, '_self')}
      >
        Back to Submissions
      </Button>
    );

  const themeMode = consoleTheme === consoleThemes.light ? 'light' : 'dark';

  return (
    <ConsoleThemeContext.Provider value={themeContextValue}>
      <Layout className="layout--standard-console" data-console-theme={themeMode}>
        <Header
          style={{
            backgroundColor: consoleTheme.subheaderBg,
            maxWidth: '100vw',
            overflowX: 'auto',
            overflowY: 'hidden',
            lineHeight: '49px',
          }}
          className="layout--standard-console__header"
        >
          {props.header}
        </Header>
        <Layout style={{ overflowX: 'hidden', height: 'calc(100vh - 49px)', overflow: 'hidden', flexDirection: 'row' }}>
          {backToSubmissionsButton}
          <div
            id="Code-Header"
            style={{
              height: '100%',
              position: 'relative',
              display: 'flex',
              flexDirection: 'row',
              backgroundColor: consoleTheme.siderBg,
              zIndex: 101,
            }}
          >
            <div
              style={{
                width: '50px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '10px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                flexShrink: 0,
                zIndex: 102,
              }}
            >
              {props.siderIcons.map((IconComponent, index) => {
                const iconStyle = { fontSize: '20px', color: consoleTheme.siderTitle };
                return (
                  <SidebarIconButton
                    key={index}
                    title={
                      props.siderTooltips && props.siderTooltips[index]
                        ? props.siderTooltips[index]
                        : props.siderTitles[index]
                    }
                    icon={<IconComponent style={iconStyle} />}
                    active={activePanel === index}
                    onClick={() => {
                      if (activePanel === index) {
                        setActivePanel(null);
                      } else {
                        setActivePanel(index);
                      }
                    }}
                    theme={consoleTheme}
                  />
                );
              })}
              {/* Drag Handle to Open when Closed */}
              {activePanel === null && (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const delta = moveEvent.clientX - startX;
                      if (delta > 30) {
                        // Threshold to open
                        setActivePanel(lastActivePanelRef.current);
                        setSiderWidth(Math.max(200, delta));
                        // Clean up listeners immediately to transfer control or just open
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                      }
                    };

                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                  }}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '10px',
                    cursor: 'col-resize',
                    zIndex: 1000,
                  }}
                />
              )}
            </div>

            <>
              <div
                ref={sidebarRef}
                style={{
                  width: siderWidth,
                  height: '100%',
                  overflow: 'hidden',
                  backgroundColor: consoleTheme.siderBg,
                  boxShadow: '4px 0 8px rgba(0,0,0,0.1)',
                  position: 'relative',
                  flexShrink: 0,
                  zIndex: 100,
                  willChange: 'width',
                  display: activePanel !== null ? 'block' : 'none',
                }}
              >
                <div
                  style={{
                    padding: '10px 15px',
                    borderBottom: `1px solid ${consoleTheme.siderTitle}20`,
                    fontWeight: 600,
                    fontSize: '14px',
                    color: consoleTheme.siderTitle,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '40px',
                  }}
                >
                  {activePanel !== null ? props.siderTitles[activePanel] : null}
                  <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={() => setActivePanel(null)} />
                </div>
                <div
                  className="layout--standard-console__inner-sider"
                  style={{ height: 'calc(100% - 40px)', overflowY: 'hidden' }}
                >
                  {props.sider.map((panel, index) => (
                    <div
                      key={index}
                      style={{
                        height: '100%',
                        overflowY: 'auto',
                        display: activePanel === index ? 'block' : 'none',
                      }}
                    >
                      {panel}
                    </div>
                  ))}
                </div>
              </div>
              {activePanel !== null && (
                <div
                  onMouseEnter={() => setResizerHover(true)}
                  onMouseLeave={() => setResizerHover(false)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                    const startX = e.clientX;
                    const startWidth = siderWidth;
                    let animationFrameId: number;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                      if (animationFrameId) cancelAnimationFrame(animationFrameId);

                      animationFrameId = requestAnimationFrame(() => {
                        const newWidth = startWidth + (moveEvent.clientX - startX);
                        // Enforce min/max constraints — max is viewport-aware to keep
                        // the main content area at least ~500 px wide.
                        const maxW = Math.max(200, window.innerWidth - 50 - 500);
                        if (newWidth >= 200 && newWidth <= maxW) {
                          if (sidebarRef.current) {
                            sidebarRef.current.style.width = `${newWidth}px`;
                          }
                        }
                      });
                    };

                    const onMouseUp = (upEvent: MouseEvent) => {
                      setIsResizing(false);
                      if (animationFrameId) cancelAnimationFrame(animationFrameId);
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                      document.body.style.cursor = 'default';
                      document.body.style.userSelect = 'auto';

                      const finalWidth = startWidth + (upEvent.clientX - startX);

                      // Snap close if too small
                      if (finalWidth < 150) {
                        setActivePanel(null);
                        setSiderWidth(200); // Reset width for next open
                      } else {
                        // Commit final width to state (viewport-aware max)
                        const maxW = Math.max(200, window.innerWidth - 50 - 500);
                        const clampedWidth = Math.max(200, Math.min(maxW, finalWidth));
                        setSiderWidth(clampedWidth);
                      }
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';
                  }}
                  style={{
                    width: '7px',
                    height: '100%',
                    cursor: 'col-resize',
                    backgroundColor:
                      resizerHover || isResizing
                        ? themeMode === 'light'
                          ? 'rgba(0,0,0,0.2)'
                          : 'rgba(255,255,255,0.2)'
                        : 'transparent',
                    zIndex: 1000,
                    flexShrink: 0,
                    marginLeft: '-7px',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                />
              )}
            </>
          </div>
          <Layout
            style={{
              backgroundColor: consoleTheme.mainBg,
              minWidth: layoutVars.minWidths.grade,
              height: '100%',
              overflow: 'hidden',
              overscrollBehavior: 'contain',
              position: 'relative',
            }}
            id="code-scroll-area"
          >
            <main
              id="code-main-content"
              className="layout--standard-console__content"
              style={{
                height: '100%',
                maxHeight: '100%',
                overflowY: 'hidden',
                overflowX: 'hidden',
                flex: 1, // Ensure it takes up remaining space
              }}
            >
              {props.content}
            </main>
            {props.children}
          </Layout>
        </Layout>
      </Layout>
    </ConsoleThemeContext.Provider>
  );
};

interface ISidebarIconButtonProps {
  title: string | React.ReactNode;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  theme: typeof consoleThemes.light;
}

const SidebarIconButton = ({ title, icon, active, onClick, theme }: ISidebarIconButtonProps) => {
  const [hover, setHover] = React.useState(false);
  // Robust check for dark mode: check if background is dark-ish
  const isDark = theme.siderBg && theme.siderBg.toLowerCase().includes('#18191b');
  // Fallback: If title color is white (rgba(255,...) or #fff), it's dark mode.
  const isDarkMode =
    isDark || (theme.siderTitle && (theme.siderTitle.includes('255') || theme.siderTitle.includes('#fff')));

  const bgBase = isDarkMode ? '255, 255, 255' : '0, 0, 0';

  return (
    <Tooltip title={title} placement="right">
      <Button
        type="text"
        icon={icon}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: '42px',
          height: '42px',
          color: active ? '#1890ff' : theme.siderTitle,
          fontSize: '21px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '6px',
          borderRadius: '5px',
          boxShadow: 'none',
          backgroundColor: active ? `rgba(${bgBase}, 0.1)` : 'transparent',
          opacity: active || hover ? 1 : 0.65,
          transition: 'all 0.2s',
        }}
      />
    </Tooltip>
  );
};

export default StandardConsoleLayout;
