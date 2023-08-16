# Flatfile CLI

The Flatfile CLI is a command-line tool that simplifies the integration process with Flatfile by providing developers with commands to manage and configure their integration from their local environment.

## Usage

```
Usage: flatfile [options] [command]

Flatfile CLI

Options:
  -V, --version                        output the version number
  -h, --help                           display help for command

Commands:
  deploy [options] [file]              Deploy your project as a Flatfile Agent
  develop|dev [file] [options] [file]  Deploy your project as a Flatfile Agent
  create:env [options]                 Create an Environment
```

## Commands

### `deploy`

```
Usage: flatfile deploy [options] [file]

Deploy your project as a Flatfile Agent

Options:
  -k, --token <url>    the authentication token to use (or set env FLATFILE_API_KEY or FLATFILE_BEARER_TOKEN)
  -h, --api-url <url>  (optional) the API URL to use (or set env FLATFILE_API_URL)
  --help               display help for command
```

### `develop`

```
Usage: flatfile develop|dev [file] [options] [file]

Deploy your project as a Flatfile Agent

Options:
  -k, --token <string>  the authentication token to use (or set env FLATFILE_API_KEY or FLATFILE_BEARER_TOKEN)
  -h, --api-url <url>   (optional) the API URL to use (or set env FLATFILE_API_URL)
  -e, --env <string>    (optional) the Environment to use (or set env FLATFILE_ENVIRONMENT_ID)
  --help                display help for command
```

### `create:env`

```
Usage: flatfile create:env [options]

Create an Environment

Options:
  -n, --name <name>      the name of the environment to create
  -k, --key <key>        the API Key to use
  -s, --secret <secret>  the API Secret to use
  -h, --help             display help for command
```
