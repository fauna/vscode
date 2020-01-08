import vscode from 'vscode';

export default () => async () => {
  let doc = await vscode.workspace.openTextDocument({
    language: 'fql'
  });

  await vscode.window.showTextDocument(doc, { preview: true });
};
