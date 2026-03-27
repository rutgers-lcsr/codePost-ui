// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

/**
 * Tool registration barrel.
 * Import this file once to register all built-in tools.
 */
import { registerTool } from './registry';
import { applyRubricTool } from './applyRubricTool';
import { createCommentTool } from './createCommentTool';
import { navigateTool } from './navigateTool';

registerTool(applyRubricTool);
registerTool(createCommentTool);
registerTool(navigateTool);
