import { values } from 'faunadb';
import * as path from 'path';
import * as vscode from 'vscode';
import { SchemaType } from './types';

export default class DBSchemaItem extends vscode.TreeItem {
  constructor(
    public readonly ref: values.Ref,
    public readonly parent?: DBSchemaItem
  ) {
    super(ref.id, vscode.TreeItemCollapsibleState.Collapsed);
  }

  get path(): string {
    let item: DBSchemaItem = this;
    let itemPath = item.ref.id;
    while (item.parent) {
      itemPath = item.parent.ref.id + '/' + itemPath;
      item = item.parent;
    }
    return itemPath;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'database-solid.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'database-solid.svg')
  };

  contextValue = SchemaType.Database;
}
