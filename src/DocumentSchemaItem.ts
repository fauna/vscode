import { Expr, query as q } from 'faunadb';
import * as path from 'path';
import * as vscode from 'vscode';
import CollectionSchemaItem from './CollectionSchemaItem';
import { SchemaType } from './types';

export default class DocumentSchemaItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly parent: CollectionSchemaItem
  ) {
    super(name);
  }

  // @ts-ignore
  get tooltip(): string {
    return `${this.name}`;
  }

  get content(): Expr {
    return q.Get(q.Ref(q.Collection(this.parent.name), this.name));
  }

  command = {
    command: 'fauna.open',
    title: '',
    arguments: [this]
  };

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'file.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'file.svg')
  };

  contextValue = SchemaType.Document;
}
