import vscode from 'vscode';
import { Client, values, query as q } from 'faunadb';
import DBSchemaItem from './DBSchemaItem';
import CollectionSchemaItem from './CollectionSchemaItem';
import IndexSchemaItem from './IndexSchemaItem';

export default class FaunaDBSchemaProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private client: Client;
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined
  > = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this
    ._onDidChangeTreeData.event;

  constructor(private secret: string) {
    this.client = new Client({ secret: this.secret });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: DBSchemaItem | CollectionSchemaItem | IndexSchemaItem
  ): Thenable<vscode.TreeItem[]> {
    return Promise.all([
      this.loadDatabases(element ? `${element.name}` : undefined),
      this.loadCollections(element ? `${element.name}` : undefined),
      this.loadIndexes(element ? `${element.name}` : undefined)
    ]).then(([databases, collections, indexes]) => [
      ...databases,
      ...collections,
      ...indexes
    ]);
  }

  async loadDatabases(itemPath?: string) {
    const client = new Client({ secret: this.mountSecret(itemPath) });

    const result = await client.query<values.Page<string>>(
      q.Map(q.Paginate(q.Databases()), database => q.Select(['id'], database))
    );

    return result.data.map(id => new DBSchemaItem(id, itemPath));
  }

  async loadCollections(itemPath?: string) {
    const client = new Client({ secret: this.mountSecret(itemPath) });

    const result = await client.query<values.Page<string>>(
      q.Map(q.Paginate(q.Collections()), collection =>
        q.Select(['id'], collection)
      )
    );

    return result.data.map(
      id => new CollectionSchemaItem(id, itemPath, client)
    );
  }

  async loadIndexes(itemPath?: string) {
    const client = new Client({ secret: this.mountSecret(itemPath) });

    const result = await client.query<values.Page<string>>(
      q.Map(q.Paginate(q.Indexes()), collection => q.Select(['id'], collection))
    );

    return result.data.map(id => new IndexSchemaItem(id, itemPath, client));
  }

  mountSecret(itemPath?: string) {
    if (!itemPath) {
      return this.secret;
    }

    return `${this.secret}:${itemPath}:admin`;
  }
}
