# Hooks

- `npm run build` - Build the package
- `npm run dev` - Run all development build and watch locally
- `npm run lint` - Lint the packages
- `npm run clean` - Removes `node_modules`, `dist` folder, and `.turbo` caches
- `npm run test` - Run tests

## Testing layer versions

1. build the `/hooks` package `npm run build`
2. move `/hooks/dist` directory to `/Downloads`, rename it `Downloads/data-hooks-sdk` and compress it in a .zip file
3. log into aws Flatfile Developers management console > Lambda > Layers > data-hooks-sdk
4. click create version, upload .zip and add a description
5. find an active data hook id in your local database `data_hooks.lambda_arn` (id starts with "generate:")
6. navigate to Lambda > Functions and search for the data hook by id
7. update the hook's layer version to the new one you just created
8. run the hook in the management console Test tab with a sample payload
