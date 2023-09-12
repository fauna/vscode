# [Fauna extension for VS Code](https://marketplace.visualstudio.com/items?itemName=fauna.fauna)

Source code for the [Fauna VS Code extension](https://marketplace.visualstudio.com/items?itemName=fauna.fauna).

This [extension](https://marketplace.visualstudio.com/items?itemName=fauna.fauna) allows users to view individual Fauna databases and run [FQL queries](https://docs.fauna.com/fauna/current/api/fql/) directly inside VS Code.

**Note: This extension does not yet support auto-complete, which is planned for a future release. Alternatively, please feel free to submit a PR to help out!**

## Getting started

### Prerequisites

1. Create a [Fauna account](https://dashboard.fauna.com/accounts/register)

2. Install [VS Code](https://code.visualstudio.com/Download)

3. Install the [Fauna extension](https://marketplace.visualstudio.com/items?itemName=fauna.fauna) in VS Code.

### 1. Set your secret key

You can persist a Fauna secret using either a `.faunarc` file in your project or using the settings in the VS Code IDE.

Persisting a secret in VS Code settings sets the key at a global level for all projects. A project can override the global key by including a `.faunarc` config file in the root of the project.

#### Using a `.faunarc` file for a project

1. **IMPORTANT:** Add `.faunarc` to your `.gitignore`.
2. Create a file `.faunarc` in your project root folder.
3. Add `FAUNA_KEY=your-secret-key` to the `.faunarc` file.

Additionally, the config file supports these optional parameters:

```
FAUNA_DOMAIN=db.fauna.com
FAUNA_SCHEME=https
FAUNA_PORT=443
FAUNA_GRAPHQL_HOST=https://graphql.fauna.com
```

#### Using VS Code to store a database key

1. The VS Code extension allows you to work in the context of a single database, for which you need to provide a key. You can do this by generating a key with the "admin" role from the database "Security" tab in the Fauna Dashboard.

> Note that you'll need to update the Fauna domain in the extension settings (or `.faunarc` file) as needed to match the database Region Group; see [the Region Group documentation](https://docs.fauna.com/fauna/current/learn/understanding/region_groups#how-to-use-region-groups) for more details.

2. Copy the secret and paste it in the Fauna extension settings. You can find the Fauna extension settings by either:

- Selecting `View > Extensions` to open the Extensions pane, scrolling down in the list of installed extensions until you see Fauna, then clicking the cog icon in the lower right to open the extension settings.

- Selecting `Code > Preferences > Settings > Extensions > Fauna` from the VS Code menu.

3. Restart VS Code after setting or changing your secret.

![Extension settings](media/extension-settings.png)

- `fauna.adminSecretKey`: The secret for a specific database.
- `fauna.domain`: The Fauna domain for the database [Region Group](https://docs.fauna.com/fauna/current/learn/understanding/region_groups#how-to-use-region-groups) or `localhost` when using a local Fauna Dev Docker instance.
- `fauna.scheme`: One of `https` or `http`. Only set to `http` when using a local Fauna Dev Docker instance.
- `fauna.port`: The port number for the Fauna endpoint. When using a Fauna Dev Docker instance, use the port passed to the `docker run` command - usually `8443`.
- `fauna.graphqlHost`: The full URL for the Fauna GraphQL API. The default is `https://graphql.fauna.com`. See [GraphQL Endpoints](https://docs.fauna.com/fauna/current/api/graphql/endpoints) for Region Group-specific URLs.

> **WARNING**: Be careful! To avoid exposing this secret, do not commit it to your local `.vscode` configuration.

### 2. Browse database

1. Click on the Fauna bird icon in the Activity bar on the far left. If you do not see the Activity Bar, select `View > Appearance > Show Activity Bar` from the VS Code menu.
2. You should see a pane listing all of the database contents, which includes child databases, indexes, collections, documents, and functions.

**Note: Browsing is read-only at this time, but you can edit all of your data by running queries (see next section).**

![Browse your database data](media/browse-feature.png)

### 3. Run queries

1. If you are on a Mac, open the command palette with the keyboard shortcut `Cmd` + `Shift` + `P`. If you are on a PC, use `Ctrl` + `Shift` + `P`.

2. Create a new file from which to run your [FQL queries](https://docs.fauna.com/fauna/current/api/fql/) by either:

- Typing `Fauna: Create query` to select that command from the command palette dropdown menu. This opens a new tab with the `Paginate(Collections())` query already included.

- Creating a new file with the `.fql` file extension.

3. Open the command palette again using `Cmd` + `Shift` + `P`, but this time start typing `Fauna: Run query` to select that command from the dropdown menu.

4. The Output panel should open from the bottom of the VS Code window and display the query results.

![Run queries](media/query-feature.gif)

5. If your file contains multiple FQL expressions, you can trigger them individually by highlighting the expression you want to execute.

![Run selection query](media/selection-query.gif)

### 4. Upload GraphQL Schema

1. Open a `.graphql` or `.gql` file containing your GraphQL schema as described in the [Fauna specification](https://docs.fauna.com/fauna/current/api/graphql).

2. If you are on a Mac, open the command palette with the keyboard shortcut `Cmd` + `Shift` + `P`. If you are on a PC, use `Ctrl` + `Shift` + `P`.

3. Fauna provides commands for uploading schemas, depending on [modes](https://docs.fauna.com/fauna/current/api/graphql/endpoints#modes):

- Enter `Fauna: Upload GraphQL Schema` to upload in the default `merge` mode.

- Enter `Fauna: Merge GraphQL Schema` to explicitly upload in `merge` mode.

- Enter `Fauna: Override GraphQL Schema` to upload in `override` mode.

> **WARNING**: `override` mode causes data loss for any previous GraphQL schema. Collections, indexes, or documents that are not involved in GraphQL are not affected.

![Upload GraphQL schema](media/upload-schema-cmd.gif)

## Features

**Commands**

- Fauna: Create query
- Fauna: Run query
- Fauna: Upload GraphQL Schema
- Fauna: Merge GraphQL Schema
- Fauna: Override GraphQL Schema

![Fauna commands](media/fauna-commands.png)

## Built With

- [Fauna](https://fauna.com/)
