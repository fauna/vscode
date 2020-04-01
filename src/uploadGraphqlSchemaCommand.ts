import vscode from 'vscode';

export default (
  mode: string = 'merge',
  adminSecretKey: string,
  outputChannel: vscode.OutputChannel
) => async () => {
  const { activeTextEditor } = vscode.window;

  if (!activeTextEditor || activeTextEditor.document.languageId !== 'graphql') {
    vscode.window.showWarningMessage(
      'You must select a Graphql document (`.graphql` or `.gql`) to upload a schema.'
    );
    return;
  }


  const selection = activeTextEditor.selection;
  const selectedText = activeTextEditor.document.getText(selection);
  const fqlExpression = selectedText.length > 0 ? selectedText : activeTextEditor.document.getText();
  if (fqlExpression.length < 1) {
     vscode.window.showWarningMessage(
      'Selected file or selected text must have a GraphQL Schema to run'
    );
    
    return;
  }

  outputChannel.appendLine('');
  outputChannel.appendLine(`UPLOADING SCHEMA (mode=${mode}): ${activeTextEditor.document.fileName}`);
  outputChannel.show();

  try {
    const buffer = Buffer.from(fqlExpression, "utf-8");
    const result = await fetch(`https://graphql.fauna.com/import?mode=${mode}`, {
      method: "POST",
      headers: {
        'AUTHORIZATION': `Bearer ${adminSecretKey}`
      },

      body: buffer
    });
    outputChannel.appendLine('');
    outputChannel.appendLine('RESPONSE:');
    outputChannel.appendLine(await result.text());

  } catch (error) {
    let message = error.message;
    outputChannel.appendLine('ERROR:');
    outputChannel.appendLine(message);
  }
};