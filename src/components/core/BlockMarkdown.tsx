import { createElement, useContext } from 'react';
import ReactMarkdown, { Components, ExtraProps } from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

interface IBlockMarkdownProps {
  source: string;
  extraRenderers?: Partial<Components>;
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

const useBlockMarkdownRenderers = (extraRenderers: Partial<Components> | undefined) => {
  const { consoleTheme } = useContext(ConsoleThemeContext);

  const blockProps = () => {
    return {
      style: {
        color: consoleTheme.text,
      },
    };
  };

  const headingRenderer = (props: any) => {
    return createElement(`h${props.level}`, blockProps(), props.children);
  };

  const linkRenderer = (props: any) => {
    return <a {...props} target="_blank" rel="noopener noreferrer" />;
  };

  const codeRenderer = (props: any) => {
    const { children, className, inline } = props;
    const language = className ? className.replace('language-', '') : '';
    const codeContent = String(children || '').replace(/\n$/, '');

    // If it's explicitly inline, or if it has no newlines and no language specified, treat as inline
    if (!codeContent || inline || (!codeContent.includes('\n') && !language)) {
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

  const inlineCodeRenderer = (
    props: React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & ExtraProps,
  ) => {
    const style = {
      backgroundColor: consoleTheme.commentCode, // #e3e3e3
      color: consoleTheme.text,
      padding: '0px 2px',
      borderRadius: '2px',
    };

    return <code style={style}>{props.children}</code>;
  };

  const thematicBreakRenderer = () => {
    return <hr {...blockProps()} />;
  };

  const ret: Components = {
    h1: (props: React.ClassAttributes<HTMLHeadingElement> & React.HTMLAttributes<HTMLHeadingElement> & ExtraProps) =>
      headingRenderer({ ...props, level: 1 }),
    h2: (props: React.ClassAttributes<HTMLHeadingElement> & React.HTMLAttributes<HTMLHeadingElement> & ExtraProps) =>
      headingRenderer({ ...props, level: 2 }),
    h3: (props: React.ClassAttributes<HTMLHeadingElement> & React.HTMLAttributes<HTMLHeadingElement> & ExtraProps) =>
      headingRenderer({ ...props, level: 3 }),
    h4: (props: React.ClassAttributes<HTMLHeadingElement> & React.HTMLAttributes<HTMLHeadingElement> & ExtraProps) =>
      headingRenderer({ ...props, level: 4 }),
    h5: (props: React.ClassAttributes<HTMLHeadingElement> & React.HTMLAttributes<HTMLHeadingElement> & ExtraProps) =>
      headingRenderer({ ...props, level: 5 }),
    h6: (props: React.ClassAttributes<HTMLHeadingElement> & React.HTMLAttributes<HTMLHeadingElement> & ExtraProps) =>
      headingRenderer({ ...props, level: 6 }),
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
