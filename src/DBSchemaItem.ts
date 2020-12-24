import * as vscode from 'vscode';
import * as path from 'path';
import { SchemaType } from './types';

export default class DBSchemaItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly parent?: DBSchemaItem
  ) {
    super(name, vscode.TreeItemCollapsibleState.Collapsed);
  }

  get path(): string {
    let item: DBSchemaItem = this;
    let itemPath = item.name;
    while (item.parent) {
      itemPath = item.parent.name + '/' + itemPath;
      item = item.parent;
    }
    return itemPath;
  }

  get tooltip(): string {
    return `${this.name}`;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'database-solid.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'database-solid.svg')
  };

  contextValue = SchemaType.Database;
}
