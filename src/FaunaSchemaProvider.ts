import vscode from 'vscode';
import { Client, values, query as q } from 'faunadb';
import DBSchemaItem from './DBSchemaItem';
import CollectionSchemaItem from './CollectionSchemaItem';
import IndexSchemaItem from './IndexSchemaItem';
import FunctionSchemaItem from './FunctionSchemaItem';
import DocumentSchemaItem from './DocumentSchemaItem';

export default class FaunaDBSchemaProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private client: Client;
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined
  > = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this
    ._onDidChangeTreeData.event;

  constructor(private secret: string) {
    this.client = new Client({
      secret: this.secret,
      // @ts-ignore comment
      headers: {
        'X-Fauna-Source': 'VSCode'
      }
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
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
      const dbPath = element?.itemPath;

      return Promise.all([
        this.loadDatabases(dbPath),
        this.loadCollections(dbPath),
        this.loadIndexes(dbPath),
        this.loadFunctions(dbPath)
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

  async loadDatabases(itemPath?: string) {
    const client = new Client({
      secret: this.mountSecret(itemPath),
      // @ts-ignore comment
      headers: {
        'X-Fauna-Source': 'VSCode'
      }
    });

    const result = await client.query<values.Page<string>>(
      q.Map(q.Paginate(q.Databases()), database => q.Select(['id'], database))
    );

    return result.data.map((id: string) => {
      const childPath = itemPath ? `${itemPath}/${id}` : id;
      return new DBSchemaItem(id, childPath);
    });
  }

  async loadCollections(itemPath?: string) {
    const client = new Client({
      secret: this.mountSecret(itemPath),
      // @ts-ignore comment
      headers: {
        'X-Fauna-Source': 'VSCode'
      }
    });

    const result = await client.query<values.Page<string>>(
      q.Map(q.Paginate(q.Collections()), collection =>
        q.Select(['id'], collection)
      )
    );

    return result.data.map(
      (id: string) => new CollectionSchemaItem(id, itemPath)
    );
  }

  async loadIndexes(itemPath?: string) {
    const client = new Client({
      secret: this.mountSecret(itemPath),
      // @ts-ignore comment
      headers: {
        'X-Fauna-Source': 'VSCode'
      }
    });

    const result = await client.query<values.Page<string>>(
      q.Map(q.Paginate(q.Indexes()), indexes => q.Select(['id'], indexes))
    );

    return result.data.map(
      (id: string) => new IndexSchemaItem(id, itemPath, client)
    );
  }

  async loadFunctions(itemPath?: string) {
    const client = new Client({
      secret: this.mountSecret(itemPath),
      // @ts-ignore comment
      headers: {
        'X-Fauna-Source': 'VSCode'
      }
    });

    const result = await client.query<values.Page<string>>(
      q.Map(q.Paginate(q.Functions()), function_ => q.Select(['id'], function_))
    );

    return result.data.map(
      (id: string) => new FunctionSchemaItem(id, itemPath, client)
    );
  }

  async loadDocuments(collection: CollectionSchemaItem) {
    const client = new Client({
      secret: this.mountSecret(collection.itemPath),
      // @ts-ignore comment
      headers: {
        'X-Fauna-Source': 'VSCode'
      }
    });

    const result = await client.query<values.Page<string>>(
      q.Map(q.Paginate(q.Documents(q.Collection(collection.name))), function_ =>
        q.Select(['id'], function_)
      )
    );

    return result.data.map(
      (id: string) =>
        new DocumentSchemaItem(id, collection.name, collection.itemPath, client)
    );
  }

  mountSecret(itemPath?: string) {
    if (!itemPath) {
      return this.secret;
    }

    return `${this.secret}:${itemPath}:admin`;
  }
}
