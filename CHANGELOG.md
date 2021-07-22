# Change Log

## 1.8.2

- Allows to modify/create/delete resources
- Fixes Graphql schema files inability to upload or merge if it has more than one dot . in file name
- Adds ability to run queries with different roles

## 1.7.2

- Revised comment syntax to use `//` instead of `#`.
- Improved GraphQL file type check for the `uploadGraphqlSchema` command.
- Added GraphQL domain configuration item.

## 1.7.1

- New branding leftover fixes (nested databases data couldn't be opened)

## 1.7.0

- Only one Client instance is ever created
- Renamed faunadb.get command to faunadb.open
- Added faunadb.query command for easy Client reuse
- Adds ability to configure domain, scheme, port
- New branding updates
- Makes it possible to run multiline queries

## 1.6.0

- Add the new functions `CreateAccessProvider`, `AccessProvider`, `AccessProviders`, `CurrentIdentity`, `HasCurrentIdentity`, `CurrentToken` and `HasCurrentToken`.

## 1.5.0

- Add an alias of the `Contains` function called `ContainsPath`, and deprecated the `Contains` function.
- Add the new functions `ContainsField` and `ContainsValue` functions to make it easier to explore the structure of objects and documents.
- Add the new `Reverse` function to reverse the order of items in an Array, Page, or Set.

## 1.3.2

- Fix syntax highlight setup.

## 1.3.1

- Update README and CHANGELOG

## 1.3.0

- Add minimal syntax highlight to FQL file extension. [maestroartistryconsulting](https://github.com/maestroartistryconsulting)
- Fix graphQL schema upload. [maestroartistryconsulting](https://github.com/maestroartistryconsulting)

## 1.2.0

- Add commands to upload, merge, and override GraphQL schema. [nksaraf](https://github.com/nksaraf)
- Add flexible auth via a .faunarc config file. [gahabeen](https://github.com/gahabeen)
- Add `Documents()` on query runner.

## 1.1.0

- Highlight FQL expression and run selected FQL query. [jfloresremar](https://github.com/jfloresremar)

## 1.0.0

- Browse databases, indexes, collections, documents, and functions.
- Run queries.
