#!/bin/bash

# Cleanup script for organizing codePost-ui repository
# This script helps you decide what to commit

echo "🧹 CodePost UI Repository Cleanup"
echo "=================================="
echo ""

# Create a docs directory for documentation
echo "📁 Step 1: Moving documentation files..."
mkdir -p docs/migration

# Move migration docs to docs folder
mv MODERNIZATION_*.md docs/migration/ 2>/dev/null
mv MIGRATION_*.md docs/migration/ 2>/dev/null
mv CAROUSEL_MIGRATION.md docs/migration/ 2>/dev/null
mv CODEMIRROR_DECISION.md docs/migration/ 2>/dev/null
mv REACT_ROUTER_VERSION_FIX.md docs/migration/ 2>/dev/null
mv PEER_DEPENDENCY_FIX.md docs/migration/ 2>/dev/null
mv ANT_DESIGN_CSS_FIX.md docs/migration/ 2>/dev/null
mv SASS_DEPRECATION_FIX.md docs/migration/ 2>/dev/null
mv MARKDOWN_*.md docs/migration/ 2>/dev/null
mv MISSING_DEPENDENCIES_FIX.md docs/migration/ 2>/dev/null
mv INSTALL_*.md docs/migration/ 2>/dev/null
mv FINAL_STATUS.md docs/migration/ 2>/dev/null
mv QUICK_REFERENCE.md docs/migration/ 2>/dev/null

# Move Docker docs
mv DOCKER.md docs/ 2>/dev/null
mv README_MODERN.md docs/ 2>/dev/null

echo "✅ Documentation moved to docs/"
echo ""

# List what would be committed
echo "📋 Step 2: Files ready for commit:"
echo ""
echo "=== Modified Core Files ==="
git status --short | grep "^ M" | grep -E "(package\.json|tsconfig\.json|Dockerfile)"

echo ""
echo "=== New Configuration Files ==="
git status --short | grep "^??" | grep -E "(vite\.config\.ts|vitest\.config\.ts|\.eslintrc\.cjs|\.dockerignore|tsconfig\.node\.json|index\.html)"

echo ""
echo "=== New Source Files ==="
git status --short | grep "^??" | grep -E "src/.*(\.ts|\.tsx)$"

echo ""
echo "=== Modified Source Files (showing count) ==="
echo "Total modified: $(git status --short | grep '^ M src/' | wc -l) files"

echo ""
echo "📝 Step 3: Suggested commit strategy:"
echo ""
echo "Option 1: Single commit"
echo "  git add ."
echo "  git commit -m 'Modernize codePost-ui: React 18, Vite, updated components'"
echo ""
echo "Option 2: Organized commits"
echo "  # Config files"
echo "  git add vite.config.ts vitest.config.ts tsconfig.json tsconfig.node.json .eslintrc.cjs"
echo "  git commit -m 'Add Vite and modern tooling configuration'"
echo ""
echo "  # Docker updates"
echo "  git add Dockerfile .dockerignore nginx.conf.new"
echo "  git commit -m 'Update Docker configuration for Vite build'"
echo ""
echo "  # Component updates"
echo "  git add src/"
echo "  git commit -m 'Update components: fix React warnings, modernize patterns'"
echo ""
echo "  # Package updates"
echo "  git add package.json package-lock.json"
echo "  git commit -m 'Update dependencies: React 18, modern packages'"
echo ""
echo "  # Documentation"
echo "  git add docs/"
echo "  git commit -m 'Add migration and setup documentation'"
echo ""

echo "🗑️  Step 4: Optional cleanup"
echo ""
echo "Files you might want to remove:"
echo "  - MIGRATION_EXAMPLES.tsx (example file, not needed in repo)"
echo "  - nginx.conf.new (backup file)"
echo "  - src/__tests__/files/python.py (if not needed)"
echo ""
echo "To remove:"
echo "  rm MIGRATION_EXAMPLES.tsx nginx.conf.new"
echo ""

echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "  1. Review the files: git status"
echo "  2. Choose your commit strategy (see above)"
echo "  3. Make your commit(s)"
