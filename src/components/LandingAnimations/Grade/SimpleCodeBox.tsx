import React from 'react';

import { animated } from 'react-spring';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

const codeString = `/*****************************************************
*  Student: student@myschool.edu
*  Section: Section 1
*
*  Partner: none
*  Partner section: N/A
*
*  Description:
*    Prints 'Hello, World' to the terminal.
*    By tradition, this is everyone's first program.
*    Brian Kernighan initiated this tradition in 1974.
*
******************************************************/

public class HelloWorld {
    public static void main(String[] args) {
        System.out.print("Hello, World");

    }
}`;

const SimpleCodeBox = () => {
  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', maxWidth: 450, justifyContent: 'flex-start' }}>
      <div style={{ flex: '0 0 600px', marginRight: '10px', maxWidth: 450, fontSize: 12 }}>
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e3e3e3',
            borderRadius: '5px',
            padding: '25px 40px 20px 20px',
            lineHeight: '20px',
          }}
        >
          <div style={{ overflowY: 'scroll' }} id="cp-grade-code-container">
            <SyntaxHighlighter language={'java'} style={googlecode} showLineNumbers={true} wrapLines={false}>
              {codeString}
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
      <animated.div style={{ height: 10, width: props.width, background: 'yellow', opacity: 0.5 }} />
    </div>
  );
};
export { SimpleCodeBox, SimpleCodeHighlight };
