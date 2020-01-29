# Instructions

Most of the content in this guide follows the official (VSCode extension documentation)[https://code.visualstudio.com/api/get-started/your-first-extension]. You should read the `Get Started` section before moving on.

## Development

To begin development, you'll need to clone this repo to your local system and install the dependencies using `yarn`.
```bash
git clone https://github.com/fauna/vscode.git
cd ./vscode
yarn install
```

To use the extension during development, go to `Debug and Run > Play`. This will open a new VS Code window with the extension installed.

## Tests

Currently, there are no tests, but we will want to add those in the future. 

For references, here are the (official docs about extension testing)[https://code.visualstudio.com/api/working-with-extensions/testing-extension].

## Packaging

The following command will generate a `.vsix` to publish. You can also share this file with teammates in order to QA test it before release.

```bash
yarn vsce package
```

For more info you can check the (Publish Extension guide)[https://code.visualstudio.com/api/working-with-extensions/publishing-extension].
