import { Client, query } from 'faunadb';
import * as vscode from 'vscode';

export default class RunAsWebviewProvider
  implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  public role: string | null = null;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private client: Client,
    private secret: string
  ) {}

  public getSecretWithRole() {
    return this.role ? [this.secret, this.role].join(':') : undefined;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri]
    };

    const isAdmin = await this.isAdmin();
    if (isAdmin) {
      webviewView.webview.html = this.getHtmlForRunAs();
    } else {
      webviewView.webview.html = this.getHtmlForNonAdmin();
    }

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'roleChanged':
          this.role = data.role;
          break;
        case 'deactivateRunAs':
          this.role = null;
          break;
        case 'collectionChanged':
          this.role = [this.role, data.collection].join('/');
          break;
        case 'idChanged':
          this.role = [this.role, data.id].join('/');
      }
    });
  }

  private async isAdmin() {
    return this.client
      .query(query.Now(), { secret: this.secret + ':admin' })
      .then(() => true)
      .catch(err => false);
  }

  private getHtmlForNonAdmin() {
    return `
      <div>
        ${this.getHtmlForDesc()}
        <span style="color: red">Available only for secret with 'admin' role</span>
      </div>
    `;
  }

  private getHtmlForRunAs() {
    const scriptUri = this._view!.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'controlPanel.js')
    );
    const nonce = getNonce();

    return `
    <html>
      <head></head>
      <body>
        <div style="margin-top: 10px">
          ${this.getHtmlForDesc()}
          <div id="runAsActivate" style="color: #525ebc; cursor: pointer; margin-top:10px">
            <svg width="20" class="svg-inline--fa fa-user-lock fa-w-20" aria-hidden="true" data-prefix="fas" data-icon="user-lock" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" data-fa-i2svg=""><path fill="currentColor" d="M320 320c0-11.1 3.1-21.4 8.1-30.5-4.8-.5-9.5-1.5-14.5-1.5h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h280.9c-5.5-9.5-8.9-20.3-8.9-32V320zm-96-64c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm384 32h-32v-48c0-44.2-35.8-80-80-80s-80 35.8-80 80v48h-32c-17.7 0-32 14.3-32 32v160c0 17.7 14.3 32 32 32h224c17.7 0 32-14.3 32-32V320c0-17.7-14.3-32-32-32zm-80 0h-64v-48c0-17.6 14.4-32 32-32s32 14.4 32 32v48z"></path></svg>
            Select role
          </div>
        </div>
        <div id="runAs" style="display: none">
          <div style="display: flex; align-items:center">  
            <select id="roleId" name="roleId" class="webshell-toolbar-buttons-role-select">
              <option value="@doc">Specify a document</option>
              <option selected value="admin">Admin</option>
              <option value="server">Server</option>
              <option value="@role/MyCustomRole">MyCustomRole</option>
            </select>
            <span id="closeRunAs" style="color: #989898; cursor: pointer; margin-left: 10px">
              <svg width="10" class="svg-inline--fa fa-times fa-w-11 webshell-toolbar-buttons-cancel" aria-hidden="true" data-prefix="fas" data-icon="times" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" data-fa-i2svg=""><path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path></svg><!-- <i class="fas fa-times webshell-toolbar-buttons-cancel"></i> -->
            </span>
          </div>
          <div style="display: none" id="specifyDocument">
            <input id="collectionInput" name="collection" placeholder="Collection" />
            <input id="idInput" name="id" placeholder="ID" />
          </div>
        </div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>`;
  }

  private getHtmlForDesc() {
    return `
      <div>
        Verify your
        <a rel="noreferrer" target="_blank" href="https://docs.fauna.com/fauna/current/security/abac">
          ABAC
        </a>
        configuration by running your query with an Admin or Server
        <a rel="noreferrer" target="_blank" href="https://docs.fauna.com/fauna/current/security/keys#scoped-keys">
          key
        </a>
        , a specific
        <a rel="noreferrer" target="_blank" href="https://docs.fauna.com/fauna/current/security/roles">
          Role
        </a>
        , or a specific identity document. See
        <a rel="noreferrer" target="_blank" href="https://docs.fauna.com/fauna/current/security/">
          Fauna Security
        </a>
        for details.
      </div>
    `;
  }
}
function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
