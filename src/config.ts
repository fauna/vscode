import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface Config {
  secret: string;
  scheme?: 'http' | 'https';
  domain?: string;
  port?: number;
}

export function loadConfig(): Config {
  const env = loadEnvironmentFile();
  const config = vscode.workspace.getConfiguration('fauna');

  const secret = env.FAUNA_KEY || config.get('adminSecretKey', '');

  if (!secret) {
    throw new Error('Please provide secret key');
  }

  const domain = env.FAUNA_DOMAIN || config.get('domain');
  const scheme = env.FAUNA_SCHEME || config.get('scheme');
  const port = env.FAUNA_PORT || config.get('port');

  return {
    secret,
    ...(!!scheme && { scheme }),
    ...(domain && { domain }),
    ...(port && { port })
  };
}

interface Env {
  FAUNA_KEY?: string;
  FAUNA_SCHEME?: 'http' | 'https';
  FAUNA_DOMAIN?: string;
  FAUNA_PORT?: number;
}

function loadEnvironmentFile() {
  let env: Env | undefined;

  const { workspaceFolders } = vscode.workspace;
  if (workspaceFolders) {
    workspaceFolders.find(workspace => {
      if (workspace.uri.scheme === 'file') {
        const envPath = path.join(workspace.uri.fsPath, '.faunarc');
        try {
          env = parseEnvironmentFile(fs.readFileSync(envPath, 'utf8'));
          return true;
        } catch (e) {
          if (e.code !== 'ENOENT') {
            console.error(`Error parsing ${envPath}\n`, e);
          }
        }
      }
    });
  }

  return env || {};
}

function parseEnvironmentFile(src: string) {
  const result: { [key: string]: any } = {};
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
