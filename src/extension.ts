import { Client, errors, Expr, query as q, values } from 'faunadb';
import * as vscode from 'vscode';
import CollectionSchemaItem from './CollectionSchemaItem';
import { loadConfig } from './config';
import DBSchemaItem from './DBSchemaItem';
import deleteResource from './deleteResource';
import DocumentSchemaItem from './DocumentSchemaItem';
import FaunaSchemaProvider, { SchemaItem } from './FaunaSchemaProvider';
import FQLContentProvider from './FQLContentProvider';
import { openFQLFile, openJSONFile } from './openFQLFile';
import RunAsWebviewProvider from './RunAsWebviewProvider';
import createRunQueryCommand from './runQueryCommand';
import { SettingsWebView } from './SettingsWebView';
import { SchemaType } from './types';
import updateResourceCommand from './updateResourceCommand';
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
      const secret = config.secret + (database ? ':' + database.path : '');
      return config.secret + (database ? ':' + database.path : '') + ':admin';
    };

    registered.forEach(reg => reg.dispose());

    registered = [
      vscode.commands.registerCommand(
        'fauna.runQuery',
        createRunQueryCommand(client, outputChannel, runAsProvider)
      ),
      vscode.commands.registerCommand(
        'fauna.updateResource',
        updateResourceCommand(client)
      ),
      vscode.commands.registerCommand('fauna.createQuery', () =>
        openFQLFile('Paginate(Collections())')
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
            .catch((error: errors.FaunaHTTPError) => ({ error }))
      ),
      vscode.commands.registerCommand('fauna.open', (item: SchemaItem) => {
        client
          .query<any>(item.content!, {
            secret: mountSecret(item.parent)
          })
          .then(async resp => {
            if (item.contextValue === SchemaType.Function) {
              openFQLFile(Expr.toString(resp.body), item);
              return;
            }

            if (item.contextValue === SchemaType.Document) {
              openJSONFile(JSON.stringify(resp.data, null, '\t'), item);
              return;
            }

            if (item.contextValue === SchemaType.Index) {
              openJSONFile(Expr.toString(q.Object(resp)), item);
              return;
            }
          })
          .catch(err => {
            console.error(err);
          });
      }),
      vscode.commands.registerCommand('fauna.refreshEntry', () =>
        faunaSchemaProvider.refresh()
      ),

      vscode.commands.registerCommand('fauna.create', async () => {
        const pick = await vscode.window.showQuickPick(
          Object.values(SchemaType)
        );
        if (!pick) return;

        if (pick === SchemaType.Document) {
          const response = await vscode.commands.executeCommand<{
            collections: values.Ref[];
            newId: string;
          }>(
            'fauna.query',
            q.Let(
              {},
              {
                newId: q.NewId(),
                collections: q.Select(['data'], q.Paginate(q.Collections()))
              }
            )
          );

          if (!response?.collections?.length) {
            vscode.window.showErrorMessage(
              'You need to create at least one collection'
            );
            return;
          }

          const collection = await vscode.window.showQuickPick(
            response.collections.map(c => c.id)
          );
          if (!collection) return;

          const docItem = new DocumentSchemaItem(
            new values.Ref('newDoc'),
            new CollectionSchemaItem(new values.Ref(collection))
          );

          openJSONFile('{}', docItem);
          return;
        }

        const view = new SettingsWebView(
          context.extensionUri,
          pick as SchemaType
        );
        view.render();
      }),

      vscode.commands.registerCommand('fauna.settings', faunaRes => {
        const view = new SettingsWebView(
          context.extensionUri,
          faunaRes.contextValue
        );
        view.forResource(faunaRes).then(() => view.render());
      }),

      vscode.commands.registerCommand('fauna.delete', deleteResource)
    ];
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
