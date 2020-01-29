# FaunaDB

Source code for the VS Code extension for FaunaDB.

This extension allows users to view and edit their FaunaDB documents from directly inside VS Code. Additionally, users will be able to run [FQL queries](https://docs.fauna.com/fauna/current/api/fql/) within VS Code.

## Prerequisites

Be sure to install [VS Code](https://code.visualstudio.com/Download) and to create a [FaunaDB account](https://dashboard.fauna.com/accounts/register).

## Getting Started

To get started using the FaunaDB VS Code extension, you'll need to set your secret key in order to access database information. Keys can be created in the [FaunaDB Console webapp](https://dashboard.fauna.com/) or via the [Shell CLI](https://github.com/fauna/fauna-shell).

To set the key, go to `Code > Preferences > Settings > Extensions > FaunaDB`.

![Extension settings](media/extension-settings.png)

* `faunadb.secretKey`: Your database secret.

> WARNING: Be careful! To avoid exposing this secret, do not commit it to your local `.vscode` configuration.

## Features

**Commands**

* FaunaDB: Create query
* FaunaDB: Run query

![FaunaDB commands](media/fauna-commands.png)

### Browse database

With this extension, you can browse the databases, indexes, collections, documents, and functions associated with your FaunaDB database right inside of the VS Code sidebar.

![Browser your database data](media/browse-feature.png)

### Run queries

In addition to browsing your data, this extension also allows you to run [FQL queries](https://docs.fauna.com/fauna/current/api/fql/) against your FaunaDB database.

![Run queries](media/query-feature.gif)

## Release Notes

### 1.0.0

* Browse databases, indexes, collections, documents, and functions.
* Run queries

## Built With

* [FaunaDB](https://fauna.com/)

## Contributors

* **Bruno Quaresma** - [Github](https://github.com/BrunoQuaresma)
