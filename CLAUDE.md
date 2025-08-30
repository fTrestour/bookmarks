# Prime

Here are some instructions to load essential context.

## Instructions

- Run `git ls-files` to understand the codebase structure and file organization
- Read the README.md to understand the project purpose, setup instructions, and key information
- Read package.json to understand the project dependencies and scripts
- Provide a concise overview of the project based on the gathered context

## Context

- Codebase structure git accessible: !`git ls-files`
- Codebase structure all: !`eza . --tree`
- Project README: @README.md
- Project dependencies: @package.json

# Code style

- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')

# Workflow

When you’re done making a series of code changes YOU MUST:

- Run `npm run check-types` to check for type errors
- Run `npm run lint` to run the linter
- Run `npm run format` to format the code
- Run `npm run test` to run the tests

# Testing

Prefer running single tests, and not the whole test suite, for performance

- Run `npm run test` to run the tests
- Run `npm run test:watch` to run the tests in watch mode

# Bash commands

You can manually test endpoints using the `curl` command, along with `jq` if needed.
You also have access to the `docker` command to debug the container.

- Always commit regularly to create atomic commits that are easy to review
