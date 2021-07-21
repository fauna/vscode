import { Expr, query as q, values } from 'faunadb';
import * as path from 'path';
import * as vscode from 'vscode';
import DBSchemaItem from './DBSchemaItem';
import { SchemaType } from './types';

export default class FunctionSchemaItem extends vscode.TreeItem {
  constructor(
    public readonly ref: values.Ref,
    public readonly parent?: DBSchemaItem
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
    light: path.join(__filename, '..', '..', 'media', 'code.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'code.svg')
  };

  contextValue = SchemaType.Function;
}
