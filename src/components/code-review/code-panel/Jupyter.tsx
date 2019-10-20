import TurndownService from 'turndown';
import * as turndownPluginGfm from 'turndown-plugin-gfm';

const turndown = new TurndownService();
turndown.use(turndownPluginGfm.tables);

export const jupyterToMarkdown = (content: string) => {
  let markdown = '';
  const jupyterJson = JSON.parse(content);

  jupyterJson.cells.forEach((cell: any) => {
    if (cell.cell_type === 'markdown') {
      if (Array.isArray(cell.source)) {
        markdown += cell.source.join('');
      } else {
        markdown += cell.source;
      }
    }

    if (cell.cell_type === 'code') {
      markdown += '```python\n';
      if (Array.isArray(cell.source)) {
        markdown += cell.source.join('');
      } else {
        markdown += cell.source;
      }
      markdown += '\n```';

      cell.outputs.map((output: any) => {
        if (output.data) {
          Object.keys(output.data).forEach((key) => {
            switch (key) {
              case 'text/plain':
                markdown += '\n```output\n';
                markdown += output.data['text/plain'].join('');
                markdown += '\n```\n';
                break;
              case 'text/html':
                markdown += '\n';
                // Convert HTML to markdown
                markdown += turndown.turndown(output.data['text/html'].join(''));
                markdown += '\n';
                break;
              case 'image/png':
                // We need to trim the spaces on the end of the tags, or the data won't be recognized
                markdown += `\n![](data:image/png;base64,${output.data['image/png'].trim()})\n`;
                break;
            }
          });
        }
        if (output.name === 'stdout') {
          if (output.text) {
            markdown += '\n```output\n';
            if (Array.isArray(output.text)) {
              markdown += output.text
                .map((line: string) => {
                  return line.replace(']', ']\n').trim();
                })
                .join('\n');
            } else {
              markdown += output.text;
            }

            markdown += '\n```\n';
          }
        }
        if (output.output_type === 'error') {
          if (output.traceback) {
            markdown += '\n```output\nERRORS --->\n\n';
            markdown += output.traceback.join('\n');
            markdown += '\n```\n';
          }
        }
        return true;
      });
    }

    markdown += '\n\n';
  });

  return markdown;
};
