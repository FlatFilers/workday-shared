# Flatfile CLI

Interact with Flatfile systems via CLI

## Usage

```
Usage: flatfile [options] [command]

Flatfile CLI

Options:
  -V, --version             output the version number
  -h, --help                display help for command

Commands:
  publish [options] [file]  Publish a Workbook
  init [options]            Initialize a project
  help [command]            display help for command
```

## Commands

### Init

```
Usage: flatfile init [options]

Initialize a project

Options:
  -e, --environment <env>  the Environment to publish to
  -k, --key <key>          the API Key to use
  -n, --name <name>        the name of the your project
  -s, --secret <secret>    the API Secret to use
  -t, --team <team>        the Team ID to publish to
  -h, --help               display help for command
```

### Publish

```
Usage: flatfile publish [options] [file]

Publish a Workbook

Arguments:
  file                  Path to Workbook file to publish (default: "./src/index.ts")

Options:
  -t, --team <team-id>  the Team ID to publish to
  --api-url <url>       the API url to use
  -h, --help            display help for command
```

## Development

We use the [commander](https://www.npmjs.com/package/commander) library for our CLI

Before developing the CLI, run the following npm commands to ensure node_modules have the latest versions of all imported packages.

```
# Removes all `node_modules`, `dist` folders, and `.turbo` caches (runs each package's clean script)
npm run clean
npm i
# Runs all packages locally
npm run dev
```

Commands are defined in `index.ts` and command logic lives under the corresponding file inside `actions`.

### Testing a command

```
# Ensure package builds before running commands locally
npm run build
```

```
# Run new command from entrypoint
./packages/cli/dist/index.js <new-command>
```

### Configure

Configure variables in `.env`

### Build

Running `npm run build -- --filter flatfile` will generate a production bundle

### Deploy

`cd ./packages/cli/; ./dist/index.js publish ../../apps/sandbox/src/setup.ts` will use the current build to run the publish command and attempt to publish the sandbox workbook
