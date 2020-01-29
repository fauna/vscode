# Instructions

Most of the content on this guide is following the (VSCode extension documentation)[https://code.visualstudio.com/api/get-started/your-first-extension]. You should at least, read the `GET STARTED` session before move on.

## Development

To start the development you have to clone this repo and install the dependencies using `yarn`. 
```bash
yarn install
```

To use the extension during development you should go to `Debug and Run > Play`. It will open a new VSCode window with the extension installed.

## Tests

There is no tests at this moment but we want to add those in a next time. Here is the (official docs about extension testing)[https://code.visualstudio.com/api/working-with-extensions/testing-extension].

## Packaging

The following command will generate a `.vsix` file to be published. You can share this file on PRs and teamates to QA it before the official publish.

```bash
yarn vsce package
```

For more info you can check the (Publish Extension guide)[https://code.visualstudio.com/api/working-with-extensions/publishing-extension].