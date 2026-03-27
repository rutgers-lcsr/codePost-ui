// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { ChatTool } from './types';

/**
 * Tool registry for the chat panel.
 *
 * Adding a new tool:
 *   1. Create a file implementing `ChatTool` (see `types.ts`).
 *   2. Import it here and call `registerTool(myTool)`.
 *   3. That's it — the chat panel will automatically show approval cards
 *      for tool calls matching the registered name.
 */

const tools = new Map<string, ChatTool>();

export function registerTool(tool: ChatTool): void {
  tools.set(tool.name, tool);
}

export function getTool(name: string): ChatTool | undefined {
  return tools.get(name);
}

export function getAllTools(): ChatTool[] {
  return Array.from(tools.values());
}

export function hasTool(name: string): boolean {
  return tools.has(name);
}
