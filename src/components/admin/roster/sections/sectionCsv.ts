// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

/**
 * Parser for the sections CSV import.
 *
 * Format: `section,email[,role]` (comma or tab delimited, optional header). The third
 * column is optional — `leader` / `ta` / `grader` marks the row's email as a section
 * leader; anything else (or absent) means student, so legacy two-column files parse
 * exactly as before.
 */
export interface ParsedSectionRow {
  section: string;
  students: string[];
  leaders: string[];
}

const LEADER_ROLES = new Set(['leader', 'ta', 'grader']);

export function parseSectionsCsv(text: string): ParsedSectionRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  // A data line always carries an email address; a header never does. The @ check keeps a
  // first data row like "S01,student@x.edu,student" from being misread as a header.
  const hasHeader =
    !firstLine.includes('@') &&
    (firstLine.includes('section') || firstLine.includes('student') || firstLine.includes('email'));
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const delimiter = lines[0].includes('\t') ? '\t' : ',';

  const sections: Record<string, { students: Set<string>; leaders: Set<string> }> = {};

  for (const line of dataLines) {
    const parts = line.split(delimiter).map((p) => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 2) continue;
    const sectionName = parts[0];
    const email = parts[1].toLowerCase();
    if (!sectionName || !email || !email.includes('@')) continue;

    if (!sections[sectionName]) sections[sectionName] = { students: new Set(), leaders: new Set() };
    const role = (parts[2] ?? '').trim().toLowerCase();
    if (LEADER_ROLES.has(role)) sections[sectionName].leaders.add(email);
    else sections[sectionName].students.add(email);
  }

  return Object.entries(sections).map(([section, { students, leaders }]) => ({
    section,
    students: [...students],
    leaders: [...leaders],
  }));
}
