import * as vscode from 'vscode';
import * as path from 'path';
import { SchemaType } from './types';

export default class DBSchemaItem extends vscode.TreeItem {
  constructor(public readonly name: string, public readonly itemPath?: string) {
    super(name, vscode.TreeItemCollapsibleState.Collapsed);
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
