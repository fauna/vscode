import * as vscode from 'vscode';
import FaunaDBSchemaProvider from './FaunaDBSchemaProvider';
import FQLContentProvider from './FQLContentProvider';
import createRunQueryCommand from './runQueryCommand';
import createCreateQueryCommand from './createQueryCommand';

export function activate(context: vscode.ExtensionContext) {
  // Set output channel to display FQL results
  const outputChannel = vscode.window.createOutputChannel('FQL');

  // Set FQL Document Content Provider
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      'fqlcode',
      new FQLContentProvider()
    )
  );

  // Check if there is a secret key
  const config = vscode.workspace.getConfiguration('faunadb');
  const secretKey = config.get<string>('secretKey');

  if (!secretKey) {
    vscode.window.showErrorMessage(
      'No FaunaDB secret key was found on Code > Preferences > Settings > Extensions > FaunaDB.'
    );
    return;
  }

  // Set Schema Provider to display items on sidebar
  const faunaDBSchemaProvider = new FaunaDBSchemaProvider(secretKey);
  vscode.window.registerTreeDataProvider(
    'faunadb-databases',
    faunaDBSchemaProvider
  );

  vscode.commands.registerCommand(
    'faunadb.runQuery',
    createRunQueryCommand(secretKey, outputChannel)
  );

  vscode.commands.registerCommand(
    'faunadb.createQuery',
    createCreateQueryCommand()
  );

  vscode.commands.registerCommand('faunadb.get', item => {
    item.displayInfo();
  });

  vscode.commands.registerCommand('faunadb.refreshEntry', () =>
    faunaDBSchemaProvider.refresh()
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
