import * as vscode from 'vscode';
import * as path from 'path';
import { query as q, Expr } from 'faunadb';
import { SchemaType } from './types';
import DBSchemaItem from './DBSchemaItem';

export default class FunctionSchemaItem extends vscode.TreeItem {
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
    return q.Get(q.Function(this.name));
  }

  command = {
    command: 'faunadb.open',
    title: '',
    arguments: [this]
  };

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'code.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'code.svg')
  };

  contextValue = SchemaType.Function;
}
