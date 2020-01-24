import * as vscode from 'vscode';
import * as path from 'path';
import { SchemaType } from './types';
import { query as q, Expr, Client } from 'faunadb';

export default class IndexSchemaItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly itemPath?: string,
    private client?: Client
  ) {
    super(name);
  }

  get tooltip(): string {
    return `${this.name}`;
  }

  public displayInfo() {
    if (!this.client) {
      return Promise.resolve(null);
    }

    return this.client
      .query(q.Get(q.Index(this.name)))
      .then(async (content: any) => {
        let uri = vscode.Uri.parse(
          `fqlcode:${this.name}#${Expr.toString(q.Object(content))}`
        );
        let doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
        await vscode.window.showTextDocument(doc, { preview: false });
        vscode.languages.setTextDocumentLanguage(doc, 'javascript');
      })
      .catch((error: any) => console.error(error));
  }

  command = {
    command: 'faunadb.get',
    title: '',
    arguments: [this]
  };

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'list.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'list.svg')
  };

  contextValue = SchemaType.Index;
}
