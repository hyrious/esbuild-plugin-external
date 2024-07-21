import external from '..'
import { build } from 'esbuild'

let plugin = external({
  package: true,
  filter: /\.ts$/,
  auto: [{ filter: /\.js$/ }],
})

build({
  plugins: [plugin]
})
