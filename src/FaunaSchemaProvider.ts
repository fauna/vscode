import { Expr, query as q, values } from 'faunadb';
import vscode from 'vscode';
import CollectionSchemaItem from './CollectionSchemaItem';
import DBSchemaItem from './DBSchemaItem';
import DocumentSchemaItem from './DocumentSchemaItem';
import FunctionSchemaItem from './FunctionSchemaItem';
import IndexSchemaItem from './IndexSchemaItem';

export interface SchemaItem extends vscode.TreeItem {
  readonly ref: values.Ref;
  readonly parent?: DBSchemaItem | CollectionSchemaItem;
  readonly content?: Expr;
}

export default class FaunaSchemaProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined
  > = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this
    ._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?:
      | DBSchemaItem
      | CollectionSchemaItem
      | IndexSchemaItem
      | DocumentSchemaItem
      | FunctionSchemaItem
  ): Thenable<vscode.TreeItem[]> {
    if (element instanceof DBSchemaItem || !element) {
      return Promise.all([
        this.load({
          parent: element,
          Resource: q.Databases,
          Item: DBSchemaItem
        }),
        this.load({
          parent: element,
          Resource: q.Collections,
          Item: CollectionSchemaItem
        }),
        this.load({
          parent: element,
          Resource: q.Indexes,
          Item: IndexSchemaItem
        }),
        this.load({
          parent: element,
          Resource: q.Functions,
          Item: FunctionSchemaItem
        })
      ]).then(([databases, collections, indexes, functions]) => [
        ...databases,
        ...collections,
        ...indexes,
        ...functions
      ]);
    }

    if (element instanceof CollectionSchemaItem) {
      return this.loadDocuments(element);
    }

    throw new Error('No valid vscode.TreeItem');
  }

  async query<T>(expr: Expr, parent?: DBSchemaItem | CollectionSchemaItem) {
    return vscode.commands.executeCommand(
      'fauna.query',
      expr,
      parent
    ) as Promise<T>;
  }

  async load({
    parent,
    Resource,
    Item
  }: {
    parent?: DBSchemaItem;
    Resource: (...props: any[]) => Expr;
    Item: any;
  }): Promise<vscode.TreeItem[]> {
    const result = await this.query<values.Page<values.Ref> & { error?: any }>(
      q.Paginate(Resource()),
      parent
    );

    if (result.error) {
      vscode.window.showErrorMessage(
        `Fetch ${Resource.name} failed: ${result.error.message}`
      );
      return [];
    }

    return result.data ? result.data.map(ref => new Item(ref, parent)) : [];
  }

  async loadDocuments(parent: CollectionSchemaItem) {
    const result = await this.query<values.Page<values.Ref>>(
      q.Paginate(q.Documents(parent.ref)),
      parent.parent
    );

    return result.data.map(ref => new DocumentSchemaItem(ref, parent));
  }
}
