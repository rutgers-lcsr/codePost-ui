// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { ChatTool, ToolDescriptionContext } from './types';
import { describeFileLocation } from './describeLocation';

/**
 * Tool: Apply a rubric comment to the submission.
 *
 * This is a client-side tool — it modifies the code console state
 * using the same flow as manually clicking a rubric item.
 */
export const applyRubricTool: ChatTool = {
  name: 'apply_rubric_comment',
  label: 'Apply Rubric Comment',
  icon: 'BookOutlined',

  describeArgs(args, ctx?: ToolDescriptionContext) {
    const location = describeFileLocation(args, ctx);
    return `Apply rubric comment #${args.rubric_comment_id} to ${location}`;
  },

  async execute(_args) {
    // The actual rubric application is handled by the CodeConsole component
    // via a callback passed to the ChatPanel. This stub returns a confirmation.
    // The ChatPanel component bridges this to the real rubric logic.
    return 'Rubric comment applied successfully.';
  },
};
