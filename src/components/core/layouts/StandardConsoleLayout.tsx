/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Collapse, Icon, Layout } from 'antd';

/* codePost imports */
import themeVars from '../../../styles/abstracts/_theme.js';
import layoutVars from '../../../styles/layout/_layoutVars';

import useBrowserNotification from '../useBrowserNotification';
import useFixedWindow from '../useFixedWindow';
import useWindowSize from '../useWindowSize';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import { wait } from '../../../infrastructure/animation';

const { Content, Header, Sider } = Layout;

export type ConsoleType = 'grade' | 'subheader';

type ConsoleTheme = 'light' | 'dark';

/**********************************************************************************************************************/

interface IStandardConsoleLayoutProps {
  consoleTypes?: ConsoleType[];
  header: React.ReactNode;
  sider: React.ReactNode[];
  content: React.ReactNode;
  children?: React.ReactNode;
  siderTitles: Array<string | React.ReactNode>;
  editRubricMode: boolean;
}

const StandardConsoleLayout = (props: IStandardConsoleLayoutProps) => {
  useFixedWindow();
  useBrowserNotification();
  const windowSize = useWindowSize();
  const [consoleTheme, setConsoleTheme] = React.useState(consoleThemes.light);
  const toggleConsoleTheme = (toTheme: ConsoleTheme) => {
    toTheme === 'light' ? setConsoleTheme(consoleThemes.light) : setConsoleTheme(consoleThemes.dark);
  };

  let siderWidth =
    windowSize.width < layoutVars.breakpoints.smallScreen.grade
      ? layoutVars.maxWidths.gradeSiderSmallScreen
      : layoutVars.maxWidths.gradeSiderNormal;

  if (props.editRubricMode) {
    siderWidth = 700;
  }

  const handleResize = async () => {
    if (window.innerHeight !== 0) {
      const fileMenu = document.getElementById('file-menu');
      const rubricMenu = document.getElementById('rubric-menu');
      const submissionInfo = document.getElementById('submission-info');
      const rubricMenuTitle = document.getElementById('rubric-menu-title');

      if (fileMenu !== null && rubricMenu !== null && rubricMenuTitle !== null && submissionInfo !== null) {
        // Don't let the file menu take up more than half of the vertical space
        // allowable for files and rubric
        const fileMenuMaxHeight =
          (window.innerHeight - themeVars.grade.headerHeight) / 2 - themeVars.grade.subheaderHeight;
        fileMenu.style.setProperty('max-height', `${fileMenuMaxHeight}px`);

        setBottomElementMaxHeight(rubricMenuTitle, rubricMenu, props.editRubricMode);
      }
    }
  };

  React.useEffect(() => {
    if (props.consoleTypes && props.consoleTypes.includes('grade')) {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [props.editRubricMode]);

  const onCollapse = async (keys: string[]) => {
    if (window.innerHeight !== 0) {
      const rubricMenu = document.getElementById('rubric-menu');
      const rubricMenuTitle = document.getElementById('rubric-menu-title');

      if (rubricMenu !== null && rubricMenuTitle !== null) {
        // Force the rubric to fill any extra space created by a collapsed component
        // by removing max-height restriction. This prevents the rubric from occupying
        // less than the available space created by a collapse before
        // update below has completed.
        rubricMenu.style.setProperty('max-height', 'none');

        // wait for collapse/uncover animation to complete
        await wait(500);

        // Update max-height to facilitate scrolling
        setBottomElementMaxHeight(rubricMenuTitle, rubricMenu, props.editRubricMode);
      }
    }
  };

  // Manually set collapse icon so we can change color for dark mode
  const collapseIcon = ({ isActive }: { isActive: boolean }) => {
    const iconType = isActive ? 'up' : 'down';
    return <Icon type={iconType} style={{ color: consoleTheme.siderTitle }} />;
  };

  return (
    <ConsoleThemeContext.Provider value={{ consoleTheme, toggleConsoleTheme }}>
      <Layout className="layout--standard-console">
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
        <Layout style={{ overflowX: 'auto' }}>
          <Sider
            width={siderWidth}
            className="layout--standard-console__sider"
            style={{
              backgroundColor: consoleTheme.siderBg,
              color: consoleTheme.siderTitle,
              zIndex: 100,
            }}
          >
            {props.sider.length === 0 ? null : (
              // @ts-ignore
              <Collapse
                expandIconPosition="right"
                defaultActiveKey={props.sider.map((el, index) => index.toString())}
                bordered={false}
                // @ts-ignore
                onChange={onCollapse}
                // @ts-ignore
                expandIcon={collapseIcon}
                style={{
                  backgroundColor: consoleTheme.siderBg,
                  color: consoleTheme.siderTitle,
                }}
              >
                {props.sider.map((siderNode: React.ReactNode, index: number) => {
                  return (
                    <Collapse.Panel
                      header={
                        <div
                          style={{
                            padding: '0px 10px 5px 0px',
                            color: consoleTheme.siderTitle,
                          }}
                        >
                          <div className="cp-label cp-label--plus cp-label--bold">{props.siderTitles[index]}</div>
                        </div>
                      }
                      key={index.toString()}
                    >
                      {siderNode}
                    </Collapse.Panel>
                  );
                })}
              </Collapse>
            )}
          </Sider>
          <Layout
            style={{
              backgroundColor: consoleTheme.mainBg,
              minWidth: layoutVars.minWidths.grade,
            }}
            id="code-scroll-area"
          >
            <Content className="layout--standard-console__content">{props.content}</Content>
            {props.children}
          </Layout>
        </Layout>
      </Layout>
    </ConsoleThemeContext.Provider>
  );
};

/**********************************************************************************************************************/

const setBottomElementMaxHeight = (above: HTMLElement, toSet: HTMLElement, editRubricMode: boolean) => {
  const rubricControlHeight = 50;
  const maxHeight = editRubricMode
    ? window.innerHeight - above.getBoundingClientRect().bottom - rubricControlHeight
    : window.innerHeight - above.getBoundingClientRect().bottom;
  toSet.style.setProperty('max-height', `${maxHeight}px`);
};

export default StandardConsoleLayout;
