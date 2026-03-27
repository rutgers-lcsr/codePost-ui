// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

/**
 * Chat tool type definitions.
 *
 * Each tool is a self-contained unit that:
 *   1. Describes itself (name, description, icon).
 *   2. Provides a human-readable render of its arguments.
 *   3. Executes on the client side when approved by the grader.
 *
 * To add a new tool, create a file implementing `ChatTool` and
 * register it via `registerTool()` in the registry.
 */

/** Minimal file info passed to describeArgs so tools can show file names. */
export interface ToolFileInfo {
  id: number;
  name: string;
  extension: string;
}

/** Optional context passed to describeArgs for richer descriptions. */
export interface ToolDescriptionContext {
  files?: ToolFileInfo[];
}

export interface ChatTool {
  /** Unique tool name (must match the backend tool schema name). */
  name: string;

  /** Short human-readable label shown in the approval card. */
  label: string;

  /** Ant Design icon name for the tool. */
  icon: string;

  /**
   * Convert raw tool arguments into a human-readable description.
   * Shown in the ToolCallCard so the grader understands what will happen.
   */
  describeArgs: (args: Record<string, unknown>, ctx?: ToolDescriptionContext) => string;

  /**
   * Execute the tool on the client side.
   * Called after the grader approves the tool call.
   * Returns a string result that is sent back to the AI.
   */
  execute: (args: Record<string, unknown>) => Promise<string>;
}
