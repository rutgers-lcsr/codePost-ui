// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Monaco-backed contents editor for the Course Files modal. Loaded via React.lazy so the
// admin page only pulls the monaco-vendor chunk when a text file is opened. Fully
// controlled (value/onChange) so it drops straight into an antd Form.Item.
import * as React from 'react';
import Editor from '../../../lib/monaco';
import CodeEditorTabHint from '../../core/CodeEditorTabHint';
import { File as CodePostFile } from '../../../utils/file';

interface IProps {
  value?: string;
  onChange?: (value: string) => void;
  /** Filename the syntax-highlighting language is derived from. */
  name: string;
  height?: number;
}

// lang-map names are valid Monaco ids for the common cases; fix up the ones that differ
// (same approach as AssignmentFilesForm.getCodingLanguage). Unknown ids fall back to
// plain text inside Monaco, so an incomplete mapping only costs highlighting.
const monacoLanguageFor = (filename: string): string => {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return 'plaintext';
  const extension = filename.slice(dot + 1).toLowerCase();
  const lang = CodePostFile.language({ name: filename, extension });
  if (lang === 'c++') return 'cpp';
  return lang || 'plaintext';
};

const CourseFileEditor: React.FC<IProps> = ({ value, onChange, name, height = 360 }) => (
  <div>
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      <Editor
        height={`${height}px`}
        language={monacoLanguageFor(name)}
        value={value ?? ''}
        onChange={(v) => onChange?.(v ?? '')}
        theme="vs-dark"
        options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 8 } }}
      />
    </div>
    {/* WCAG 2.1.2 advisory — Tab is trapped inside Monaco; tell users the way out. */}
    <CodeEditorTabHint />
  </div>
);

export default CourseFileEditor;
