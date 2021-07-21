import { values } from 'faunadb';
import * as path from 'path';
import * as vscode from 'vscode';
import DBSchemaItem from './DBSchemaItem';
import { SchemaType } from './types';

export default class CollectionSchemaItem extends vscode.TreeItem {
  constructor(
    public readonly ref: values.Ref,
    public readonly parent?: DBSchemaItem
  ) {
    super(ref.id, vscode.TreeItemCollapsibleState.Collapsed);
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'window.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'window.svg')
  };

  contextValue = SchemaType.Collection;

  // constructor(
  //   public readonly name: string,
  //   public readonly itemPath?: string,
  //   private client?: Client
  // ) {
  //   super(name);
  // }

  // get tooltip(): string {
  //   return `${this.name}`;
  // }

  // public displayInfo() {
  //   if (!this.client) {
  //     return Promise.resolve(null);
  //   }

  //   return this.client
  //     .query(q.Get(q.Collection(this.name)))
  //     .then(async (content: any) => {
  //       let uri = vscode.Uri.parse(
  //         `fqlcode:${this.name}#${Expr.toString(q.Object(content))}`
  //       );
  //       let doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
  //       await vscode.window.showTextDocument(doc, { preview: false });
  //       vscode.languages.setTextDocumentLanguage(doc, 'javascript');
  //     })
  //     .catch(error => console.error(error));
  // }

  // command = {
  //   command: 'fauna.get',
  //   title: '',
  //   arguments: [this]
  // };

  // iconPath = {
  //   light: path.join(__filename, '..', '..', 'media', 'window.svg'),
  //   dark: path.join(__filename, '..', '..', 'media', 'window.svg')
  // };

  // contextValue = SchemaType.Collection;
}
