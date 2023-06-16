# @flatfile/utils-debugger

This package is a utility debugger designed to facilitate the tracking, logging and debugging of various events, issues and processes in your application. It features a colorful console output for better visibility and understanding of the status of your system.

## Features

- HTTP request logging
- Event subscription logging
- Event logging
- Logging for warnings, success, and errors
- General purpose logging

## Usage

The @flatfile/utils-debugger package provides a `Debugger` class which exposes several static methods. Each of these methods are designed to log specific types of events or issues.

Here is a brief overview of the available methods:

### logHttpRequest(params)

Logs details about HTTP requests. It takes an object with the following properties:

- `method`: The HTTP method (GET, POST, PUT, DELETE, etc.)
- `url`: The request URL.
- `statusCode`: The HTTP status code.
- `headers`: The request headers.
- `startTime`: The time when the request started.
- `error` (optional): Any error that occurred during the request.

The log includes the method, status code, URL, and time elapsed since the start of the request.

```shell
  ✓ 100ms      GET     200 https://example.com
```

### logEventSubscriber(query, filter)

Logs details about an event subscriber.

- `query`: The query or array of queries the subscriber is listening for.
- `filter`: The filter applied to the subscriber (optional).

```shell
 ↳ on(user.created), {}
```

### logEvent(event)

Logs details about a given event.

- `event`: The event object to log. It must have `topic`, `createdAt`, and `id` properties.

```shell
 ▶ user.created 5:58:30.572 PM 4hs98r
```

### logWarning(message), logSuccess(message), logError(message, label, prefix)

Logs warnings, successes, and errors.

- `message`: The message to log.
- `label` and `prefix` are optional parameters for the `logError` function.

```shell
  ⚠️ Disk space running low
  ✅ File uploaded successfully
  🔴 Error:FileError File not found
```

### log(callback)

A general purpose log method, it accepts a callback function that returns the string to log. The callback receives a colors object that you can use to apply color to parts of your message.

## Installation

To install the @flatfile/utils-debugger package, use npm or yarn:

```
npm install @flatfile/utils-debugger
```

or

```
yarn add @flatfile/utils-debugger
```

## Dependencies

This package has a dependency on the ansi-colors package for coloring console output.

## Examples

```javascript
import { Debugger } from '@flatfile/utils-debugger'

Debugger.logHttpRequest({
  method: 'GET',
  url: 'https://example.com',
  statusCode: 200,
  headers: {},
  startTime: Date.now(),
})

Debugger.logEventSubscriber('user.created')

Debugger.logEvent({
  topic: 'user.created',
  createdAt: new Date(),
  id: 'abcd1234',
})

Debugger.logWarning('Disk space running low')

Debugger.logSuccess('File uploaded successfully')

Debugger.logError('File not found', 'FileError', 'Upload')
```
