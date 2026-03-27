// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { ChatTool, ToolDescriptionContext } from './types';
import { resolveFileName } from './describeLocation';

/**
 * Tool: Navigate to a specific file and line in the code viewer.
 *
 * Client-side tool — sets the selected file and scroll position.
 */
export const navigateTool: ChatTool = {
  name: 'navigate_to_location',
  label: 'Navigate to Code',
  icon: 'AimOutlined',

  describeArgs(args, ctx?: ToolDescriptionContext) {
    const fileName = resolveFileName(Number(args.file_id), ctx);
    return `Navigate to ${fileName}, line ${args.line}`;
  },

  async execute(args) {
    // Navigation is handled by the ChatPanel through the code console store.
    // The store's setSelectedFile + scroll logic is invoked from the component layer.
    return `Navigated to file #${args.file_id}, line ${args.line}.`;
  },
};
