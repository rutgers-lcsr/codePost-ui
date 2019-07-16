import React from 'react';

import { animated } from 'react-spring';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

import { consoleThemes } from '../../../../styles/abstracts/_console-theme-context';

const exampleCode1 = `/*************************************
* Student: student@myschool.edu
* Section: Section 1
*
* Partner: none
* Partner section: N/A
*
* Description:
*   Prints 'Hello, World'.
*   This is everyone's first program.
*
*************************************/

public class homework {
  public static void main(String[] args) {
    System.out.print("Hello, World");
  }
}`;

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
            borderRadius: '5px',
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
export { SimpleCodeBox, SimpleCodeHighlight, exampleCode1, exampleCode2 };
