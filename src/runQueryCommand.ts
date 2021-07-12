import { Client, errors } from 'faunadb';
import vscode from 'vscode';
import { formatFQLCode, runFQLQuery } from './fql';
import RunAsWebviewProvider from './RunAsWebviewProvider';

export default (
  client: Client,
  outputChannel: vscode.OutputChannel,
  runAsProvider: RunAsWebviewProvider
) => async () => {
  const { activeTextEditor } = vscode.window;

  if (!activeTextEditor || activeTextEditor.document.languageId !== 'fql') {
    vscode.window.showWarningMessage(
      'You have to select a FQL document to run a FQL query.'
    );
    return;
  }

  const selection = activeTextEditor.selection;
  const selectedText = activeTextEditor.document.getText(selection);
  const fqlExpression =
    selectedText.length > 0
      ? selectedText
      : activeTextEditor.document.getText();
  if (fqlExpression.length < 1) {
    vscode.window.showWarningMessage(
      'Selected file or selected text must have a FQL query to run'
    );

    return;
  }

  const runAs = runAsProvider.role ? `( as ${runAsProvider.role} )` : '';
  outputChannel.appendLine('');
  outputChannel.appendLine(`RUNNING ${runAs}: ${fqlExpression}`);
  outputChannel.show();

  try {
    const result = await runFQLQuery(
      fqlExpression,
      client,
      runAsProvider.getSecretWithRole()
    );
    const formattedCode = formatFQLCode(result);
    outputChannel.appendLine(formattedCode);
  } catch (error) {
    let message = error.message;

    //@ts-ignore
    if (error instanceof errors.FaunaHTTPError) {
      message = JSON.stringify(error.errors(), null, 2);
    }

    outputChannel.appendLine('ERROR:');
    outputChannel.appendLine(message);
  }
};

function truncate(text: string, n: number) {
  return text.length > n ? text.substr(0, n - 1) + '...' : text;
}
