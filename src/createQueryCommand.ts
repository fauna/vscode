import vscode from 'vscode';

export default () => async () => {
  let doc = await vscode.workspace.openTextDocument({
    language: 'fql',
    content: 'Paginate(Collections())'
  });

  await vscode.window.showTextDocument(doc, { preview: true });
};
