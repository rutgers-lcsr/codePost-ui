/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import {
  ArrowLeftOutlined,
  BookOutlined,
  DownOutlined,
  ExperimentOutlined,
  FileOutlined,
  InfoCircleOutlined,
  UpOutlined,
} from '@ant-design/icons';

/* antd imports */
import { Button, Collapse, Layout, Tooltip } from 'antd';

/* codePost imports */
import layoutVars from '../../../styles/layout/_layoutVars';

import useFixedWindow from '../useFixedWindow';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import { LOCAL_SETTINGS } from '../../utils/LocalSettings';

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
  const [consoleTheme, setConsoleTheme] = React.useState(consoleThemes.light);
  const toggleConsoleTheme = (toTheme: ConsoleTheme) => {
    toTheme === 'light' ? setConsoleTheme(consoleThemes.light) : setConsoleTheme(consoleThemes.dark);
  };

  const [defaultOpenMenus, setDefaultOpenMenus] = React.useState([0, 1, 2]);

  const [siderCollapsed, setSiderCollapsed] = React.useState(false);
  const collapsedSiderWidth = 50;

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

  const onCollapse = (nodes: React.ReactElement[], keys: string[]) => {
    setDefaultOpenMenus(
      keys.map((el) => {
        return parseInt(el);
      }),
    );

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
  };

  // Manually set collapse icon so we can change color for dark mode
  const collapseIcon = ({ isActive }: { isActive?: boolean }) => {
    const Icon = isActive ? UpOutlined : DownOutlined;
    return <Icon style={{ color: consoleTheme.siderTitle }} />;
  };

  // Get icon for each menu based on its key
  const getMenuIcon = (key: string | null | undefined) => {
    const iconStyle = { fontSize: '20px', color: consoleTheme.siderTitle };
    switch (key) {
      case 'submission-info':
        return <InfoCircleOutlined style={iconStyle} />;
      case 'file-menu':
        return <FileOutlined style={iconStyle} />;
      case 'tests-menu':
        return <ExperimentOutlined style={iconStyle} />;
      case 'rubric-menu':
        return <BookOutlined style={iconStyle} />;
      default:
        return <FileOutlined style={iconStyle} />;
    }
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

  const themeMode = consoleTheme === consoleThemes.light ? 'light' : 'dark';

  return (
    <ConsoleThemeContext.Provider value={{ consoleTheme, toggleConsoleTheme }}>
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
        <Layout style={{ overflowX: 'hidden', height: 'calc(100vh - 49px)', overflow: 'hidden' }}>
          {backToSubmissionsButton}
          <div id="Code-Header" style={{ height: '100%', position: 'relative' }}>
            <Sider
              className="layout--standard-console__sider"
              width={siderCollapsed ? collapsedSiderWidth : 300}
              collapsible
              collapsed={siderCollapsed}
              onCollapse={(collapsed) => setSiderCollapsed(collapsed)}
              collapsedWidth={collapsedSiderWidth}
              trigger={null}
              style={{
                backgroundColor: consoleTheme.siderBg,
                color: consoleTheme.siderTitle,
                zIndex: 100,
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Button
                type="text"
                icon={
                  siderCollapsed ? (
                    <ArrowLeftOutlined rotate={180} style={{ fontSize: '16px' }} />
                  ) : (
                    <ArrowLeftOutlined style={{ fontSize: '16px' }} />
                  )
                }
                onClick={() => setSiderCollapsed(!siderCollapsed)}
                style={{
                  width: siderCollapsed ? '50px' : '100%',
                  minWidth: siderCollapsed ? '50px' : '100%',
                  height: '40px',
                  color: consoleTheme.siderTitle,
                  borderTop: `1px solid ${consoleTheme.siderTitle}20`,
                  borderBottom: `1px solid ${consoleTheme.siderTitle}20`,
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  margin: '0 auto',
                }}
              />
              {siderCollapsed && props.sider.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0', alignItems: 'center' }}>
                  {props.sider.map((siderNode, index) => (
                    <Tooltip key={index} title={props.siderTitles[index]} placement="right">
                      <Button
                        type="text"
                        icon={getMenuIcon(siderNode.key)}
                        onClick={() => setSiderCollapsed(false)}
                        style={{
                          width: '50px',
                          minWidth: '50px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      />
                    </Tooltip>
                  ))}
                </div>
              )}
              {!siderCollapsed && props.sider.length > 0 && (
                <div className="layout--standard-console__inner-sider" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                  <Collapse
                    expandIconPosition="end"
                    activeKey={defaultOpenMenus.map((el) => {
                      return el.toString();
                    })}
                    bordered={false}
                    onChange={(keys: string | string[]) => onCollapse(props.sider, Array.isArray(keys) ? keys : [keys])}
                    expandIcon={collapseIcon}
                    style={{
                      backgroundColor: consoleTheme.siderBg,
                      color: consoleTheme.siderTitle,
                    }}
                    items={props.sider.map((siderNode: React.ReactNode, index: number) => ({
                      key: index.toString(),
                      label: (
                        <div
                          style={{
                            padding: '0px 10px 5px 0px',
                            color: consoleTheme.siderTitle,
                          }}
                        >
                          <div className="cp-label cp-label--plus cp-label--bold">{props.siderTitles[index]}</div>
                        </div>
                      ),
                      children: <div>{siderNode}</div>,
                    }))}
                  />
                </div>
              )}
            </Sider>
          </div>
          <Layout
            style={{
              backgroundColor: consoleTheme.mainBg,
              minWidth: layoutVars.minWidths.grade,
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
            id="code-scroll-area"
          >
            <Content
              className="layout--standard-console__content"
              style={{
                height: '100%',
                maxHeight: '100%',
                overflowY: 'hidden',
                overflowX: 'hidden',
              }}
            >
              {props.content}
            </Content>
            {props.children}
          </Layout>
        </Layout>
      </Layout>
    </ConsoleThemeContext.Provider>
  );
};

export default StandardConsoleLayout;
