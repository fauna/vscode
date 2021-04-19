import * as vscode from 'vscode';
import * as path from 'path';
import { query as q, Expr } from 'faunadb';
import { SchemaType } from './types';
import CollectionSchemaItem from './CollectionSchemaItem';

export default class DocumentSchemaItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly parent: CollectionSchemaItem
  ) {
    super(name);
  }

  get tooltip(): string {
    return `${this.name}`;
  }

  get content(): Expr {
    return q.Get(q.Ref(q.Collection(this.parent.name), this.name));
  }

  command = {
    command: 'faunadb.open',
    title: '',
    arguments: [this]
  };

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'file.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'file.svg')
  };

  contextValue = SchemaType.Document;
}
