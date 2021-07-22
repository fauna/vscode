import { Client, Expr, query as q, values } from 'faunadb';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { loadConfig } from './config';
import { runFQLQuery } from './fql';

const config = loadConfig();

const Ref: Record<
  string,
  {
    ref: (name: string, parent?: Expr) => Expr;
    payload: (data: string) => string;
  }
> = {
  function: {
    ref: (name: string) => q.Function(name),
    payload: (data: string) => `{body: ${data} }`
  },
  document: {
    ref: (name: string, parent?: Expr) => q.Ref(parent!, name),
    payload: (data: string) => `{ data: ${data} }`
  },
  collection: {
    ref: (name: string) => q.Collection(name),
    payload: () => ''
  }
};

export default (client: Client) => async () => {
  const { activeTextEditor } = vscode.window;
  if (!activeTextEditor) return;

  const match = activeTextEditor.document.fileName.match(
    /fauna-vscode-tmp\/(.*)\.[fql|json]/
  );
  if (!match) return;

  const parts = match[1].split('.').map(p => p.split('#'));

  let ref: Expr;
  let parentRef;
  const [itemType, itemId] = parts[parts.length - 1];

  if (parts.length > 1) {
    const [parentType, parentId] = parts[parts.length - 2];
    parentRef = Ref[parentType].ref(parentId);
    ref = Ref[itemType].ref(itemId, parentRef);
  } else {
    ref = Ref[itemType].ref(itemId);
  }

  const data = activeTextEditor.document.getText();

  const dbPaths: string[] = [];
  parts.forEach(parts => {
    if (parts[0] === 'database') dbPaths.unshift(parts[1]);
  });

  const secret = [
    dbPaths.length ? `${config.secret}:${dbPaths.join('/')}` : config.secret,
    'admin'
  ].join(':');

  const isNewDoc = activeTextEditor.document.fileName.includes('newDoc');

  const query =
    isNewDoc && parentRef
      ? `Create(${Expr.toString(parentRef)}, ${Ref[itemType].payload(data)})`
      : `Update(${Expr.toString(ref)}, ${Ref[itemType].payload(data)})`;

  try {
    const resp = await runFQLQuery(query, client, secret);

    const resource = resp[0] as { ref: values.Ref };
    vscode.window.showInformationMessage(
      `${Expr.toString(resource.ref)} ${isNewDoc ? ' created' : ' updated'}`
    );

    if (isNewDoc) {
      const newPath = activeTextEditor.document.fileName.replace(
        'newDoc',
        resource.ref.id
      );
      await fs.promises.rename(activeTextEditor.document.fileName, newPath);

      const doc = await vscode.workspace.openTextDocument(newPath);
      await vscode.commands.executeCommand(
        'workbench.action.closeActiveEditor'
      );
      await vscode.commands.executeCommand('fauna.refreshEntry');
      vscode.window.showTextDocument(doc, activeTextEditor.viewColumn);
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      error.requestResult ? error.requestResult.responseRaw : error.message
    );
  }
};
