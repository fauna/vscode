import * as vscode from 'vscode';
import * as path from 'path';
import { SchemaType } from './types';

export default class IndexSchemaItem extends vscode.TreeItem {
  constructor(public readonly name: string, public readonly itemPath?: string) {
    super(name);
  }

  get tooltip(): string {
    return `${this.name}`;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'media', 'list.svg'),
    dark: path.join(__filename, '..', '..', 'media', 'list.svg')
  };

  contextValue = SchemaType.Collection;
}
