// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Self-hosted Monaco wrapper. Import Editor/DiffEditor/etc from here, never from
 * '@monaco-editor/react' directly — that package's default loader pulls monaco from
 * the jsdelivr CDN (at whatever version it hardcodes, and blocked by our CSP),
 * while this wrapper binds it to the monaco-editor npm package we ship, with the
 * web workers bundled by Vite.
 */
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';

// monaco-editor's exports map rewrites "monaco-editor/*" to "./esm/vs/*.js".
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    switch (label) {
      case 'json':
        return new jsonWorker();
      case 'css':
      case 'scss':
      case 'less':
        return new cssWorker();
      case 'html':
      case 'handlebars':
      case 'razor':
        return new htmlWorker();
      case 'typescript':
      case 'javascript':
        return new tsWorker();
      default:
        return new editorWorker();
    }
  },
};

loader.config({ monaco });

export * from '@monaco-editor/react';
export { default } from '@monaco-editor/react';
