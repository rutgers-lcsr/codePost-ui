// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Student-facing course file directory: the files an instructor flipped to
// "Visible to students", with optional descriptions, inline preview, and download.
// The backend filters the list to student-visible files for students, so this
// component just renders what it gets.
import * as React from 'react';
import { Button, Card, Empty, Flex, Image, List, Modal, Skeleton, Space, Spin, Tag, Typography } from 'antd';
import { DownloadOutlined, EyeOutlined, FileOutlined } from '@ant-design/icons';
import SyntaxHighlighter from '../../lib/syntaxHighlighter';
import { googlecode } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { CourseFile } from '../../api-client';
import { useCourseFiles } from '../admin/courseFiles/queries';
import { dataBytes, dataUriMime, downloadCourseFile, formatBytes } from '../../utils/courseFiles';
import { File as CodePostFile } from '../../utils/file';

const { Text } = Typography;

// Heavy renderers load on demand (same pattern as the admin Course Files page).
const PdfPreviewLazy = React.lazy(() => import('../admin/courseFiles/CourseFilePdfPreview'));
const MarkdownLazy = React.lazy(() => import('../core/Markdown'));

const lazyFallback = (
  <Flex justify="center" style={{ padding: 40 }}>
    <Spin />
  </Flex>
);

const MARKDOWN_EXTS = new Set(['.md', '.markdown', '.rmd', '.qmd']);

const extOf = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
};

// Binary content other than images/PDFs has no inline renderer — download only.
const isPreviewable = (file: CourseFile): boolean => {
  const data = file.data ?? '';
  if (!data.startsWith('data:')) return true;
  const mime = dataUriMime(data);
  return mime.startsWith('image/') || mime === 'application/pdf';
};

const renderPreview = (file: CourseFile): React.ReactNode => {
  const data = file.data ?? '';
  if (data.startsWith('data:')) {
    const mime = dataUriMime(data);
    if (mime.startsWith('image/')) {
      return <Image src={data} alt={`Preview of ${file.name}`} style={{ maxWidth: '100%' }} />;
    }
    if (mime === 'application/pdf') {
      return (
        <React.Suspense fallback={lazyFallback}>
          <PdfPreviewLazy dataUri={data} width={640} />
        </React.Suspense>
      );
    }
    return <Text type="secondary">No preview available for this file type — use Download instead.</Text>;
  }
  if (MARKDOWN_EXTS.has(extOf(file.name))) {
    return (
      <React.Suspense fallback={lazyFallback}>
        <MarkdownLazy>{data}</MarkdownLazy>
      </React.Suspense>
    );
  }
  const extension = (file.extension || extOf(file.name)).replace(/^\./, '');
  return (
    <SyntaxHighlighter
      language={CodePostFile.language({ name: file.name, extension })}
      style={googlecode}
      showLineNumbers
      customStyle={{ margin: 0, fontSize: 13 }}
    >
      {data}
    </SyntaxHighlighter>
  );
};

interface IProps {
  courseId: number;
}

const StudentCourseFiles: React.FC<IProps> = ({ courseId }) => {
  const { data: allFiles = [], isLoading } = useCourseFiles(courseId);
  // The backend already limits real students to studentVisible files, but staff get every
  const files = React.useMemo(() => allFiles.filter((f) => !!f.studentVisible), [allFiles]);
  const [previewFile, setPreviewFile] = React.useState<CourseFile | null>(null);

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (files.length === 0) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 300 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Your instructor hasn't shared any files for this course yet."
        />
      </Flex>
    );
  }

  return (
    <Card
      title={
        <Flex align="center" gap={8}>
          <Typography.Title level={3} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Files
          </Typography.Title>
          <Tag color="blue">{files.length}</Tag>
        </Flex>
      }
      styles={{ body: { paddingTop: 0, paddingBottom: 0 } }}
    >
      <List
        itemLayout="horizontal"
        dataSource={files}
        renderItem={(file) => (
          <List.Item
            actions={[
              ...(isPreviewable(file)
                ? [
                    <Button
                      key="preview"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => setPreviewFile(file)}
                      aria-label={`Preview file: ${file.name}`}
                    >
                      Preview
                    </Button>,
                  ]
                : []),
              <Button
                key="download"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => downloadCourseFile(file)}
                aria-label={`Download file: ${file.name}`}
              >
                Download
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<FileOutlined aria-hidden style={{ fontSize: 18, color: '#198665', marginTop: 4 }} />}
              title={file.name}
              description={
                <>
                  {file.description ? <div style={{ marginBottom: 2 }}>{file.description}</div> : null}
                  <Space size={8}>
                    <Tag style={{ marginInlineEnd: 0 }}>{file.extension || '—'}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatBytes(dataBytes(file.data))}
                    </Text>
                  </Space>
                </>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title={previewFile?.name}
        open={!!previewFile}
        onCancel={() => setPreviewFile(null)}
        width={720}
        destroyOnHidden
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => previewFile && downloadCourseFile(previewFile)}
          >
            Download
          </Button>,
          <Button key="close" type="primary" onClick={() => setPreviewFile(null)}>
            Close
          </Button>,
        ]}
      >
        <div style={{ maxHeight: 480, overflow: 'auto' }}>{previewFile && renderPreview(previewFile)}</div>
      </Modal>
    </Card>
  );
};

export default StudentCourseFiles;
