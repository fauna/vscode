import vscode from 'vscode';
import { Client, Expr, query as q } from 'faunadb';
import { runFQLQuery } from './fql';
const prettier = require('prettier/standalone');
const plugins = [require('prettier/parser-babylon')];

export default (
  secretKey: string,
  outputChannel: vscode.OutputChannel
) => async () => {
  const { activeTextEditor } = vscode.window;

  if (!activeTextEditor || activeTextEditor.document.languageId !== 'fql') {
    vscode.window.showWarningMessage(
      'You have to select a FQL document to run a FQL query.'
    );
    return;
  }

  const client = new Client({
    secret: secretKey,
    // @ts-ignore comment
    headers: {
      'X-Fauna-Source': 'VSCode'
    }
  });
  const code = activeTextEditor.document.getText();

  outputChannel.appendLine('');
  outputChannel.appendLine(`RUNNING: '${truncate(code, 25)}'`);
  outputChannel.show();

  const result = await runFQLQuery(code, client);

  outputChannel.appendLine(
    prettier
      // @ts-ignore comment
      .format(`(${Expr.toString(q.Object(result))})`, {
        parser: 'babel',
        plugins
      })
      .trim()
      .replace(/^(\({)/, '{')
      .replace(/(}\);$)/g, '}')
      .replace(';', '')
  );
};

function truncate(text: string, n: number) {
  return text.length > n ? text.substr(0, n - 1) + '...' : text;
}
