#!/bin/sh

set -eou

cd ./fauna-vscode-repository

apk add --no-cache git

yarn install
yarn run compile

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
echo "Current package version: $PACKAGE_VERSION"

echo "Publishing a new version..."
yarn run vsce publish
