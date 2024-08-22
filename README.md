# @hyrious/esbuild-plugin-external

An esbuild plugin to help you compute and mark external modules manually.

## Features

- Excludes `dependencies` and `peerDependencies` from `package.json`.
- Adds custom loader `with { external: "./replacement.js" }`.
- Automatically externalizes imports with pattern matching.

## Usage

```js
import external from '@hyrious/esbuild-plugin-external'

await esbuild.build({
  entryPoints: ['src/index.ts', 'src/cli.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  packages: 'bundle',
  plugins: [external()]
}).catch(() => process.exit(1))
```

### Options

```js
external({
  package: true,
  filter: /\.ts$/,
  auto: [{ filter: /\.js$/ }],
})
```

- **package**: Automatically mark dependencies and peer dependencies from package.json.
  This is enabled by default.

- **filter**: Filter in files to be enhanced to use import attribute `with { external: "replace" }`.
  This is disabled by default, you need to pass in a regex to make it work.
  Example:

  ```js
  import * as mod from '../foo' with { external: "./foo.js" }
  // will be bundled into =>
  import * as mod from './foo.js'
  ```

- **auto**: Filter in paths to be externalized and perform a simple replacement to strip leading `'../'`s.
  This is disabled by default, you need to pass in a config to make it work.
  Example:

  ```js
  // auto: [{ filter: /\.js$/ }]
  import * as mod from './index.js' // will be marked external
  import * as mod from '../foo.js' // will be externalized as './foo.js'
  ```

## License

MIT @ [hyrious](https://github.com/hyrious)
