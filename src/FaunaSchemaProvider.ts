import { Expr, query as q, values } from 'faunadb';
import vscode from 'vscode';
import CollectionSchemaItem from './CollectionSchemaItem';
import DBSchemaItem from './DBSchemaItem';
import DocumentSchemaItem from './DocumentSchemaItem';
import FunctionSchemaItem from './FunctionSchemaItem';
import IndexSchemaItem from './IndexSchemaItem';

export interface SchemaItem extends vscode.TreeItem {
  readonly name: string;
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
    this._onDidChangeTreeData.fire({});
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
        this.loadDatabases(element),
        this.loadCollections(element),
        this.loadIndexes(element),
        this.loadFunctions(element)
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

  async loadDatabases(parent?: DBSchemaItem) {
    const result = await this.query<values.Page<string>>(
      q.Map(q.Paginate(q.Databases()), db => q.Select(['id'], db)),
      parent
    );

    return result.data.map(id => new DBSchemaItem(id, parent));
  }

  async loadCollections(parent?: DBSchemaItem) {
    const result = await this.query<values.Page<string>>(
      q.Map(q.Paginate(q.Collections()), coll => q.Select(['id'], coll)),
      parent
    );

    return result.data.map(id => new CollectionSchemaItem(id, parent));
  }

  async loadIndexes(parent?: DBSchemaItem) {
    const result = await this.query<values.Page<string>>(
      q.Map(q.Paginate(q.Indexes()), index => q.Select(['id'], index)),
      parent
    );

    return result.data.map(id => new IndexSchemaItem(id, parent));
  }

  async loadFunctions(parent?: DBSchemaItem) {
    const result = await this.query<values.Page<string>>(
      q.Map(q.Paginate(q.Functions()), fn => q.Select(['id'], fn)),
      parent
    );

    return result.data.map(id => new FunctionSchemaItem(id, parent));
  }

  async loadDocuments(parent: CollectionSchemaItem) {
    const result = await this.query<values.Page<string>>(
      q.Map(q.Paginate(q.Documents(q.Collection(parent.name))), doc =>
        q.Select(['id'], doc)
      )
    );

    return result.data.map(id => new DocumentSchemaItem(id, parent));
  }
}
