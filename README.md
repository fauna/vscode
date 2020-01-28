# FaunaDB

VSCode extension for FaunaDB.

## Features

### Browse your database data

You can browse databases, indexes, collections, documents and functions.

\!\[Browser your database data\]\(media/browse-feature.png\)

### Run queries

\!\[Run queries\]\(media/query-feature.gif\)

**Commands**

* FaunaDB: Create query
* FaunaDB: Run query

## Extension Settings

Before you start you need to set your secret on Code > Preferences > Settings > Extensions > FaunaDB.

\!\[Extension settings\]\(media/extension-settings.png\)

* `faunadb.secretKey`: Your database secret. 

> Be careful. This setting should not be commited on .vscode local configuration to avoid leak secrets.

## Release Notes

### 1.0.0

* Browse databases, indexes, collections, documents and functions.
* Run queries
