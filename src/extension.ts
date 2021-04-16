import * as vscode from 'vscode';
import createCreateQueryCommand from './createQueryCommand';
import FaunaSchemaProvider from './FaunaSchemaProvider';
import FQLContentProvider from './FQLContentProvider';
import createRunQueryCommand from './runQueryCommand';
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
      event => event.affectsConfiguration('fauna') && register()
    ),
    watcher,
    watcher.onDidChange(register),
    watcher.onDidCreate(register),
    watcher.onDidDelete(register)
  );

  function register() {
    const config = loadConfig();

    // Set Schema Provider to display items on sidebar
    const faunaSchemaProvider = new FaunaSchemaProvider(config);

    registered.forEach(reg => reg.dispose());
    registered = [
      vscode.window.registerTreeDataProvider(
        'fauna-databases',
        faunaSchemaProvider
      ),
      vscode.commands.registerCommand(
        'fauna.runQuery',
        createRunQueryCommand(config, outputChannel)
      ),
      vscode.commands.registerCommand(
        'fauna.createQuery',
        createCreateQueryCommand()
      ),
      vscode.commands.registerCommand(
        'fauna.uploadGraphQLSchema',
        uploadGraphqlSchemaCommand('merge', config, outputChannel)
      ),
      vscode.commands.registerCommand(
        'fauna.mergeGraphQLSchema',
        uploadGraphqlSchemaCommand('merge', config, outputChannel)
      ),
      vscode.commands.registerCommand(
        'fauna.overrideGraphQLSchema',
        uploadGraphqlSchemaCommand('override', config, outputChannel)
      ),
      vscode.commands.registerCommand('fauna.get', item => {
        item.displayInfo();
      }),
      vscode.commands.registerCommand('fauna.refreshEntry', () =>
        faunaSchemaProvider.refresh()
      )
    ];
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
