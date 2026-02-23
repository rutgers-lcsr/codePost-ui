// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
export interface ITestPreviewItem {
  id: string;
  description: string; // The "Title" (from name arg)
  explanation: string; // The "Body" (from description kwarg)
  points: number;
  timeout?: number;
  functionName: string;
}

/**
 * Parses Python/IPynb code to extract test definitions.
 * Matches backend logic:
 * - 1st Positional Arg -> Name (Title)
 * - `name` kwarg -> Name (Title)
 * - `description` kwarg -> Description (Body/Explanation)
 */
export const parsePythonTests = (code: string): ITestPreviewItem[] => {
  const items: ITestPreviewItem[] = [];
  if (!code) return items;

  // Split code into lines for easier processing if needed, but regex creates matches on full text
  // We need a regex that captures the decorator and the function definition

  // Regex breakdown:
  // @test\s*\(  -> Start of decorator
  // (.*?)       -> Capture content inside parens (non-greedy)
  // \)\s*       -> End of decorator
  // \n\s*def\s+ -> Start of function def
  // (\w+)       -> Capture function name

  const decoratorRegex = /@test\s*\(([\s\S]*?)\)\s*\n\s*def\s+(\w+)/g;

  let match;
  while ((match = decoratorRegex.exec(code)) !== null) {
    const paramsString = match[1];
    const functionName = match[2];

    // Defaults
    let title = functionName; // Default title is function name
    let body = '';
    let points = 0;
    let timeout: number | undefined = undefined;

    // Parse params
    // This is tricky with regex because of quotes and commas.
    // Simple approach: Split by comma, but respect quotes.

    // Helper to extract args
    const args: string[] = [];
    let currentArg = '';
    let inQuote: string | null = null;

    for (let i = 0; i < paramsString.length; i++) {
      const char = paramsString[i];

      if (inQuote) {
        if (char === inQuote && paramsString[i - 1] !== '\\') {
          inQuote = null;
        }
        currentArg += char;
      } else {
        if (char === '"' || char === "'") {
          inQuote = char;
          currentArg += char;
        } else if (char === ',') {
          args.push(currentArg.trim());
          currentArg = '';
        } else {
          currentArg += char;
        }
      }
    }
    if (currentArg.trim()) args.push(currentArg.trim());

    // Process parsed args
    args.forEach((arg, index) => {
      // Check for keyword arg
      if (arg.includes('=')) {
        const [key, ...valParts] = arg.split('=');
        const cleanKey = key.trim();
        const val = valParts.join('=').trim(); // Rejoin in case value has =

        // Helper to strip quotes
        const stripQuotes = (s: string) => s.replace(/^['"]|['"]$/g, '');

        if (cleanKey === 'points') {
          points = parseFloat(val) || 0;
        } else if (cleanKey === 'description') {
          body = stripQuotes(val);
        } else if (cleanKey === 'name') {
          title = stripQuotes(val);
        } else if (cleanKey === 'timeout') {
          timeout = parseFloat(val);
        }
      } else if (index === 0) {
        // First positional arg is Name (Title)
        const stripQuotes = (s: string) => s.replace(/^['"]|['"]$/g, '');
        title = stripQuotes(arg);
      }
    });

    // Humanize title if it's still just the function name
    if (title === functionName) {
      title = functionName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    items.push({
      id: functionName, // Use function name as ID for preview
      functionName,
      description: title,
      explanation: body,
      points,
      timeout,
    });
  }

  return items;
};
