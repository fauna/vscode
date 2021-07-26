# How to Contribute

### Setup

1. [Fork](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) this repository

2. [Clone](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) the repository to your local system

```bash
$ git clone git@github.com:[YOUR_USER_NAME]/vscode.git

// OR

$ git clone https://github.com/[YOUR_USER_NAME]/vscode.git
```

3. Navigate into the cloned repository and open VSCode

```bash
$ cd vscode/
$ code .
```

4. Create a new `git` branch

```bash
$ git checkout -b my-descriptive-branch-name
```

5. Make changes to the files in your local repository

6. Test your work using the built-in VSCode debugger, which can be accessed from the Activity Bar or the Run > Start Debugging menu

7. [Push](https://help.github.com/en/github/using-git/pushing-commits-to-a-remote-repository) your work to a remote branch on your fork

8. [Issue a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request) against the `main` branch of the `fauna/vscode` repo


### Pull Request Guidelines

When issuing a PR, please do the following to help us expedite merging your work:

- **IMPORTANT:** Ensure [maintainers can make changes](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/allowing-changes-to-a-pull-request-branch-created-from-a-fork) to your PR

- Add a description to your PR

- Update the `README.md` file to describe your new functionality
