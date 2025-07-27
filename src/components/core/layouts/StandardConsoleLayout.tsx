/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { Icon as LegacyIcon } from '@ant-design/compatible';
import { ArrowLeftOutlined } from '@ant-design/icons';

/* antd imports */
import { Button, Collapse, Layout } from 'antd';

/* codePost imports */
import themeVars from '../../../styles/abstracts/_theme.js';
import layoutVars from '../../../styles/layout/_layoutVars';

import useFixedWindow from '../useFixedWindow';
import useWindowSize from '../useWindowSize';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import { wait } from '../../../infrastructure/animation';

import { LOCAL_SETTINGS } from '../../utils/LocalSettings';

import Slider from 'rc-slider';

const { Content, Header, Sider } = Layout;

export type ConsoleType = 'grade' | 'subheader';

type ConsoleTheme = 'light' | 'dark';

/**********************************************************************************************************************/

interface IStandardConsoleLayoutProps {
  consoleTypes?: ConsoleType[];
  header: React.ReactNode;
  sider: React.ReactElement[];
  content: React.ReactNode;
  children?: React.ReactNode;
  siderTitles: Array<string | React.ReactNode>;
  editRubricMode: boolean;
}

const StandardConsoleLayout = (props: IStandardConsoleLayoutProps) => {
  useFixedWindow();
  const windowSize = useWindowSize();
  const [consoleTheme, setConsoleTheme] = React.useState(consoleThemes.light);
  const toggleConsoleTheme = (toTheme: ConsoleTheme) => {
    toTheme === 'light' ? setConsoleTheme(consoleThemes.light) : setConsoleTheme(consoleThemes.dark);
  };

  const [defaultOpenMenus, setDefaultOpenMenus] = React.useState([0, 1, 2]);

  const [rubricWidth, setRubricWidth] = React.useState(LOCAL_SETTINGS.siderWidth.getter());
  const minSiderWidth = 3;

  const onAfterChange = (result: number) => {
    const newWidth = result + minSiderWidth;
    setRubricWidth(newWidth);
    LOCAL_SETTINGS.siderWidth.setter(newWidth);
  };

  const siderResizer = (
    <div
      style={{
        backgroundColor: 'transparent',
        position: 'absolute',
        width: '100%',
        left: minSiderWidth,
        zIndex: 200,
      }}
    >
      <Slider
        className="sidebar-resizer"
        min={0}
        max={windowSize.width}
        defaultValue={rubricWidth - minSiderWidth}
        onAfterChange={onAfterChange}
        handleStyle={[
          {
            height: `${windowSize.height - 51}px`,
          },
        ]}
        trackStyle={[{ backgroundColor: 'transparent', height: '1px' }]}
        railStyle={{ backgroundColor: 'transparent', height: '1px' }}
        style={{ padding: '0px', height: '1px' }}
      />
    </div>
  );

  const handleResize = async () => {
    if (window.innerHeight !== 0) {
      const fileMenu = document.getElementById('file-menu');
      const rubricMenu = document.getElementById('rubric-menu');
      const submissionInfo = document.getElementById('submission-info');
      const rubricMenuTitle = document.getElementById('rubric-menu-title');

      // No rubric menu ==> Student View
      if (rubricMenu === null && fileMenu !== null && submissionInfo !== null) {
        const fileHeaderHeight = 40;
        const fileMenuMaxHeight = window.innerHeight - submissionInfo.getBoundingClientRect().bottom - fileHeaderHeight;
        fileMenu.style.setProperty('max-height', `${fileMenuMaxHeight}px`);
        // Rubric menu ==> Grader View
      } else if (rubricMenu !== null && rubricMenuTitle !== null && fileMenu !== null && submissionInfo !== null) {
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
    // Really, handleResize() should implement React.useCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.editRubricMode]);

  const getCachedCollapseKeys = () => {
    return props.sider
      .map((el, index) => {
        switch (el.key) {
          case 'submission-info':
            return !LOCAL_SETTINGS.infoMenuHidden.getter();
          case 'file-menu':
            return !LOCAL_SETTINGS.fileMenuHidden.getter();
          case 'tests-menu':
            return !LOCAL_SETTINGS.testsMenuHidden.getter();
          case 'rubric-menu':
            return !LOCAL_SETTINGS.rubricMenuHidden.getter();
          default:
            return index;
        }
      })
      .map((el, index) => {
        if (el) {
          return index;
        } else {
          return -1;
        }
      })
      .filter((el) => {
        return el > -1;
      })
      .map((el) => {
        return el.toString();
      });
  };

  const onCollapse = async (nodes: React.ReactElement[], keys: string[]) => {
    setDefaultOpenMenus(
      keys.map((el) => {
        return parseInt(el);
      }),
    );

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

        /* set local settings */
        nodes.forEach((node, index) => {
          const indexString = index.toString();
          switch (node.key) {
            case 'submission-info':
              LOCAL_SETTINGS.infoMenuHidden.setter(keys.indexOf(indexString) === -1);
              break;
            case 'file-menu':
              LOCAL_SETTINGS.fileMenuHidden.setter(keys.indexOf(indexString) === -1);
              break;
            case 'tests-menu':
              LOCAL_SETTINGS.testsMenuHidden.setter(keys.indexOf(indexString) === -1);
              break;
            case 'rubric-menu':
              LOCAL_SETTINGS.rubricMenuHidden.setter(keys.indexOf(indexString) === -1);
              break;
          }
        });
      }
    }
  };

  // Manually set collapse icon so we can change color for dark mode
  const collapseIcon = ({ isActive }: { isActive: boolean }) => {
    const iconType = isActive ? 'up' : 'down';
    return <LegacyIcon type={iconType} style={{ color: consoleTheme.siderTitle }} />;
  };

  React.useEffect(() => {
    setTimeout(() => onCollapse(props.sider, getCachedCollapseKeys()), 10);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.sider.length]);

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
          {backToSubmissionsButton}
          <div id="Code-Header">
            {siderResizer}
            <Sider
              width={rubricWidth}
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
                  activeKey={defaultOpenMenus.map((el) => {
                    return el.toString();
                  })}
                  bordered={false}
                  // @ts-ignore
                  onChange={onCollapse.bind(false, props.sider)}
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
          </div>
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
