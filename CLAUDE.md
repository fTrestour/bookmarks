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
