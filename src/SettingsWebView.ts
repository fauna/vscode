import { errors, Expr, query as q, values } from 'faunadb';
import * as vscode from 'vscode';
import CollectionSchemaItem from './CollectionSchemaItem';
import DBSchemaItem from './DBSchemaItem';
import deleteResource from './deleteResource';
import { SchemaItem } from './FaunaSchemaProvider';
import { evalFQLCode } from './fql';
import { openFQLFile } from './openFQLFile';
import { SchemaType } from './types';

type Term = { field: string[] };
type Value = Term & { reverse?: boolean };

enum EventType {
  Close = 'close',
  Save = 'save',
  Delete = 'delete'
}

const Tooltip = {
  Collection: {
    Name:
      'Cannot be events, sets, self, documents, or _. Please wait a few moments before using a recently deleted collection name. This required field can be changed later.',
    HistoryDays:
      'Document history is retained for at least this many days. Clearing the field will retain history forever, but please note that this will increase storage utilization. This field defaults to 30 days, and can be changed later.',
    TTL:
      'Documents are deleted this many days after their last write. Documents of the collection will be removed if they have not been updated within the configured TTL. This optional field can be changed later.'
  },
  Index: {
    Source:
      'The ability to add multiple source collections and field bindings is coming to the Dashboard soon. Meanwhile, you can do this via the Fauna Shell.',
    Name:
      'Cannot be events, sets, self, documents, or _. Renaming an index changes its ref, but preserves inbound references to the index. Index data is not rebuilt. This required field can be changed later.',
    Terms:
      'The terms field specifies which document fields can be searched. Leaving it blank means that specific documents cannot be searched for, but the index can be used to paginate over all documents in the source collection(s). This optional field may not be changed later. To adjust it, delete the current index and create a new one with the desired definition. Example: `data.email,data.phone`',
    Values:
      "The values field specifies which document fields to return for matching entries. Leaving it blank returns the indexed document's reference. This optional field may not be changed later. To adjust it, delete the current index and create a new one with the desired definition. Example: `reverse:data.createdAt, data.age`",
    Unique:
      'If checked, maintains a uniqueness constraint on combined terms and values. Indexes with the unique constraint must also be serialized. Note: If you update the unique field, it will not remove existing duplicated items from the index.',
    Serialized:
      'If checked, writes to this index are serialized with concurrent reads and writes.'
  }
};

export class SettingsWebView {
  private panel: vscode.WebviewPanel;
  private resource?: any;
  private item?: Partial<Pick<SchemaItem, 'ref' | 'parent'>>;

  private renders = {
    [SchemaType.Database]: this.renderDatabase,
    [SchemaType.Collection]: this.renderCollection,
    [SchemaType.Index]: this.renderIndex,
    [SchemaType.Function]: this.renderFunction,
    [SchemaType.Document]: this.renderDocument
  };

  private eventHandlers: Record<EventType, (data: any) => void> = {
    [EventType.Close]: () => this.panel.dispose(),
    [EventType.Save]: data => this.save(data),
    [EventType.Delete]: () => this.delete()
  };

  constructor(
    private extensionUri: vscode.Uri,
    private contextValue: SchemaType
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    this.panel = vscode.window.createWebviewPanel(
      'createOrEdit',
      '',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    this.panel.webview.onDidReceiveMessage(
      (data: { type: EventType; data: any }) => {
        this.eventHandlers[data.type](data.data);
      }
    );
  }

  async forResource(item: SchemaItem) {
    const resource = await vscode.commands.executeCommand(
      'fauna.query',
      q.Get(item.ref),
      item.parent
    );
    this.item = item;
    this.resource = resource;
    return resource;
  }

  async setCreateForParent(parent: DBSchemaItem | CollectionSchemaItem) {
    this.item = { parent };
  }

  async render() {
    const styles = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'settingsWebView.css')
    );

    const script = this.panel!.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'settingsWebView.js')
    );

    this.panel.title = this.item?.ref
      ? `Settings ${this.item.ref.toString()}`
      : `Create ${this.contextValue}`;

    const body = await this.renders[this.contextValue].call(this);

    this.panel.webview.html = `
      <html>
        <head>
          <link href="${styles}" rel="stylesheet">
        </head>
        ${body}
        <script src="${script}"></script>
      </html>
    `;
  }

  private async getRoles() {
    const result = await vscode.commands.executeCommand<{
      error?: errors.FaunaHTTPError;
      data?: values.Ref[];
    }>('fauna.query', q.Paginate(q.Roles()), this.item?.parent);

    if (result?.error) {
      vscode.window.showErrorMessage(result!.error.requestResult.responseRaw);
      return;
    }

    return result?.data ?? [];
  }

  private async getCollections() {
    const result = await vscode.commands.executeCommand<{
      error?: errors.FaunaHTTPError;
      data?: values.Ref[];
    }>('fauna.query', q.Paginate(q.Collections()), this.item?.parent);

    if (result?.error) {
      vscode.window.showErrorMessage(result!.error.requestResult.responseRaw);
      return;
    }

    return result?.data ?? [];
  }

  private async save(data: any) {
    this.remapData(data);
    let result:
      | { error?: errors.FaunaHTTPError; ref?: values.Ref; body?: Expr }
      | undefined;
    if (this.item?.ref) {
      result = await vscode.commands.executeCommand(
        'fauna.query',
        q.Update(this.item.ref, data),
        this.item.parent
      );
    } else {
      const map: any = {
        [SchemaType.Database]: q.CreateDatabase,
        [SchemaType.Collection]: q.CreateCollection,
        [SchemaType.Index]: q.CreateIndex,
        [SchemaType.Function]: q.CreateFunction
      };
      result = await vscode.commands.executeCommand(
        'fauna.query',
        map[this.contextValue](data)
      );
    }

    this.panel.webview.postMessage({ type: 'release_save' });

    if (result!.error) {
      vscode.window.showErrorMessage(result!.error.requestResult.responseRaw);
      return;
    }

    if (!this.resource) {
      const item = {
        contextValue: this.contextValue,
        ref: result!.ref!,
        parent: this.item?.parent
      };
      this.forResource(item).then(() => this.render());

      if (this.contextValue === SchemaType.Function) {
        openFQLFile(Expr.toString(result!.body!), item);
      }
    }

    vscode.window.showInformationMessage(
      `${result?.ref} ${this.item?.ref ? 'updated' : 'created'}`
    );
    vscode.commands.executeCommand('fauna.refreshEntry');
  }

  private remapData(data: any) {
    if (data.body) {
      data.body = evalFQLCode(data.body);
    }

    if (data.source) {
      data.source = q.Collection(data.source);
    }

    if (data.role?.startsWith('@role/')) {
      data.role = q.Role(data.role.replace('@role/', ''));
    }

    if (data.role === '') {
      data.role = null;
    }

    if (data.values === '') {
      data.values = null;
    } else if (data.values) {
      data.values = data.values
        .replaceAll(' ', '')
        .split(',')
        .map((value: string) => {
          const data = value.split(':');
          const reverse = data.length === 2;
          const field =
            data.length === 1 ? data[0].split('.') : data[1].split('.');
          return { field, reverse };
        });
    }

    if (data.terms === '') {
      data.terms = null;
    } else if (data.terms) {
      data.terms = data.terms
        .replaceAll(' ', '')
        .split(',')
        .map((term: string) => ({ field: term.split('.') }));
    }

    return data;
  }

  delete() {
    if (!this.item) return;
    return deleteResource(this.item).then(success => {
      if (success) this.panel.dispose();
    });
  }

  private async renderCollection() {
    return `
      <form class="form">
        <div class="form-group">
          <label>Collection Name <span class="required">*<span> ${this.renderTooltip(
            Tooltip.Collection.Name
          )}</label>
          <input required name="name" value="${
            this.resource ? this.resource.name : ''
          }" class="input" placeholder="Name" />
        </div>
        <div class="form-group">
          <label>History Days(optional) ${this.renderTooltip(
            Tooltip.Collection.HistoryDays
          )}</label>
          <input name="history_days" value="${
            this.resource ? this.resource.history_days : ''
          }" type="number" class="input" placeholder="History days" />
        </div>
        <div class="form-group">
          <label>TTL (optional) ${this.renderTooltip(
            Tooltip.Collection.TTL
          )}</label>
          <input name="ttl_days" value="${
            this.resource ? this.resource.ttl_days : ''
          }" type="number" class="input" placeholder="TTL" />
        </div>
        ${this.renderControls()}
      </form>
    `;
  }
  private async renderDatabase() {
    return `
      <form class="form">
        <div class="form-group">
          <label>Database Name <span class="required">*<span></label>
          <input required name="name" value="${
            this.resource ? this.resource.name : ''
          }" class="input" placeholder="Name" />
          <div class="hint">
            Cannot contain spaces
          </div>
        </div>
        ${this.renderControls()}
      </form>
    `;
  }

  private async renderIndex() {
    const collections = await this.getCollections();
    const terms = this.resource
      ? this.resource.terms
        ? `<ul class="readonly">${this.resource.terms
            .map((term: Term) => `<li>${term.field.join('.')}</li>`)
            .join('')}</ul>`
        : '<span class="readonly">Not set</span>'
      : '<input class="input" name="terms" />';

    const values = this.resource
      ? this.resource.values
        ? `<ul class="readonly">${this.resource.values
            .map(
              (value: Value) =>
                `<li> ${value.reverse ? 'reverse' : ''} ${value.field.join(
                  '.'
                )}</li>`
            )
            .join('')}</ul>`
        : '<span class="readonly">Not set (using ref by default)</span>'
      : ` <input class="input" name="values"/>`;

    const source = this.resource
      ? `<span class="readonly">${this.resource.source.id}</span>`
      : `
        <select name="source">
         <option value="">Select a Collection</value>  
         ${collections!.map(
           collection =>
             `<option value="${collection.id}">
            ${collection.id}
           </option>`
         )}    
        </select>`;

    return `
      <form class="form">
        <div class="form-group">
          <label>Source Collections <span class="required">*</span> ${this.renderTooltip(
            Tooltip.Index.Source
          )}</label>
          ${source}
        </div>
        <div class="form-group">
          <label>Index Name <span class="required">*<span> ${this.renderTooltip(
            Tooltip.Index.Name
          )}</label>
          <input required name="name" value="${
            this.resource ? this.resource.name : ''
          }" class="input" placeholder="Name" />
        </div>
        <div class="form-group">
          <label>Terms (optional) ${this.renderTooltip(
            Tooltip.Index.Terms
          )}</label>
          ${terms}
        </div>
        <div class="form-group">
          <label>Values (optional) ${this.renderTooltip(
            Tooltip.Index.Values
          )}</label>
          ${values}
        </div>
        <div class="form-group">
          <label>
            <input ${
              this.resource?.unique ? 'checked' : ''
            } name="unique" type="checkbox">
            Unique (optional)
            ${this.renderTooltip(Tooltip.Index.Unique)}
          </label>
        </div>
        <div class="form-group">
          <label>
            <input ${
              this.resource
                ? this.resource.serialized
                  ? 'checked'
                  : ''
                : 'checked'
            } name="serialized" type="checkbox">
            Serialized (optional)
            ${this.renderTooltip(Tooltip.Index.Serialized)}
          </label>
        </div>
        ${this.renderControls()}
      </form>
  `;
  }

  private async renderFunction() {
    const roles = await this.getRoles();

    return `
      <form class="form">
        ${
          this.resource
            ? ''
            : '<input name="body" style="display: none" value="Query(Lambda(\'x\', Add(Var(\'x\'), Var(\'x\'))))" />'
        }
        <div class="form-group">
          <label>Function Name <span class="required">*<span></label>
          <input required name="name" value="${
            this.resource ? this.resource.name : ''
          }" class="input" placeholder="Name" />
        </div>
        <div class="form-group">
          <label>Role (optional)</label>
          <select name="role">
            <option value="">None</option>
            <option ${
              this.resource?.role === 'admin' ? 'selected' : ''
            } value="admin">Admin</option>
            <option ${
              this.resource?.role === 'server' ? 'selected' : ''
            } value="server">Server</option>
            ${roles!.map(
              role =>
                `<option ${
                  role.id === this.resource?.role?.id ? 'selected' : ''
                } value="@role/${role.id}">
                ${role.id}
               </option>`
            )}
          </select>
        </div>
        ${this.renderControls()}
      </form>
    `;
  }

  private async renderDocument() {
    return '';
  }

  private renderTooltip(text: string) {
    return `
      <div class="tooltip">
        <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 496.158 496.158" style="enable-background:new 0 0 496.158 496.158;" xml:space="preserve"> <path style="fill:currentColor" d="M496.158,248.085c0-137.022-111.069-248.082-248.075-248.082C111.07,0.003,0,111.063,0,248.085 c0,137.001,111.07,248.07,248.083,248.07C385.089,496.155,496.158,385.086,496.158,248.085z"/> <path style="fill:#FFFFFF;" d="M138.216,173.592c0-13.915,4.467-28.015,13.403-42.297c8.933-14.282,21.973-26.11,39.111-35.486 c17.139-9.373,37.134-14.062,59.985-14.062c21.238,0,39.99,3.921,56.25,11.755c16.26,7.838,28.818,18.495,37.683,31.97 c8.861,13.479,13.293,28.125,13.293,43.945c0,12.452-2.527,23.367-7.581,32.739c-5.054,9.376-11.062,17.469-18.018,24.279 c-6.959,6.812-19.446,18.275-37.463,34.388c-4.981,4.542-8.975,8.535-11.975,11.976c-3.004,3.443-5.239,6.592-6.702,9.447 c-1.466,2.857-2.603,5.713-3.406,8.57c-0.807,2.855-2.015,7.875-3.625,15.051c-2.784,15.236-11.501,22.852-26.147,22.852 c-7.618,0-14.028-2.489-19.226-7.471c-5.201-4.979-7.8-12.377-7.8-22.192c0-12.305,1.902-22.962,5.713-31.97 c3.808-9.01,8.861-16.92,15.161-23.73c6.296-6.812,14.794-14.904,25.488-24.28c9.373-8.202,16.15-14.392,20.325-18.567 c4.175-4.175,7.69-8.823,10.547-13.953c2.856-5.126,4.285-10.691,4.285-16.699c0-11.718-4.36-21.605-13.074-29.663 c-8.717-8.054-19.961-12.085-33.728-12.085c-16.116,0-27.981,4.065-35.596,12.195c-7.618,8.13-14.062,20.105-19.336,35.925 c-4.981,16.555-14.43,24.829-28.345,24.829c-8.206,0-15.127-2.891-20.764-8.679C141.035,186.593,138.216,180.331,138.216,173.592z M245.442,414.412c-8.937,0-16.737-2.895-23.401-8.68c-6.667-5.784-9.998-13.877-9.998-24.279c0-9.229,3.22-16.991,9.668-23.291 c6.444-6.297,14.354-9.448,23.73-9.448c9.229,0,16.991,3.151,23.291,9.448c6.296,6.3,9.448,14.062,9.448,23.291 c0,10.255-3.296,18.312-9.888,24.17C261.7,411.481,254.084,414.412,245.442,414.412z"/> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>
        <span class="tooltiptext">${text}</span>
      </div>
    `;
  }

  private renderControls() {
    return `
      <div class="controls">
        <button id="cancel" type="button">CANCEL</button>
        <button id="submit" type="button" class="primary">${
          this.item?.ref ? 'UPDATE' : 'CREATE'
        }</button>
      </div>
     ${
       this.item?.ref
         ? `
        <hr />
      <div id="delete" class="delete">
        <svg class="svg-inline--fa fa-trash fa-w-14" aria-hidden="true" data-prefix="fas" data-icon="trash" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M0 84V56c0-13.3 10.7-24 24-24h112l9.4-18.7c4-8.2 12.3-13.3 21.4-13.3h114.3c9.1 0 17.4 5.1 21.5 13.3L312 32h112c13.3 0 24 10.7 24 24v28c0 6.6-5.4 12-12 12H12C5.4 96 0 90.6 0 84zm415.2 56.7L394.8 467c-1.6 25.3-22.6 45-47.9 45H101.1c-25.3 0-46.3-19.7-47.9-45L32.8 140.7c-.4-6.9 5.1-12.7 12-12.7h358.5c6.8 0 12.3 5.8 11.9 12.7z"></path></svg>
        <span>DELETE</span>
      </div>
     `
         : ''
     }
    `;
  }
}
