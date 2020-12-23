import * as vscode from 'vscode';
import FaunaDBSchemaProvider from './FaunaDBSchemaProvider';
import FQLContentProvider from './FQLContentProvider';
import createRunQueryCommand from './runQueryCommand';
import createCreateQueryCommand from './createQueryCommand';
import uploadGraphqlSchemaCommand from './uploadGraphqlSchemaCommand';
import { loadConfig } from './config';

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

  // Registered commands and providers that depend on configuration
  let registered: vscode.Disposable[] = [];

  register();

  // Reload the extension when reconfigured
  const watcher = vscode.workspace.createFileSystemWatcher('./.faunarc');
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(
      event => event.affectsConfiguration('faunadb') && register()
    ),
    watcher,
    watcher.onDidChange(register),
    watcher.onDidCreate(register),
    watcher.onDidDelete(register)
  );

  function register() {
    const config = loadConfig();

    // Set Schema Provider to display items on sidebar
    const faunaDBSchemaProvider = new FaunaDBSchemaProvider(config);

    registered.forEach(reg => reg.dispose());
    registered = [
      vscode.window.registerTreeDataProvider(
        'faunadb-databases',
        faunaDBSchemaProvider
      ),
      vscode.commands.registerCommand(
        'faunadb.runQuery',
        createRunQueryCommand(config, outputChannel)
      ),
      vscode.commands.registerCommand(
        'faunadb.createQuery',
        createCreateQueryCommand()
      ),
      vscode.commands.registerCommand(
        'faunadb.uploadGraphQLSchema',
        uploadGraphqlSchemaCommand('merge', config, outputChannel)
      ),
      vscode.commands.registerCommand(
        'faunadb.mergeGraphQLSchema',
        uploadGraphqlSchemaCommand('merge', config, outputChannel)
      ),
      vscode.commands.registerCommand(
        'faunadb.overrideGraphQLSchema',
        uploadGraphqlSchemaCommand('override', config, outputChannel)
      ),
      vscode.commands.registerCommand('faunadb.get', item => {
        item.displayInfo();
      }),
      vscode.commands.registerCommand('faunadb.refreshEntry', () =>
        faunaDBSchemaProvider.refresh()
      )
    ];
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
