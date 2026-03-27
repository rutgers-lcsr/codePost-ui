// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { ToolDescriptionContext, ToolFileInfo } from './types';

const JUPYTER_EXTS = ['ipynb', '.ipynb'];
const PDF_EXTS = ['pdf', '.pdf'];

function normalizeExt(ext: string): string {
  return ext.startsWith('.') ? ext.slice(1).toLowerCase() : ext.toLowerCase();
}

/**
 * Resolve a file ID to a display name like "A1sub.py".
 * Falls back to "file #<id>" when no context is available.
 */
export function resolveFileName(fileId: number, ctx?: ToolDescriptionContext): string {
  if (!ctx?.files) return `file #${fileId}`;
  const file = ctx.files.find((f) => f.id === fileId);
  if (!file) return `file #${fileId}`;
  if (!file.extension) return file.name;
  const ext = file.extension.startsWith('.') ? file.extension : `.${file.extension}`;
  // Avoid doubling the extension if name already includes it
  return file.name.toLowerCase().endsWith(ext.toLowerCase()) ? file.name : `${file.name}${ext}`;
}

function resolveFile(fileId: number, ctx?: ToolDescriptionContext): ToolFileInfo | undefined {
  return ctx?.files?.find((f) => f.id === fileId);
}

/**
 * Produce a human-friendly location string given the standard tool args
 * (file_id, start_line, end_line, start_char, end_char).
 *
 * Adapts the description based on file type:
 *  - Notebooks (.ipynb): "A1sub.ipynb, cell 3"
 *  - PDFs (.pdf):        "report.pdf, page 2"
 *  - Code files:         "main.py, line 25" or "main.py, lines 25–30"
 */
export function describeFileLocation(args: Record<string, unknown>, ctx?: ToolDescriptionContext): string {
  const fileId = Number(args.file_id);
  const file = resolveFile(fileId, ctx);
  const fileName = resolveFileName(fileId, ctx);
  const ext = normalizeExt(file?.extension || '');

  const startLine = args.start_line != null ? Number(args.start_line) : args.line != null ? Number(args.line) : null;
  const endLine = args.end_line != null ? Number(args.end_line) : startLine;
  const startChar = args.start_char != null ? Number(args.start_char) : null;
  const endChar = args.end_char != null ? Number(args.end_char) : null;
  const hasChars = startChar != null && endChar != null && (startChar !== 0 || endChar !== 0);

  if (JUPYTER_EXTS.includes(ext)) {
    // For notebooks, "lines" correspond to cells
    if (startLine != null) {
      const cells = startLine === endLine ? `cell ${startLine}` : `cells ${startLine}–${endLine}`;
      if (hasChars) return `${fileName}, ${cells}, chars ${startChar}–${endChar}`;
      return `${fileName}, ${cells}`;
    }
    return fileName;
  }

  if (PDF_EXTS.includes(ext)) {
    // For PDFs, "lines" correspond to pages
    if (startLine != null) {
      return startLine === endLine ? `${fileName}, page ${startLine}` : `${fileName}, pages ${startLine}–${endLine}`;
    }
    return fileName;
  }

  // Code / text files — use line + column numbers
  if (startLine != null) {
    const lines = startLine === endLine ? `line ${startLine}` : `lines ${startLine}–${endLine}`;
    if (hasChars) return `${fileName}, ${lines}, cols ${startChar}–${endChar}`;
    return `${fileName}, ${lines}`;
  }

  return fileName;
}
