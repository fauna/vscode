import { Expr, query as q } from 'faunadb';
import * as path from 'path';
import * as vscode from 'vscode';
import DBSchemaItem from './DBSchemaItem';
import { SchemaType } from './types';

export default class IndexSchemaItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly parent?: DBSchemaItem
  ) {
    super(name);
  }

  get tooltip(): string {
    return `${this.name}`;
  }

  get content(): Expr {
    return q.Get(q.Index(this.name));
  }

  command = {
    command: 'faunadb.open',
    title: '',
    arguments: [this]
  };

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'list.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'list.svg')
  };

  contextValue = SchemaType.Index;
}
