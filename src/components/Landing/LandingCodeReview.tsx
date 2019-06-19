import * as React from 'react';

import CPButton from '../core/CPButton';

import * as CodeMirror from 'react-codemirror';

import 'codemirror/mode/javascript/javascript';

import Comment from '../code-review/code-panel/Comment';

import { CommentType } from '../../infrastructure/comment';

const badCodeMirror = (classModifier?: string) => (
  <CodeMirror
    key={'bad code'}
    className={`bad-codemirror ${classModifier}`}
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
  // Return finding \n\
  if (foundItem) {\n\
    return true;\n\
  } else {\n\
    return false;\n\
  }\n\
}\n\n\
/*************************************/\n\
// Passed 1/2 Tests.\n\
// Test 1: array = [1, 2, 3], target = 2\n\
// PASSED\n\
// Test 2: array = [1, 2, 2], target = 2\n\
// FAILED\n'
    }
    options={{ lineNumbers: true, readOnly: true, lineWrapping: true, mode: 'javascript' }}
  />
);

const comment1: CommentType = {
  id: -1,
  startChar: 1,
  endChar: 5,
  startLine: 2,
  endLine: 2,
  pointDelta: 1,
  text: 'What about arr and el instead of x and y?',
  file: -1,
  rubricComment: null,
};

const comment2: CommentType = {
  id: -2,
  startChar: 1,
  endChar: 5,
  startLine: 7,
  endLine: 7,
  pointDelta: 1,
  text: "This is why you're failing test 2. You can stop looking through the array once you've found the target!",
  file: -1,
  rubricComment: null,
};

const comment3: CommentType = {
  id: -2,
  startChar: 1,
  endChar: 5,
  startLine: 13,
  endLine: 19,
  pointDelta: 1,
  text: 'You can just return foundItem (in fact, you can return it from within the for loop).',
  file: -1,
  rubricComment: null,
};

const dummyFunction = () => {
  return;
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

  public render() {
    return (
      <div style={{ width: 625 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 15 }}>
          <CPButton cpType="primary" onClick={this.changeStatus.bind(this, true)}>
            With code review
          </CPButton>
          &nbsp; &nbsp;
          <CPButton cpType="secondary" onClick={this.changeStatus.bind(this, false)}>
            No code review
          </CPButton>
        </div>
        <div style={{ float: 'left', marginBottom: 12, width: 325 }}>
          {badCodeMirror(this.state.showComments ? 'thin' : 'wide')}
        </div>
        {this.state.showComments ? (
          <div style={{ width: 300, position: 'relative', float: 'right' }}>
            <Comment
              commentType="readonly"
              comment={comment1}
              placement={30}
              changeActive={dummyFunction}
              onSave={dummyFunction}
              onDelete={dummyFunction}
              addUnsaved={dummyFunction}
              removeUnsaved={dummyFunction}
              removeRubricComment={dummyFunction}
              setCommentPlacements={dummyFunction}
            />
            <Comment
              commentType="readonly"
              comment={comment2}
              placement={115}
              changeActive={dummyFunction}
              onSave={dummyFunction}
              onDelete={dummyFunction}
              addUnsaved={dummyFunction}
              removeUnsaved={dummyFunction}
              removeRubricComment={dummyFunction}
              setCommentPlacements={dummyFunction}
            />
            <Comment
              commentType="readonly"
              comment={comment3}
              placement={260}
              changeActive={dummyFunction}
              onSave={dummyFunction}
              onDelete={dummyFunction}
              addUnsaved={dummyFunction}
              removeUnsaved={dummyFunction}
              removeRubricComment={dummyFunction}
              setCommentPlacements={dummyFunction}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

export default CodeReview;
