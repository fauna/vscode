import { Client, Expr, query as q } from 'faunadb';
import * as vscode from 'vscode';
import CollectionSchemaItem from './CollectionSchemaItem';
import { loadConfig } from './config';
import createCreateQueryCommand from './createQueryCommand';
import DBSchemaItem from './DBSchemaItem';
import FaunaSchemaProvider, { SchemaItem } from './FaunaSchemaProvider';
import FQLContentProvider from './FQLContentProvider';
import RunAsWebviewProvider from './RunAsWebviewProvider';
import createRunQueryCommand from './runQueryCommand';
import uploadGraphqlSchemaCommand from './uploadGraphqlSchemaCommand';

const config = loadConfig();
const client = new Client({
  secret: config.secret,
  domain: config.domain,
  scheme: config.scheme,
  port: config.port,
  headers: {
    'X-Fauna-Source': 'VSCode'
  }
});

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

  async function register() {
    // Set Schema Provider to display items on sidebar
    const faunaSchemaProvider = new FaunaSchemaProvider();
    const runAsProvider = new RunAsWebviewProvider(
      context.extensionUri,
      client,
      config.secret
    );

    vscode.window.registerWebviewViewProvider('run-as', runAsProvider);
    vscode.window.registerTreeDataProvider(
      'fauna-databases',
      faunaSchemaProvider
    );

    const mountSecret = (scope?: DBSchemaItem | CollectionSchemaItem) => {
      const database =
        scope instanceof CollectionSchemaItem ? scope.parent : scope;
      return config.secret + (database ? ':' + database.path : '') + ':admin';
    };

    registered.forEach(reg => reg.dispose());

    registered = [
      vscode.commands.registerCommand(
        'fauna.runQuery',
        createRunQueryCommand(client, outputChannel, runAsProvider)
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
      vscode.commands.registerCommand(
        'fauna.query',
        (expr: Expr, scope?: DBSchemaItem | CollectionSchemaItem) =>
          client
            .query(expr, {
              secret: mountSecret(scope)
            })
            .catch(error => ({ error }))
      ),
      vscode.commands.registerCommand('fauna.open', (item: SchemaItem) => {
        client
          .query<any>(item.content!, {
            secret: mountSecret(item.parent)
          })
          .then(async content => {
            const str = `fqlcode:${item.name}#${Expr.toString(
              q.Object(content)
            )}`;
            const uri = vscode.Uri.parse(str);
            const doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
            await vscode.window.showTextDocument(doc, { preview: false });
            vscode.languages.setTextDocumentLanguage(doc, 'javascript');
          })
          .catch(err => {
            console.error(err);
          });
      }),
      vscode.commands.registerCommand('fauna.refreshEntry', () =>
        faunaSchemaProvider.refresh()
      )
    ];
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
