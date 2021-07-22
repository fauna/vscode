#!/bin/bash

set -eou pipefail

cd ./fauna-vscode-repository

apt-get update
apt-get install -y xvfb gnupg2 libxshmfence-dev libnss3-dev libatk1.0-0 libatk-bridge2.0-0 libdrm2 libgtk-3-0 libgbm-dev libasound2

export DISPLAY=':1'
Xvfb :1 -screen 0 1024x768x24 > /dev/null 2>&1 &
echo "Started Xvfb"

yarn install
yarn run compile
yarn test
