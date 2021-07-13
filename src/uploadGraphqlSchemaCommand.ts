import fetch from 'node-fetch';
import vscode from 'vscode';
import { Config } from './config';

export default (
  mode: string = 'merge',
  config: Config,
  outputChannel: vscode.OutputChannel
) => async () => {
  const { activeTextEditor } = vscode.window;

  const fileName = activeTextEditor?.document.fileName.split('.') || [];

  if (
    !activeTextEditor ||
    !['graphql', 'gql'].includes(fileName[fileName.length - 1])
  ) {
    vscode.window.showErrorMessage(
      'Your GraphQL schema file must include the `.graphql` or `.gql` extension.'
    );
    return;
  }

  if (activeTextEditor.document.languageId !== 'graphql') {
    vscode.window.showWarningMessage(
      'We recommend to install vscode-graphql extension for syntax highlighting, validation, and language features like go to definition, hover information and autocompletion for graphql projects'
    );
  }

  const selection = activeTextEditor.selection;
  const selectedText = activeTextEditor.document.getText(selection);
  const fqlExpression =
    selectedText.length > 0
      ? selectedText
      : activeTextEditor.document.getText();
  if (fqlExpression.length < 1) {
    vscode.window.showWarningMessage(
      'Selected file or selected text must have a GraphQL Schema to run'
    );

    return;
  }

  outputChannel.appendLine('');
  outputChannel.appendLine(
    `UPLOADING SCHEMA (mode=${mode}): ${activeTextEditor.document.fileName}`
  );
  outputChannel.show();

  try {
    const buffer = Buffer.from(fqlExpression, 'utf-8');
    const result = await fetch(`${config.graphqlHost}/import?mode=${mode}`, {
      method: 'POST',
      headers: {
        AUTHORIZATION: `Bearer ${config.secret}`
      },

      body: buffer
    });
    outputChannel.appendLine('');
    outputChannel.appendLine('RESPONSE:');
    outputChannel.appendLine(await result.text());
  } catch (error) {
    let message = error.message;
    outputChannel.appendLine('ERROR:');
    outputChannel.appendLine(message);
  }
};
