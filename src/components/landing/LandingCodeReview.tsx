import * as React from 'react';

import CPButton from '../core/CPButton';

// import * as CodeMirror from 'react-codemirror';

import { Controlled as CodeMirror } from 'react-codemirror2';

import 'codemirror/mode/javascript/javascript';

import confusedStudentImg from './../../img/landing/compressed/confused_student.png';

import Comment from './landingAnimations/grade/SimpleComment';

import { CommentType } from '../../infrastructure/comment';

const dummyFunction = () => {
  return;
};
// @ts-ignore
let instance: CodeMirror.Editor | null = null;
// @ts-ignore
const setEditor = (editor: CodeMirror.Editor) => {
  instance = editor;
};

const badCodeMirror = (
  <CodeMirror
    key={'bad code'}
    className="bad-codemirror"
    editorDidMount={setEditor}
    onBeforeChange={dummyFunction}
    value={
      '// Student: james@myschool.edu \n\
      \n\
// Test whether array contains an item \n\
public boolean some(int[] x, int y) {\n\n\
  boolean foundItem = false;\n\
  for (int i = 0; i < x.length; i++) {\n\
   if (x[i] == y) {\n\
     foundItem = !foundItem;\n\
   }\n\
  }\n\n\
  return foundItem;\n\
}\n\n\
/********************************************/\n\
// Passed 1/2 Tests.\n\
// Test 1: array = [1, 2, 3], target = 2\n\
// PASSED\n\
// Test 2: array = [1, 2, 2], target = 2\n\
// FAILED'
    }
    options={{
      lineNumbers: true,
      readOnly: true,
      lineWrapping: true,
      mode: 'javascript',
    }}
  />
);

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

interface IState {
  showComments: boolean;
}

class CodeReview extends React.Component<{}, IState> {
  public constructor(props: {}) {
    super(props);
    this.state = {
      showComments: true,
    };
  }

  public changeStatus = (toChange: boolean) => {
    this.setState({ showComments: toChange });
  };

  // @ts-ignore
  public setMarkings = (codeMirrorInstance: CodeMirror.Editor | null) => {
    if (codeMirrorInstance) {
      const css = this.state.showComments
        ? 'background: rgba(211,242,231, 1); padding: 3px 0px 3px 0px;'
        : 'background: rgba(211,242,231, 0)';
      const markings = [
        { startLine: 3, startCh: 20, endLine: 3, endCh: 34 },
        { startLine: 8, startCh: 5, endLine: 8, endCh: 28 },
        { startLine: 13, startCh: 2, endLine: 13, endCh: 18 },
      ];
      markings.forEach((marking: any) => {
        codeMirrorInstance.getDoc().markText(
          {
            line: marking.startLine,
            ch: marking.startCh,
          },
          {
            line: marking.endLine,
            ch: marking.endCh,
          },
          {
            css,
          },
        );
      });
    }
  };

  public componentDidMount() {
    this.setMarkings(instance);
  }

  public render() {
    this.setMarkings(instance);
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
            {badCodeMirror}
          </div>
          <div style={{ width: 350, position: 'relative', float: 'right' }}>
            <div
              style={{
                opacity: this.state.showComments ? 0 : 1,
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
                  opacity: this.state.showComments ? 1 : 0,
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
                  opacity: this.state.showComments ? 1 : 0,
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
          <CPButton
            cpType={this.state.showComments ? 'primary' : 'secondary'}
            onClick={this.changeStatus.bind(this, true)}
          >
            With code review
          </CPButton>
          &nbsp; &nbsp;
          <CPButton
            cpType={this.state.showComments ? 'secondary' : 'primary'}
            onClick={this.changeStatus.bind(this, false)}
          >
            No code review
          </CPButton>
        </div>
      </div>
    );
  }
}

export default CodeReview;
