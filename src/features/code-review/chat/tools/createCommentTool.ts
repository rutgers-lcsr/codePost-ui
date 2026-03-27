// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { ChatTool, ToolDescriptionContext } from './types';
import { describeFileLocation } from './describeLocation';

/**
 * Tool: Create an inline or block comment on the student's code.
 *
 * Client-side tool — the actual comment creation is delegated to the
 * CodeConsole component via callbacks provided to the ChatPanel.
 */
export const createCommentTool: ChatTool = {
  name: 'create_inline_comment',
  label: 'Create Comment',
  icon: 'MessageOutlined',

  describeArgs(args, ctx?: ToolDescriptionContext) {
    const text = String(args.text || '').slice(0, 80);
    const pts = Number(args.point_delta || 0);
    const ptsStr = pts !== 0 ? ` (${pts > 0 ? '+' : ''}${pts} pts)` : '';
    const location = describeFileLocation(args, ctx);

    return `Add comment on ${location}: "${text}"${ptsStr}`;
  },

  async execute(_args) {
    return 'Comment created successfully.';
  },
};
