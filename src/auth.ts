import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

function parseEnvironmentFile(src: string) {
  try {
    const result: any = {};
    const lines = src.toString().split('\n');
    for (const line of lines) {
      const match = line.match(/^([^=:#]+?)[=:](.*)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        result[key] = value;
      }
    }
    return result;
  } catch (error) {
    console.error(`Error parsing FAUNA_KEY from .faunarc: ${error}`)
  }
}

export function getLocalKey(): string | undefined {
  const workspace = vscode.workspace.rootPath;
  const localConfigPath = path.resolve(workspace as string, '.faunarc');
  if (fs.existsSync(localConfigPath)) {
    const settings = parseEnvironmentFile(fs.readFileSync(localConfigPath).toString());
    return settings.FAUNA_KEY as string;
  }
  return;
}
