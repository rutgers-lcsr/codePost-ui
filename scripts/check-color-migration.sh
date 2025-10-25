#!/bin/bash

# This script will help identify and fix hardcoded colors in the codebase
# Run this to see a summary of what needs to be fixed

echo "🔍 Scanning for hardcoded colors in TypeScript/TSX files..."
echo ""

# Count total occurrences
total_brand=$(grep -r "#24be85" src/components --include="*.tsx" --include="*.ts" | wc -l)
total_blue=$(grep -r "#1890ff" src/components --include="*.tsx" --include="*.ts" | wc -l)
total_red=$(grep -r "#f64852" src/components --include="*.tsx" --include="*.ts" | wc -l)
total_black=$(grep -r "#1b1b1b" src/components --include="*.tsx" --include="*.ts" | wc -l)

echo "📊 Summary:"
echo "  - #24be85 (brandPrimary): $total_brand occurrences"
echo "  - #1890ff (actionBlue): $total_blue occurrences"
echo "  - #f64852 (actionRed): $total_red occurrences"
echo "  - #1b1b1b (brandBlack): $total_black occurrences"
echo ""

echo "📁 Files needing attention:"
echo ""

# List unique files with hardcoded colors
grep -rl "#24be85\|#1890ff\|#f64852\|#1b1b1b\|#40a9ff\|#ffbf00\|#ffd129" src/components --include="*.tsx" --include="*.ts" | \
  grep -v "theme/" | \
  sort | \
  uniq | \
  while read file; do
    count=$(grep -o "#24be85\|#1890ff\|#f64852\|#1b1b1b\|#40a9ff\|#ffbf00\|#ffd129" "$file" | wc -l)
    echo "  📄 $file ($count hardcoded colors)"
  done

echo ""
echo "✅ Files already fixed:"
echo "  - src/theme/colors.ts (source of truth)"
echo "  - src/theme/index.ts"
echo "  - src/components/code-review/menu/FileMenu.tsx"
echo "  - src/components/core/CPButton.tsx"
echo "  - src/components/code-review/code-panel/CodeExecutionPanel.tsx"
echo "  - src/components/code-review/ExecuteFileButton.tsx"
echo "  - src/components/admin/assignments/tests/edit/TestDefinitions/PseudoTerminal.tsx"
echo ""
echo "💡 To fix a file:"
echo "  1. Add import: import { colors } from '@/theme/colors';"
echo "  2. Replace #24be85 → colors.brandPrimary"
echo "  3. Replace #1890ff → colors.actionBlue"
echo "  4. Replace #f64852 → colors.actionRed"
echo ""
