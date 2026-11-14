#!/bin/sh
# Placeholder check: fails while any site page still carries placeholder text, or while
# draft review pages (the hero options) are still in the site. main is published as-is by GitHub Pages.
# Hidden placeholders (hidden data-todo) count too: they mark content still to be written.
# Run it by hand with:  sh .githooks/check-placeholders.sh
cd "$(dirname "$0")/.." || exit 2
STATUS=0

# Also catches unfilled build tokens such as the form address __FORMSPREE_ENDPOINT__ (a form that sends nothing).
PATTERN='\[to (add|confirm)[^]]*\]|\[First name\]|\[Bio[^]]*\]|\(to add\)|Draft placeholder|__[A-Z][A-Z_]*__'
FOUND=$(grep -noE "$PATTERN" -- *.html 2>/dev/null)
if [ -n "$FOUND" ]; then
  COUNT=$(printf '%s\n' "$FOUND" | wc -l | tr -d ' ')
  FILES=$(printf '%s\n' "$FOUND" | cut -d: -f1 | sort -u | tr '\n' ' ')
  echo "Placeholder check failed: $COUNT placeholder(s) still need real content, in: $FILES"
  printf '%s\n' "$FOUND" | sed 's/^/  /'
  STATUS=1
fi

# Draft review pages must not reach the live site: keep the chosen hero in index.html, delete the rest.
DRAFTS=$(ls index-?.html heroes.html assets/hero-*.css assets/hero-*.js 2>/dev/null | tr '\n' ' ')
if [ -n "$DRAFTS" ]; then
  echo "Draft check failed: hero option drafts are still in the site: $DRAFTS"
  STATUS=1
fi

[ "$STATUS" -eq 0 ] && echo "Placeholder check passed: no placeholder text or draft pages in the site."
exit $STATUS
