import { animated } from 'react-spring';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

import { consoleThemes } from '../../../../styles/abstracts/_console-theme-context';

const exampleCode1 = `// Student: student@myschool.edu

// Test whether array contains an item
public boolean some(int[] x, int y) {
  boolean foundItem = false;
  for (int i = 0; i < x.length; i++) {
    if (x[i] == y) {
      foundItem = !foundItem;
    }
  }
  return foundItem;
}

/********************************************/
// Passed 1/2 Tests.
// Test 1: array = [1, 2, 3], target = 2
// PASSED
// Test 2: array = [1, 2, 2], target = 2
// FAILED'
`;

const exampleCode2 = `
/***********************************
 * Student: student@mychool.edu
 * Section: Section 1
 *
 * Description:
 *  Includes a few utility functions.
 *
 ***********************************/
public class LoopUtils {
  public static int max(int[] arr) {
    int maxSoFar = -999999;
    for (int i = 0; i < arr.length; i++) {
      if (arr[i] > maxSoFar) {
        maxSoFar = arr[i];
      }
    }
    return maxSoFar;
  }
}
 `;

const SimpleCodeBox = (props: { code: string }) => {
  return (
    <div>
      <div style={{ marginRight: '10px', maxWidth: 390, minHeight: 400, fontSize: 12 }}>
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e3e3e3',
            borderRadius: '3px',
            boxShadow: 'rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
            padding: '15px 25px 15px 15px',
            lineHeight: '20px',
          }}
        >
          <div style={{ overflowY: 'auto' }}>
            <SyntaxHighlighter
              className="simpleCodeBox"
              language={'java'}
              style={googlecode}
              showLineNumbers={true}
              wrapLines={false}
            >
              {props.code}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
};

const SimpleCodeHighlight = (props: { top: number; left: number; width: any }) => {
  return (
    <div style={{ position: 'absolute', top: props.top, left: props.left }}>
      <animated.div
        style={{ height: 20, width: props.width, background: consoleThemes.light.highlight, opacity: 0.5 }}
      />
    </div>
  );
};
export { exampleCode1, exampleCode2, SimpleCodeBox, SimpleCodeHighlight };
