# @flatfile/cross-env-config

`@flatfile/cross-env-config` is a lightweight, zero-dependency cross-environment configuration registry that works both in Node.js and browser environments. It is designed to provide a consistent way to access environment variables and configuration values across different types of JavaScript environments.

## Installation

You can install `@flatfile/cross-env-config` using npm:

```bash
npm install @flatfile/cross-env-config
```

Or with Yarn:

```bash
yarn add @flatfile/cross-env-config
```

## Basic Usage

To use `@flatfile/cross-env-config`, first import the `CrossEnvConfig` class:

```javascript
import { CrossEnvConfig } from '@flatfile/cross-env-config';
```

You can then use the `get` method to fetch the value of an environment variable:

```javascript
const value = CrossEnvConfig.get('MY_ENV_VAR');
```

This will first check if there are any overrides set for this key, then it will check the attached config registry, the attached config factory, and finally the environment variables.

### Setting Overrides

You can set override values for any key using the `set` method:

```javascript
CrossEnvConfig.set('MY_ENV_VAR', 'my value');
```

This value will take precedence over the attached config registry, config factory, and environment variables.

### Using a Config Registry

You can attach an object to act as a config registry. This is useful if you want to store your config values somewhere other than environment variables:

```javascript
const myConfig = {
  MY_ENV_VAR: 'my value',
  ANOTHER_ENV_VAR: 'another value',
};

CrossEnvConfig.attachConfigRegistry(myConfig);
```

The values in this registry will take precedence over the attached config factory and environment variables, but not over any overrides.

### Using a Config Factory

You can attach a function to act as a config factory. This is useful if you need to dynamically generate config values:

```javascript
CrossEnvConfig.attachConfigFactory((key) => {
  return `Value for ${key}`;
});
```

The values produced by this factory will take precedence over the environment variables, but not over any overrides or the attached config registry.

### Using Aliases

If you have different naming constructs for different environments, you can use the `alias` method to map one key to another:

```javascript
CrossEnvConfig.alias('MY_ENV_VAR', 'MY_ALIAS');
```

In this case, if `CrossEnvConfig.get('MY_ALIAS')` is called and no value is found for 'MY_ALIAS' in the override, registry, factory, or environment, it will return the value of 'MY_ENV_VAR'.

## Safety in Browsers and Node.js

`@flatfile/cross-env-config` is designed to work safely in both browser and Node.js environments. It checks the type of the `process` variable before attempting to access `process.env`, so it won't cause errors in a browser environment where `process.env` is undefined. It also checks the type of its registry and factory before trying to use them, so it won't break if they aren't properly set.
