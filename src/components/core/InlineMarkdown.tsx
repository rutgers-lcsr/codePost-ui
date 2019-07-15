import * as React from 'react';

import ReactMarkdown from 'react-markdown';

import remarkDisableTokenizers from 'remark-disable-tokenizers';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

interface IInlineMarkdownProps {
  source: string;
}

const InlineMarkdown = (props: IInlineMarkdownProps) => {
  const renderers = useInlineMarkdownRenderers();

  const allowedTypes = ['paragraph', 'text', 'emphasis', 'strong', 'inlineCode', 'delete', 'link', 'break'];

  return (
    <ReactMarkdown
      allowedTypes={allowedTypes}
      renderers={renderers}
      source={props.source}
      plugins={[
        [
          remarkDisableTokenizers,
          {
            block: [
              'indentedCode',
              'fencedCode',
              'blockquote',
              'atxHeading',
              'thematicBreak',
              'list',
              'setextHeading',
              'html',
              'footnote',
              'definition',
              'table',
            ],
          },
        ],
      ]}
    />
  );
};

const useInlineMarkdownRenderers = () => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const paragraphRenderer = (props: any) => {
    return <div style={{ marginBottom: '3px' }}>{props.children}</div>;
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

  return {
    paragraph: paragraphRenderer,
    inlineCode: inlineCodeRenderer,
  };
};

export default InlineMarkdown;
