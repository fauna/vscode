import { Expr, query as q, values } from 'faunadb';
import * as path from 'path';
import * as vscode from 'vscode';
import CollectionSchemaItem from './CollectionSchemaItem';
import { SchemaType } from './types';

export default class DocumentSchemaItem extends vscode.TreeItem {
  constructor(
    public readonly ref: values.Ref,
    public readonly parent: CollectionSchemaItem
  ) {
    super(ref.id);
  }

  get content(): Expr {
    return q.Get(this.ref);
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
