/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useEffect, useState } from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { Layout, Menu, MenuProps, Spin } from 'antd';

import { AssignmentStudent, AssignmentStudentType } from '../../infrastructure/assignment';
import { File } from '../../infrastructure/file';
import { FileType } from '../../infrastructure/types';

import ReactMarkdown from 'react-markdown';

import { Document, Page } from 'react-pdf';

import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const { Sider, Content } = Layout;

interface IProps {
  assignment?: AssignmentStudentType;
}

function ViewUpload(props: IProps) {
  const [currentIndex, setIndex] = useState('0');
  const [files, setFiles] = useState<FileType[]>([]);
  const [loadComplete, setLoadComplete] = useState(false);

  const [numPages, setNumPages] = useState<number | null>(null);

  const onDocumentLoadSuccess = (pdf: any) => {
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
          if (match.id < f.id) {
            mostRecentFiles = [...mostRecentFiles.filter((el) => el.name !== f.name), f];
          }
        }
      }
      setFiles(mostRecentFiles);
      setLoadComplete(true);
    } else {
      // Reset state variables if passed an undefined submission
      setFiles([]);
      setIndex('0');
      setLoadComplete(true);
    }
  };

  useEffect(() => {
    fetchUpload();
    // Should implement useCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.assignment]);

  const changeIndex: MenuProps['onClick'] = (e) => {
    setIndex(e.key);
  };

  if (!loadComplete) {
    return <Spin />;
  } else if (files.length === 0) {
    return <div>No files for this submission</div>;
  } else {
    let fileContent;

    if (File.codeType(files[parseInt(currentIndex, 10)]) === 'image') {
      fileContent = <ReactMarkdown>{'![](' + files[parseInt(currentIndex, 10)].code + ')'}</ReactMarkdown>;
    } else if (File.codeType(files[parseInt(currentIndex, 10)]) === 'pdf') {
      const file = files[parseInt(currentIndex, 10)];
      fileContent = (
        <div style={{ padding: '30px', textAlign: 'center' }}>
          <Document file={file.code} onLoadSuccess={onDocumentLoadSuccess}>
            {Array.from(new Array(numPages), (_, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} renderTextLayer={false} />
            ))}
          </Document>
        </div>
      );
    } else {
      fileContent = (
        <SyntaxHighlighter
          language={File.language(files[parseInt(currentIndex, 10)])}
          style={googlecode}
          showLineNumbers={true}
          wrapLines={true}
        >
          {files[parseInt(currentIndex, 10)].code}
        </SyntaxHighlighter>
      );
    }

    return (
      <div>
        <Layout>
          <Sider theme="light">
            <Menu selectedKeys={[currentIndex]} mode="inline" onClick={changeIndex}>
              {files.map((file, index) => {
                const pathName = `${file.path ? `${file.path}/` : ''}`;
                return (
                  <Menu.Item key={index.toString()} style={{ height: 'fit-content', minHeight: 40 }}>
                    <div style={{ lineHeight: pathName ? 1.5 : 3, marginTop: 4 }}>
                      <div style={{ fontSize: 10, fontStyle: 'italic', whiteSpace: 'normal' }}>{pathName}</div>
                      <div>{file.name}</div>
                    </div>
                  </Menu.Item>
                );
              })}
            </Menu>
          </Sider>
          <Content style={{ maxHeight: '70vh', overflow: 'auto' }}>{fileContent}</Content>
        </Layout>
      </div>
    );
  }
}

export default ViewUpload;
