import * as vscode from 'vscode';
import { getLocalKey } from './auth';
import createCreateQueryCommand from './createQueryCommand';
import FaunaSchemaProvider from './FaunaSchemaProvider';
import FQLContentProvider from './FQLContentProvider';
import createRunQueryCommand from './runQueryCommand';
import uploadGraphqlSchemaCommand from './uploadGraphqlSchemaCommand';

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
  const config = vscode.workspace.getConfiguration('fauna');
  let adminSecretKey = config.get<string>('adminSecretKey');

  // Load a local key if there is (in a .faunarc file set as FAUNA_KEY=<your-secret>)
  let localSecretKey = getLocalKey();
  if (localSecretKey) {
    adminSecretKey = localSecretKey;
  }

  if (!adminSecretKey) {
    vscode.window.showErrorMessage(
      'No Fauna admin secret key was found on Code > Preferences > Settings > Extensions > Fauna.'
    );
    return;
  }

  // Set Schema Provider to display items on sidebar
  const faunaSchemaProvider = new FaunaSchemaProvider(adminSecretKey);
  vscode.window.registerTreeDataProvider(
    'fauna-databases',
    faunaSchemaProvider
  );

  vscode.commands.registerCommand(
    'fauna.runQuery',
    createRunQueryCommand(adminSecretKey, outputChannel)
  );

  vscode.commands.registerCommand(
    'fauna.createQuery',
    createCreateQueryCommand()
  );

  vscode.commands.registerCommand(
    'fauna.uploadGraphQLSchema',
    uploadGraphqlSchemaCommand('merge', adminSecretKey, outputChannel)
  );

  vscode.commands.registerCommand(
    'fauna.mergeGraphQLSchema',
    uploadGraphqlSchemaCommand('merge', adminSecretKey, outputChannel)
  );

  vscode.commands.registerCommand(
    'fauna.overrideGraphQLSchema',
    uploadGraphqlSchemaCommand('override', adminSecretKey, outputChannel)
  );

  vscode.commands.registerCommand('fauna.get', item => {
    item.displayInfo();
  });

  vscode.commands.registerCommand('fauna.refreshEntry', () =>
    faunaSchemaProvider.refresh()
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
