import * as fs from 'fs';
import * as os from 'os';
import * as Path from 'path';
import vscode from 'vscode';
import { SchemaItem } from './FaunaSchemaProvider';
import { formatFQLCode } from './fql';

const resolvePath = (filepath: string): string => {
  if (filepath[0] === '~') {
    const hoveVar = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
    return Path.join(
      process.env[hoveVar] ?? '',
      filepath.slice(1),
      'fauna-vscode-tmp'
    );
  } else {
    return Path.resolve(Path.join(filepath, 'fauna-vscode-tmp'));
  }
};

const tempdir = resolvePath(
  vscode.workspace.getConfiguration('createtmpfile').get('tmpDir') ||
    os.tmpdir()
);

if (!fs.existsSync(tempdir)) {
  fs.mkdirSync(tempdir);
}

export async function openJSONFile(content: string, item: SchemaItem) {
  try {
    const filePath = await saveTmpFile({
      item,
      content: formatFQLCode(content),
      ext: 'js'
    });
    const doc = await vscode.workspace.openTextDocument(filePath);
    vscode.window.showTextDocument(doc);
  } catch (err) {
    vscode.window.showErrorMessage(err.message);
  }
}

export async function openFQLFile(content: string, item?: SchemaItem) {
  try {
    let doc;
    if (item) {
      const filePath = await saveTmpFile({
        item,
        ext: 'fql',
        content: formatFQLCode(content)
      });
      doc = await vscode.workspace.openTextDocument(filePath);
    } else {
      doc = await vscode.workspace.openTextDocument({
        language: 'fql',
        content: 'Paginate(Collections())'
      });
    }
    vscode.window.showTextDocument(doc);
  } catch (err) {
    vscode.window.showErrorMessage(err.message);
  }
}

function saveTmpFile({
  item,
  ext,
  content
}: {
  item: SchemaItem;
  ext: string;
  content: string;
}): Promise<string> {
  // const name = item.parent ? [item.parent.ref.id, item.ref.id].join('#') : item.ref.id

  const itemName = [[item.contextValue, item.ref.id].join('#'), ext].join('.');
  let name;
  if (item.parent) {
    let parent: SchemaItem | undefined = item.parent;
    const paths = [];
    while (parent) {
      paths.unshift([parent.contextValue, parent.ref.id].join('#'));
      parent = parent.parent;
    }
    name = [...paths, itemName].join('.');
  } else {
    name = itemName;
  }

  const filePath = `${tempdir}${Path.sep}${name}`;
  return fs.promises.writeFile(filePath, content).then(() => filePath);
}
