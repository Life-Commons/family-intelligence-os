#!/bin/sh
# Run from a reviewed checkout. Requires git, tar and an authenticated GitHub CLI.
set -eu
target=${1:?Usage: new-founder-repo.sh OWNER/NEW-PRIVATE-REPO}
case "$target" in */*/*|*[!A-Za-z0-9._/-]*|/*|*/|-*) echo "Use OWNER/REPO" >&2; exit 2;; */*) :;; *) exit 2;; esac
gh auth status >/dev/null
kit=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
root=$(git -C "$kit" rev-parse --show-toplevel)
prefix=$(git -C "$kit" rev-parse --show-prefix)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
# Copy only the committed kit. Local environment files and household data never enter the new repository.
tree=HEAD
if [ -n "$prefix" ]; then tree="HEAD:${prefix%/}"; fi
git -C "$root" archive "$tree" > "$work/kit.tar"
mkdir "$work/new"
tar -xf "$work/kit.tar" -C "$work/new"
git -C "$work/new" init -q -b main
git -C "$work/new" add .
git -C "$work/new" commit -qm "Initialize family-owned Sunday Stories fieldbook"
gh repo create "$target" --private --source "$work/new" --remote origin --push
