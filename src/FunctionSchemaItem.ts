import { Expr, query as q } from 'faunadb';
import * as path from 'path';
import * as vscode from 'vscode';
import DBSchemaItem from './DBSchemaItem';
import { SchemaType } from './types';

export default class FunctionSchemaItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly parent?: DBSchemaItem
  ) {
    super(name);
  }

  // @ts-ignore
  get tooltip(): string {
    return `${this.name}`;
  }

  get content(): Expr {
    return q.Get(q.Function(this.name));
  }

  command = {
    command: 'fauna.open',
    title: '',
    arguments: [this]
  };

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'code.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'code.svg')
  };

  contextValue = SchemaType.Function;
}
