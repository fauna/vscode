import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

function parseEnvironmentFile(src: string) {
  // Try parse JSON
  try {
    return JSON.parse(src.toString());
  } catch (err) {
    // Try parse envfile string
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
  }
}

export function getLocalKey(): string | undefined {
  const workspace = vscode.workspace.rootPath;
  const localConfigPath = path.resolve(workspace as string, '.fauna');
  if (fs.existsSync(localConfigPath)) {
    const settings = parseEnvironmentFile(fs.readFileSync(localConfigPath).toString());
    return settings.KEY as string;
  }
  return;
}
