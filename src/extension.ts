import * as vscode from 'vscode';
import FaunaDBSchemaProvider, { SchemaItem } from './FaunaDBSchemaProvider';
import FQLContentProvider from './FQLContentProvider';
import createRunQueryCommand from './runQueryCommand';
import createCreateQueryCommand from './createQueryCommand';
import uploadGraphqlSchemaCommand from './uploadGraphqlSchemaCommand';
import { loadConfig } from './config';
import { Client, Expr, query as q } from 'faunadb';
import DBSchemaItem from './DBSchemaItem';
import CollectionSchemaItem from './CollectionSchemaItem';

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
    const client = new Client({
      ...config,
      headers: {
        'X-Fauna-Source': 'VSCode'
      }
    });

    const mountSecret = (scope?: DBSchemaItem | CollectionSchemaItem) => {
      const database =
        scope instanceof CollectionSchemaItem ? scope.parent : scope;
      return config.secret + (database ? ':' + database.path : '') + ':admin';
    };

    // Set Schema Provider to display items on sidebar
    const faunaDBSchemaProvider = new FaunaDBSchemaProvider();

    registered.forEach(reg => reg.dispose());
    registered = [
      vscode.window.registerTreeDataProvider(
        'faunadb-databases',
        faunaDBSchemaProvider
      ),
      vscode.commands.registerCommand(
        'faunadb.runQuery',
        createRunQueryCommand(client, outputChannel)
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
      vscode.commands.registerCommand(
        'faunadb.query',
        (expr: Expr, scope?: DBSchemaItem | CollectionSchemaItem) =>
          client.query(expr, {
            secret: mountSecret(scope)
          })
      ),
      vscode.commands.registerCommand('faunadb.open', (item: SchemaItem) => {
        client
          .query<any>(item.content!, {
            secret: mountSecret(item.parent)
          })
          .then(async content => {
            const uri = vscode.Uri.parse(
              // @ts-ignore comment
              `fqlcode:${item.name}#${Expr.toString(q.Object(content))}`
            );
            const doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
            await vscode.window.showTextDocument(doc, { preview: false });
            vscode.languages.setTextDocumentLanguage(doc, 'javascript');
          })
          .catch(console.error);
      }),
      vscode.commands.registerCommand('faunadb.refreshEntry', () =>
        faunaDBSchemaProvider.refresh()
      )
    ];
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
