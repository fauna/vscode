import { errors, query as q } from 'faunadb';
import * as vscode from 'vscode';
import { SchemaItem } from './FaunaSchemaProvider';

export default async (item: Partial<Pick<SchemaItem, 'ref' | 'parent'>>) => {
  if (!item.ref) return;
  const confirm = await vscode.window.showInformationMessage(
    `Would you like to delete ${item.ref}?`,
    ...['Yes', 'No']
  );
  if (confirm === 'Yes') {
    const resp = await vscode.commands.executeCommand<{
      error: errors.FaunaHTTPError;
    }>('fauna.query', q.Delete(item.ref), item.parent);

    if (resp?.error) {
      vscode.window.showErrorMessage(resp.error.requestResult.responseRaw);
    } else {
      vscode.window.showInformationMessage(`${item!.ref} deleted`);
      vscode.commands.executeCommand('fauna.refreshEntry');
      return true;
    }
  }
};
