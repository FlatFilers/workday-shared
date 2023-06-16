# @flatfile/listener

`@flatfile/listener` is Flatfile's core library. It combines event handling capabilities with Flatfile-specific functionality, such as working with Flatfile records and sessions. Simply put, it receives events and it responds to events. Period.

The `AuthenticatedClient` class serves as a foundation for authenticated API communication, while the event-related classes enable event-driven workflows within the Flatfile ecosystem.

## Components

Here's an overview of the package and its components:

### `FlatfileRecord and FlatfileRecords`

- These classes represent records and collections of records in the Flatfile format.
- They provide methods for manipulating and retrieving record data.

### `FlatfileSession`

- This class represents a session in the Flatfile platform.
- It stores information about the workspace, workbook, schema, uploads, and other session-related data.

### `EventCache`

- This class implements an event caching mechanism.
- It allows for caching and retrieval of event data based on cache keys.

### `EventHandler`

This class is an event handler implementation that extends the AuthenticatedClient class.

- It provides methods for registering event listeners, dispatching events, and managing child event handlers.
- It supports filtering events based on topic and context.
- It can be used to handle and process events in the Flatfile platform.

### `AuthenticatedClient`

This class is a base class for authenticated HTTP clients.

- It provides functionality for making authenticated HTTP requests using Axios.
- It handles access tokens, API URLs, and HTTP headers.

### Various utility functions and types:

`@flatfile/listener` includes utility functions and types related to event handling, filtering, and data manipulation.

These utilities support the functionality of the event handling and data processing components.

## Get Started

To get started with @flatfile/listener, follow our [Quickstart guide](https://flatfile.com/docs/quickstart/meet-the-workbook).
