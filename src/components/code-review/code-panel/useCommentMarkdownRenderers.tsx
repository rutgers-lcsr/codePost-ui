import * as React from 'react';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

const useCommentMarkdownRenderers = () => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const blockProps = () => {
    return {
      style: {
        color: consoleTheme.text,
      },
    };
  };

  // const blockProps = (props: any) => {
  //   let isNestedBlock = false;
  //   if (
  //     topLevelChildren !== undefined &&
  //     props.parentChildCount &&
  //     topLevelChildren !== 1 &&
  //     topLevelChildren !== props.parentChildCount
  //   ) {
  //     isNestedBlock = true;
  //   }

  //   if (!isNestedBlock) {
  //     return {
  //       className: getClassName(props.index),
  //       'index-number': props.index,
  //       onMouseUp,
  //     };
  //   }
  //   return {};
  // };

  const headingRenderer = (props: any) => {
    return React.createElement(`h${props.level}`, blockProps(), props.children);
  };

  // const paragraphRenderer = (props: any) => {
  //   return (
  //     <p {...blockProps(props)} style={{ paddingTop: '6px', paddingBottom: '6px', overflowX: 'scroll' }}>
  //       {props.children}
  //     </p>
  //   );
  // };

  // const listRenderer = (props: any) => {
  //   return React.createElement(props.ordered ? 'ol' : 'ul', blockProps(props), props.children);
  // };

  // const codeRenderer = (props: any) => {

  //     return (
  //       <div {...blockProps()} style={{ marginBottom: '12px' }}>
  //         <div
  //           style={{
  //             backgroundColor: 'white',
  //             border: '1px solid black',
  //             borderRadius: '4px',
  //             fontFamily: 'monospace',
  //             padding: '4px',
  //           }}
  //         >
  //           {props.value ? props.value : ' '}
  //         </div>
  //       </div>
  //     );

  // };

  const thematicBreakRenderer = (props: any) => {
    return <hr {...blockProps()}>{props.children}</hr>;
  };

  // // @ts-ignore
  // const blockQuoteRenderer = (props: any) => {
  //   return (
  //     <div {...blockProps(props)} style={{ marginBottom: '12px' }}>
  //       <blockquote style={{ marginBottom: '0px' }}>{props.children}</blockquote>
  //     </div>
  //   );
  // };

  // const tableRenderer = (props: any) => {
  //   return (
  //     <div {...blockProps(props)} style={{ padding: '10px 10px 10px 30px', marginBottom: '12px' }}>
  //       <table className="markdown-table">{props.children}</table>
  //     </div>
  //   );
  // };

  // Parse html encountered to markdown
  // We convert all html in an input/html cell to markdown in CodePanel,
  // but some html might be put in a 'markdown' cell type. This function converts that to markdown
  // const parsedHtmlRenderer = (props: any) => {
  //   const rootRend = (propz: any) => {
  //     let isNestedBlock = false;
  //     if (
  //       topLevelChildren !== undefined &&
  //       props.parentChildCount &&
  //       topLevelChildren !== 1 &&
  //       topLevelChildren !== props.parentChildCount
  //     ) {
  //       isNestedBlock = true;
  //     }

  //     if (!isNestedBlock) {
  //       return <div {...blockProps(props)}>{propz.children}</div>;
  //     }
  //     return propz.children;
  //   };

  //   const paragraphRend = (propz: any) => {
  //     return <span>{propz.children}</span>;
  //   };

  //   // These renderers prevent console warnings about
  //   // nesting block level elements (like <p> and <div>)
  //   const renderers = {
  //     root: rootRend,
  //     paragraph: paragraphRend,
  //   };

  //   return <ReactMarkdown renderers={renderers}>{turndown.turndown(props.value)}</ReactMarkdown>;
  // };

  return {
    heading: headingRenderer,
    thematicBreak: thematicBreakRenderer,
  };
};

export default useCommentMarkdownRenderers;
