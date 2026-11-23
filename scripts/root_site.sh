#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="${1:-/tmp/rootsite}"
target="https://github.com/RealRaufixBaba/RealRaufixBaba.github.io.git"

rm -rf "$out"
mkdir -p "$out"
cp -a "$repo_root/docs/." "$out/"
rm -rf "$out/.git"
touch "$out/.nojekyll"

sed -i 's#https://realraufixbaba.github.io/My-Web-Page/assets/img/portrait.jpg#https://realraufixbaba.github.io/assets/img/portrait.jpg#g' "$out/index.html"

cd "$out"
git init -q
git add -A
git -c user.name="RaufixBaba" -c user.email="realraufixbaba@users.noreply.github.com" commit -qm "site"
git branch -M main
git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/RealRaufixBaba/RealRaufixBaba.github.io.git"
git push -q --force origin main
rm -rf "$out/.git"
echo "kök repoya gönderildi"
