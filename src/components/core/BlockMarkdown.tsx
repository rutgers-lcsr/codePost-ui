import * as React from 'react';

import ReactMarkdown from 'react-markdown';

import SyntaxHighlighter from 'react-syntax-highlighter';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

interface IBlockMarkdownProps {
  source: string;
  extraRenderers?: any;
  em?: boolean;
}

const BlockMarkdown = (props: IBlockMarkdownProps) => {
  const components = useBlockMarkdownRenderers(props.extraRenderers);

  const markdown = <ReactMarkdown components={components}>{props.source}</ReactMarkdown>;

  if (props.em) {
    return <em>{markdown}</em>;
  } else {
    return markdown;
  }
};

const useBlockMarkdownRenderers = (extraRenderers: any) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const blockProps = () => {
    return {
      style: {
        color: consoleTheme.text,
      },
    };
  };

  const headingRenderer = (props: any) => {
    return React.createElement(`h${props.level}`, blockProps(), props.children);
  };

  const linkRenderer = (props: any) => {
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return <a {...props} target="_blank" rel="noopener noreferrer" />;
  };

  const codeRenderer = (props: any) => {
    const { children, className, inline } = props;
    const language = className ? className.replace('language-', '') : '';
    const codeContent = String(children || '').replace(/\n$/, '');
    
    if (!codeContent || inline) {
      return inlineCodeRenderer(props);
    }
    
    return (
      <div>
        <div
          style={{
            border: `1px solid ${consoleTheme.commentTitleBorder}`,
            borderRadius: '4px',
            backgroundColor: consoleTheme.commentCode,
          }}
          className="markdown-code"
        >
          <SyntaxHighlighter language={language} style={consoleTheme.codeTheme}>
            {codeContent}
          </SyntaxHighlighter>
        </div>
        <div style={{ height: '14px' }} />
      </div>
    );
  };

  const inlineCodeRenderer = (props: any) => {
    const style = {
      backgroundColor: consoleTheme.commentCode, // #e3e3e3
      color: consoleTheme.text,
      padding: '0px 2px',
      borderRadius: '2px',
    };

    return <code style={style}>{props.children}</code>;
  };

  const thematicBreakRenderer = (props: any) => {
    return <hr {...blockProps()} />;
  };

  const ret = {
    h1: (props: any) => headingRenderer({ ...props, level: 1 }),
    h2: (props: any) => headingRenderer({ ...props, level: 2 }),
    h3: (props: any) => headingRenderer({ ...props, level: 3 }),
    h4: (props: any) => headingRenderer({ ...props, level: 4 }),
    h5: (props: any) => headingRenderer({ ...props, level: 5 }),
    h6: (props: any) => headingRenderer({ ...props, level: 6 }),
    code: codeRenderer,
    hr: thematicBreakRenderer,
    a: linkRenderer,
  };

  if (extraRenderers === undefined) {
    return ret;
  } else {
    return { ...ret, ...extraRenderers };
  }
};

export default BlockMarkdown;
