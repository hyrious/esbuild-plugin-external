import { build } from 'esbuild'
import { external } from '../index.js'

await build({
  entryPoints: ['test/fixture.ts'],
  bundle: true,
  format: 'esm',
  plugins: [external({
    package: {
      path: 'test/pkg.json'
    },
    filter: /\bfixture\.ts$/,
    auto: [{ filter: /\.js/ }],
  })],
  target: 'chrome89', // Strips import attributes `with [}`.
  // Will print to stdout.
}).catch(() => process.exit(1))
