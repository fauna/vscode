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
  const config = vscode.workspace.getConfiguration('faunadb');

  let domain = env.FAUNA_URL || config.get('baseURL');
  let scheme: any;
  let port: any;

  if (domain) {
    if (domain.includes('://')) {
      [scheme, domain] = domain.split('://');
    }
    [domain, port] = domain.split(':');
    if (port !== undefined) {
      port = Number(port);
    }
  }

  return {
    secret: env.FAUNA_KEY || config.get('adminSecretKey') || 'secret',
    scheme,
    domain,
    port
  };
}

interface Env {
  FAUNA_KEY?: string;
  FAUNA_URL?: string;
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
