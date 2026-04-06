// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useContext, useEffect, useMemo, useState, type CSSProperties } from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { Layout, Menu, MenuProps, Spin } from 'antd';

import { AssignmentStudent } from '../../services/assignment';
import type { AssignmentStudentType } from '../../types/models';
import { File, getFileContent } from '../../utils/file';
import type { FileType } from '../../utils/file';

import ReactMarkdown from 'react-markdown';

import { Document, Page } from 'react-pdf';

import { pdfjs } from 'react-pdf';
import { FileOutlined } from '@ant-design/icons';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const { Sider, Content } = Layout;

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context.js';
import Markdown from '../../features/code-review/code-panel/Markdown';
import { CURSOR_DOMAIN } from '../../features/code-review/CodeConsoleEnums';
import styles from './StudentConsole.module.scss';

interface IProps {
  assignment?: AssignmentStudentType;
}

function ViewUpload(props: IProps) {
  const { consoleTheme } = useContext(ConsoleThemeContext);
  const [currentIndex, setIndex] = useState('0');
  const [files, setFiles] = useState<FileType[]>([]);
  const [loadComplete, setLoadComplete] = useState(false);

  const [numPages, setNumPages] = useState<number | null>(null);

  const syntaxHighlightTheme = useMemo(() => consoleTheme.codeTheme ?? googlecode, [consoleTheme]);

  const onDocumentLoadSuccess = (pdf: { numPages: number }) => {
    setNumPages(pdf.numPages);
  };

  const fetchUpload = async () => {
    if (props.assignment) {
      const data = await AssignmentStudent.readStudentUpload(props.assignment.id);
      let mostRecentFiles: FileType[] = [];
      const readFiles = data.files as FileType[];
      for (const f of readFiles) {
        const match = mostRecentFiles.find((el) => el.name === f.name);
        if (!match) {
          mostRecentFiles.push(f);
        } else {
          if ((match.id ?? 0) < (f.id ?? 0)) {
            mostRecentFiles = [...mostRecentFiles.filter((el) => el.name !== f.name), f];
          }
        }
      }
      setFiles(mostRecentFiles);
      setIndex('0');
      setNumPages(null);
      setLoadComplete(true);
    } else {
      // Reset state variables if passed an undefined submission
      setFiles([]);
      setIndex('0');
      setNumPages(null);
      setLoadComplete(true);
    }
  };

  useEffect(() => {
    fetchUpload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.assignment]);

  const changeIndex: MenuProps['onClick'] = (e) => {
    setIndex(e.key);
    setNumPages(null);
  };

  if (!loadComplete) {
    return <Spin />;
  }

  if (files.length === 0) {
    return <div className={styles.viewUploadEmpty}>No files for this submission</div>;
  }

  const activeIndex = Math.min(Math.max(parseInt(currentIndex, 10) || 0, 0), files.length - 1);
  const activeFile = files[activeIndex];
  const activeFileType = File.codeType(activeFile);

  let fileContent: React.ReactNode;

  if (activeFileType === 'image') {
    fileContent = <ReactMarkdown>{'![](' + getFileContent(activeFile) + ')'}</ReactMarkdown>;
  } else if (activeFileType === 'pdf') {
    fileContent = (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Document file={getFileContent(activeFile)} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from({ length: numPages ?? 0 }, (_, index) => (
            <Page key={`page_${index + 1}`} pageNumber={index + 1} renderTextLayer={false} />
          ))}
        </Document>
      </div>
    );
  } else if (activeFileType === 'jupyter') {
    fileContent = (
      <Markdown
        file={activeFile}
        comments={[]}
        readOnly={true}
        user=""
        onHighlightClick={() => {}}
        commentCounter={0}
        addComment={() => {}}
        cursorMode={false}
        showCursor={CURSOR_DOMAIN.CODE_HIDDEN}
        updateCursorDomain={() => {}}
        isEditMode={false}
        onContentChange={() => {}}
      />
    );
  } else {
    fileContent = (
      <SyntaxHighlighter
        language={File.language(activeFile)}
        style={syntaxHighlightTheme}
        showLineNumbers={true}
        wrapLines={true}
        customStyle={{
          backgroundColor: consoleTheme.codeBg,
          borderRadius: '8px',
          padding: '16px',
          margin: 0,
        }}
      >
        {getFileContent(activeFile)}
      </SyntaxHighlighter>
    );
  }

  const borderColor = consoleTheme.codeBorder ?? '#f0f0f0';
  const selectedKey = activeIndex.toString();

  const layoutStyle: CSSProperties = {
    backgroundColor: consoleTheme.mainBg,
    color: consoleTheme.text,
    borderRadius: 'var(--sc-radius-lg, 14px)',
    overflow: 'hidden',
    border: '1px solid var(--sc-border, #E8E3DC)',
    boxShadow: 'var(--sc-shadow-lg, 0 8px 24px rgba(45, 42, 38, 0.08))',
  };

  const siderStyle: CSSProperties = {
    backgroundColor: 'var(--sc-warm-bg, #FAF8F5)',
    borderRight: `1px solid var(--sc-border-light, ${borderColor})`,
    paddingTop: 0,
  };

  const headerStyle: CSSProperties = {
    padding: '16px 20px',
    fontFamily: 'var(--sc-font-body, "Plus Jakarta Sans", system-ui, sans-serif)',
    fontSize: 'var(--sc-text-sm, 13px)',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--sc-ink-muted, #78736A)',
    borderBottom: '1px solid var(--sc-border-light, #F0EBE4)',
  };

  const menuStyle: CSSProperties = {
    backgroundColor: 'transparent',
    borderInlineEnd: 'none',
    fontFamily: 'var(--sc-font-body, "Plus Jakarta Sans", system-ui, sans-serif)',
  };

  const contentStyle: CSSProperties = {
    backgroundColor: consoleTheme.codeBg,
    padding: '24px',
    maxHeight: '70vh',
    overflow: 'auto',
    fontFamily: 'var(--sc-font-mono, "JetBrains Mono", monospace)',
  };

  const menuItems: MenuProps['items'] = files.map((file, index) => {
    const key = index.toString();
    const isActive = key === selectedKey;
    const pathName = file.path ? `${file.path}/` : '';
    const itemColor = isActive ? consoleTheme.commentTitleText : 'var(--sc-ink-secondary, #5C574F)';
    const helperTextColor = isActive ? consoleTheme.commentTitleText : 'var(--sc-ink-muted, #78736A)';

    return {
      key,
      icon: <FileOutlined style={{ color: itemColor }} />,
      style: {
        margin: '4px 12px',
        borderRadius: 'var(--sc-radius-sm, 6px)',
        backgroundColor: isActive ? 'var(--sc-warm-elevated, #F5F1EC)' : 'transparent',
        color: itemColor,
        transition: 'background-color 0.2s ease, color 0.2s ease',
      },
      label: (
        <div style={{ lineHeight: 1.3 }}>
          {pathName && <div style={{ fontSize: 11, color: helperTextColor }}>{pathName}</div>}
          <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'normal', color: itemColor }}>{file.name}</div>
        </div>
      ),
    };
  });

  return (
    <Layout style={layoutStyle} hasSider>
      <Sider width={260} style={siderStyle} theme="light">
        <div style={headerStyle}>Submitted Files</div>
        <Menu mode="inline" selectedKeys={[selectedKey]} onClick={changeIndex} items={menuItems} style={menuStyle} />
      </Sider>
      <Content style={contentStyle}>{fileContent}</Content>
    </Layout>
  );
}

export default ViewUpload;
