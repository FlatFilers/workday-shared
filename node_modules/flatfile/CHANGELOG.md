# @flatfile/cli

## 3.4.4

### Patch Changes

- 438d908: resolve a bug with event streaming

## 3.4.3

### Patch Changes

- d23b665: improving error message on entry file

## 3.4.2

### Patch Changes

- 60a94d7: share file discovery logic

## 3.4.1

### Patch Changes

- aaaf3cf: subscribe to more events

## 3.4.0

### Minor Changes

- 637342b: Remove @flatfile/api from listener

## 3.3.8

### Patch Changes

- 626f896: check for .ts files when running npx flatfile

## 3.3.7

### Patch Changes

- 9641918: Fix develop command for using node fetch

## 3.3.6

### Patch Changes

- 46357d9: flatfile deploy and develop

## 3.3.5

### Patch Changes

- 919c1f1: Adds backwards compatible support for legacy events

## 3.3.4

### Patch Changes

- 8ea7135: Fix the events being subscribed to on publish

## 3.3.3

### Patch Changes

- 0cbf01b: Add lower cpu compilation mode FLATFILE_COMPILE_MODE=no-minify

## 3.3.2

### Patch Changes

- 73cec59: Adding support for any type of entry file

## 3.3.1

### Patch Changes

- fe4762d: Resolve deployment bug

## 3.3.0

### Minor Changes

- 640b392: Add flatfile deploy command for platform usecases

## 3.2.3

### Patch Changes

- 55f9fff: Update API version and use configless space creation in listener example.

## 3.2.2

### Patch Changes

- 8ed4e8c: Bumps API version and adds support for record metadata to @flatfile/hooks.

## 3.2.1

### Patch Changes

- a66cacd: Subscribes agent deploys to all events as well

## 3.2.0

### Minor Changes

- 73b65b8: added all event topics to listener

## 3.1.20

### Patch Changes

- 2e25be3: Update packages with updated @flatfile/api

## 3.1.19

### Patch Changes

- 4b918a2: Adds the new @flatfile/listener package
- 53a2990: Add labels to Workbooks

## 3.1.18

### Patch Changes

- 51ba23e: Adds Env Vars to Agent Code

## 3.1.17

### Patch Changes

- cf3bd5f: Update @flatfile/api version

## 3.1.16

### Patch Changes

- 2e82812: Move XLSX file Processing to Agent code

## 3.1.15

### Patch Changes

- 70df9ce: Add check for git and node

## 3.1.14

### Patch Changes

- 8a2463f: Adds support for stageVisibility:{ mapping:false } to XDK
- 69dd081: Adds Actions to Sheet

## 3.1.13

### Patch Changes

- 4724aed: Adds a shortcut for local X deployment with the XDK

## 3.1.12

### Patch Changes

- d91ad36: Adds ReferenceField to create reference field types in X
- a57c57c: Adds -x flag to CLI Init script to generate a repo ready to deploy to X
- d91ad36: Adds LinkedField support for XDK Deployments

## 3.1.11

### Patch Changes

- 4a12d2e: Cleanup some cruft

## 3.1.10

### Patch Changes

- 228063d: Adds a tool to create environments in X
- 49dc29e: Gives X deployment objects the practical overrides for names and slugs

## 3.1.9

### Patch Changes

- 8ba53bf: Adds a final update deployment mutation

## 3.1.8

### Patch Changes

- 48a118c: Cleanup

## 3.1.7

### Patch Changes

- 745a73e: XDK publishing

## 3.1.5

### Patch Changes

- ad818ee: feat: initial implementation of GroupByField, and sheetCompute infrastructure on top of sheet

## 3.1.4

### Patch Changes

- ca74bc6: fix: remove errant console log in init command

## 3.1.3

### Patch Changes

- fb24161: chore: update readme

## 3.1.2

### Patch Changes

- 635291a: fix bug where values passed in as options to the init command are undefined

## 3.1.1

### Patch Changes

- af94de4: fix bug where the CLI failed if a package.json file was not present in the root dir

## 3.1.0

### Minor Changes

- 1792c54: Adds init command and improvments to stack traces during publish

## 3.0.3

### Patch Changes

- f47369c: Fixes allowCustomFields feature from the platform-sdk

## 3.0.2

### Patch Changes

- d979841: Made the 'test' env the default option for deploy

## 3.0.1

### Patch Changes

- 0bb3cbc: Add Portal Deploys via SDK

## 3.0.0

### Major Changes

- 56a292f: Updated from old package

## 0.2.0

### Minor Changes

- 8732a95: Adds passing the environment slug along with deployments and schemas

### Patch Changes

- 4e9f937: organize publish steps, provide summary

## 0.1.0

### Minor Changes

- 5819944: Alpha base functionality

## 0.0.3

### Patch Changes

- Bundle all externals

## 0.0.2

### Patch Changes

- Modify the file param structure
