import fs from 'node:fs'
import path from 'node:path'

/**
 * @import { Plugin, PluginBuild } from 'esbuild'
 * @import { ExternalOptions } from './lib/types.ts'
 */

/**
 * Compute and mark external modules.
 * 
 * @param {ExternalOptions} options
 * @returns {Plugin}
 */
export function external(options = {}) {
  options.package ??= true

  return {
    name: 'hyrious:external',
    setup({ initialOptions, onResolve, onLoad }) {
      if (options.package) {
        const external = initialOptions.external ||= []
        mergeIntoArray(external, inferExternal(options.package))
      }

      if (options.auto) for (const config of options.auto) {
        handleAuto(config, onResolve)
      }

      if (options.filter) {
        const mark = 'hyrious:external'

        onLoad({ filter: options.filter }, async args => {
          if (options.include && !options.include(args)) return;
          const contents = await fs.promises.readFile(args.path)
          return { contents, loader: 'default', pluginData: { [mark]: true } }
        })

        onResolve({ filter: /()/ }, args => {
          if (args.pluginData && args.pluginData[mark] && args.with['external'])
            return { path: args.with.external, external: true }
        })
      }
    }
  }

  /**
   * @param {Exclude<ExternalOptions['package'], false | undefined>} pkg
   * @returns {string[]}
   */
  function inferExternal(pkg) {
    let cwd = process.cwd(), dep = true, peer = true, optional = true
    if (pkg !== true) {
      cwd = pkg.path ?? cwd
      dep = pkg.dependencies ?? dep
      peer = pkg.peerDependencies ?? peer
      optional = pkg.optionalDependencies ?? optional
    }

    let json
    if (fs.existsSync(cwd) && fs.statSync(cwd).isFile()) {
      json = JSON.parse(fs.readFileSync(cwd, 'utf8'))
    } else for (let i = 0; i < 100; i++) {
      let p = path.join(cwd, 'package.json')
      if (fs.existsSync(p)) {
        json = JSON.parse(fs.readFileSync(p, 'utf8'))
        break
      }
      let dir = path.dirname(cwd)
      if (dir == cwd) break;
      cwd = dir
    }

    let deps = {}
    if (dep) Object.assign(deps, json.dependencies);
    if (peer) Object.assign(deps, json.peerDependencies);
    if (optional) Object.assign(deps, json.optionalDependencies);

    return Object.keys(deps)
  }

  /**
   * @param {string[]} a
   * @param {string[]} b
   */
  function mergeIntoArray(a, b) {
    const set = new Set(a)
    for (const item of b) {
      if (set.has(item)) continue;
      set.add(item)
      a.push(item)
    }
  }

  /**
   * @param {NonNullable<ExternalOptions['auto']>[0]} config
   * @param {PluginBuild['onResolve']} onResolve
   */
  function handleAuto(config, onResolve) {
    const replace = config.replace ?? function defaultAutoReplace(path) {
      return path.replace(/^(\.\.\/)+/, './')
    }

    onResolve({ filter: config.filter }, args => {
      if (config.include && !config.include(args)) return;
      let p = replace(args.path)
      if (p) return { path: p, external: true, pluginData: args.pluginData };
    })
  }
}

export default external
