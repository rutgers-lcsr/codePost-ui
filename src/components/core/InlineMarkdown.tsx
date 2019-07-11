import * as React from 'react';

import ReactMarkdown from 'react-markdown';

interface IInlineMarkdownProps {
  source: string;
}

const InlineMarkdown = (props: IInlineMarkdownProps) => {
  const renderers = useInlineMarkdownRenderers();

  const allowedTypes = ['paragraph', 'text', 'emphasis', 'strong', 'inlineCode', 'delete', 'link', 'break'];

  return <ReactMarkdown allowedTypes={allowedTypes} renderers={renderers} source={props.source} />;
};

const useInlineMarkdownRenderers = () => {
  const paragraphRenderer = (props: any) => {
    return <div>{props.children}</div>;
  };

  return {
    paragraph: paragraphRenderer,
  };
};

export default InlineMarkdown;
