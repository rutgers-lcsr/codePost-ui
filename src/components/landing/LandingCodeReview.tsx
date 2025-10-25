import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import CPButton from '../core/CPButton';

import Editor, { OnMount } from '@monaco-editor/react';

import confusedStudentImg from './../../img/landing/compressed/confused_student.png';

import Comment from './landingAnimations/grade/SimpleComment';

import { CommentType } from '../../infrastructure/comment';

import { editor } from 'monaco-editor';

const dummyFunction = () => {
  return;
};

type EditorInstance = Parameters<OnMount>[0];
type MonacoNamespace = Parameters<OnMount>[1];

const highlightLines = [6, 9, 13];

const editorOptions = {
  readOnly: true,
  minimap: { enabled: false },
  wordWrap: 'on' as const,
  fontSize: 12,
  lineHeight: 24,
};

const sampleCode = [
  '// Student: james@myschool.edu ',
  '',
  '// Test whether array contains an item ',
  'public boolean some(int[] x, int y) {',
  '',
  '  boolean foundItem = false;',
  '  for (int i = 0; i < x.length; i++) {',
  '   if (x[i] == y) {',
  '     foundItem = !foundItem;',
  '   }',
  '  }',
  '',
  '  return foundItem;',
  '}',
  '',
  '/********************************************/',
  '// Passed 1/2 Tests.',
  '// Test 1: array = [1, 2, 3], target = 2',
  '// PASSED',
  '// Test 2: array = [1, 2, 2], target = 2',
  '// FAILED',
].join('\n');

const comment1: CommentType = {
  id: -1,
  startChar: 1,
  endChar: 5,
  startLine: 3,
  endLine: 3,
  pointDelta: 0,
  text: 'What about `arr` and `el` instead of x and y?',
  file: -1,
  rubricComment: null,
  feedback: 0,
  color: null,
};

const comment2: CommentType = {
  id: -2,
  startChar: 1,
  endChar: 5,
  startLine: 8,
  endLine: 8,
  pointDelta: 1,
  text: "This is why you're failing test 2. You can stop looking through the array once you've found the target!",
  file: -1,
  rubricComment: null,
  feedback: 0,
  color: null,
};

// const comment3: CommentType = {
//   id: -2,
//   startChar: 1,
//   endChar: 5,
//   startLine: 13,
//   endLine: 13,
//   pointDelta: 0,
//   text: 'You can just return `foundItem` (in fact, you can return it from within the for loop).',
//   file: -1,
//   rubricComment: null,
// };

const commentStyle = {
  boxShadow: '0 2px 10px 0 rgba(0, 0, 0, 0.11)',
  minWidth: 330,
  marginLeft: 10,
};

const CodeReview: React.FC = () => {
  const [showComments, setShowComments] = useState(true);
  const editorRef = useRef<EditorInstance | null>(null);
  const monacoRef = useRef<MonacoNamespace | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  const applyHighlights = useCallback((showHighlights: boolean) => {
    const editorInstance = editorRef.current;
    const monacoInstance = monacoRef.current;

    if (!editorInstance || !monacoInstance) {
      return;
    }

    const decorations = showHighlights
      ? highlightLines.map((line) => ({
          range: new monacoInstance.Range(line, 1, line, 1),
          options: {
            isWholeLine: true,
            className: 'landing-code-highlight-line',
          },
        }))
      : [];

    if (decorationsRef.current) {
      decorationsRef.current.set(decorations);
    } else {
      decorationsRef.current = editorInstance.createDecorationsCollection(decorations);
    }
  }, []);

  const handleEditorMount = useCallback<OnMount>(
    (editorInstance, monacoInstance) => {
      editorRef.current = editorInstance;
      monacoRef.current = monacoInstance;
      applyHighlights(showComments);
    },
    [applyHighlights, showComments],
  );

  const changeStatus = useCallback((toChange: boolean) => {
    setShowComments(toChange);
  }, []);

  useEffect(() => {
    applyHighlights(showComments);
  }, [applyHighlights, showComments]);

  useEffect(() => {
    return () => {
      decorationsRef.current?.clear();
      decorationsRef.current = null;
      editorRef.current = null;
      monacoRef.current = null;
    };
  }, []);

  const codeSample = useMemo(
    () => (
      <Editor
        height="400px"
        language="java"
        value={sampleCode}
        options={editorOptions}
        onMount={handleEditorMount}
        theme="vs-light"
      />
    ),
    [handleEditorMount],
  );

  return (
    <div
      className="module--codeReview"
      style={{
        width: 685,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 50,
      }}
    >
      <div>
        <div
          style={{
            float: 'left',
            marginBottom: 35,
            width: 335,
            maxHeight: 550,
          }}
        >
          {codeSample}
        </div>
        <div style={{ width: 350, position: 'relative', float: 'right' }}>
          <div
            style={{
              opacity: showComments ? 0 : 1,
              transition: 'opacity .3s ease',
              paddingLeft: 75,
              top: 115,
              position: 'absolute',
            }}
          >
            <img src={confusedStudentImg} width="225" alt="" />
          </div>
          <div style={{ position: 'absolute', top: 40 }}>
            <div
              style={{
                ...commentStyle,
                opacity: showComments ? 1 : 0,
                transition: 'opacity .3s ease',
                minHeight: 74,
              }}
            >
              <Comment
                commentType="readonly"
                comment={comment1}
                placement={0}
                changeActive={dummyFunction}
                onSave={dummyFunction}
                onDelete={dummyFunction}
                addUnsaved={dummyFunction}
                removeUnsaved={dummyFunction}
                removeRubricComment={dummyFunction}
                setCommentPlacements={dummyFunction}
              />
            </div>
          </div>
          <div style={{ position: 'absolute', top: 135 }}>
            <div
              style={{
                ...commentStyle,
                opacity: showComments ? 1 : 0,
                transition: 'opacity .3s ease',
                minHeight: 94,
              }}
            >
              <Comment
                commentType="readonly"
                comment={comment2}
                placement={0}
                changeActive={dummyFunction}
                onSave={dummyFunction}
                onDelete={dummyFunction}
                addUnsaved={dummyFunction}
                removeUnsaved={dummyFunction}
                removeRubricComment={dummyFunction}
                setCommentPlacements={dummyFunction}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 35,
        }}
      >
        <CPButton cpType={showComments ? 'primary' : 'secondary'} onClick={() => changeStatus(true)}>
          With code review
        </CPButton>
        &nbsp; &nbsp;
        <CPButton cpType={showComments ? 'secondary' : 'primary'} onClick={() => changeStatus(false)}>
          No code review
        </CPButton>
      </div>
    </div>
  );
};

export default CodeReview;
