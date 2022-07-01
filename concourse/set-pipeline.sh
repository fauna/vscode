#!/bin/sh
# update the concourse pipeline with this script.

fly -t faunadb set-pipeline --pipeline vscode-extension-release --config concourse/pipeline.yml