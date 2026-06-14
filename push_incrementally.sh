#!/bin/bash
echo "Temporarily caching credentials for 1 hour so you don't have to type your password..."
git config credential.helper 'cache --timeout=3600'

git log origin/main..main --reverse --format="%H" | while read commit; do
  echo "Pushing $commit"
  git push origin $commit:main
  sleep 2
done
echo "All 10 commits pushed!"
