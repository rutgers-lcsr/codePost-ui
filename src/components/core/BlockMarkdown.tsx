import * as React from "react";

import ReactMarkdown from "react-markdown";

import SyntaxHighlighter from "react-syntax-highlighter";

import { ConsoleThemeContext } from "../../styles/abstracts/_console-theme-context";

interface IBlockMarkdownProps {
  source: string;
  extraRenderers?: any;
}

const BlockMarkdown = (props: IBlockMarkdownProps) => {
  const renderers = useBlockMarkdownRenderers(props.extraRenderers);

  return <ReactMarkdown renderers={renderers} source={props.source} />;
};

const useBlockMarkdownRenderers = (extraRenderers: any) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const blockProps = () => {
    return {
      style: {
        color: consoleTheme.text
      }
    };
  };

  const headingRenderer = (props: any) => {
    return React.createElement(`h${props.level}`, blockProps(), props.children);
  };

  const linkRenderer = (props: any) => {
    return <a {...props} target="_blank" />;
  };

  const codeRenderer = (props: any) => {
    return (
      <div>
        <div
          style={{
            border: `1px solid ${consoleTheme.commentTitleBorder}`,
            borderRadius: "4px",
            backgroundColor: consoleTheme.commentCode
          }}
          className="markdown-code"
        >
          <SyntaxHighlighter
            language={props.language}
            style={consoleTheme.codeTheme}
          >
            {props.value}
          </SyntaxHighlighter>
        </div>
        <div style={{ height: "14px" }} />
      </div>
    );
  };

  const inlineCodeRenderer = (props: any) => {
    const style = {
      backgroundColor: consoleTheme.commentCode, // #e3e3e3
      color: consoleTheme.text,
      padding: "0px 2px",
      borderRadius: "2px"
    };

    return <code style={style}>{props.children}</code>;
  };

  const thematicBreakRenderer = (props: any) => {
    return <hr {...blockProps()}>{props.children}</hr>;
  };

  const ret = {
    heading: headingRenderer,
    inlineCode: inlineCodeRenderer,
    code: codeRenderer,
    thematicBreak: thematicBreakRenderer,
    link: linkRenderer
  };

  if (extraRenderers === undefined) {
    return ret;
  } else {
    return { ...ret, ...extraRenderers };
  }
};

export default BlockMarkdown;
