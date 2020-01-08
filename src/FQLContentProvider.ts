import vscode from 'vscode';
const prettier = require('prettier/standalone');
const plugins = [require('prettier/parser-babylon')];

export default class FQLContentProvider
  implements vscode.TextDocumentContentProvider {
  onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  onDidChange = this.onDidChangeEmitter.event;

  provideTextDocumentContent(uri: vscode.Uri): string {
    return prettier
      .format(`(${uri.fragment})`, {
        parser: 'babel',
        plugins
      })
      .trim()
      .replace(/^(\({)/, '{')
      .replace(/(}\);$)/g, '}')
      .replace(';', '');
  }
}
