import fs from 'node:fs'
import path from 'node:path'
import { Plugin, OnLoadArgs, OnResolveArgs } from 'esbuild'

export interface ExternalOptions {

  /**
   * Fill in the `external` build option by infering external modules from package.json upwards.
   * This is enabled by default. Set `false` to disable this behavior.
   */
  package?: boolean | {
    /** Path to package.json or its folder. By default it resolves from cwd. */
    path?: string;
    /** Externalize "dependencies", default is `true`. */
    dependencies?: boolean;
    /** Externalize "peerDependencies", default is `true`. */
    peerDependencies?: boolean;
    /** Externalize "optionalDependencies", default is `true`. */
    optionalDependencies?: boolean;
  };

  /**
   * Filter in source files to be enhanced by this plugin where you can write
   * import attributes like `import mod from "mod" with { external: "replace" }`.
   * Under the hood it uses the `onLoad()` callback to prepare necessary flags.
   * Then use the `onResolve()` callback to handle **all** files.
   *
   * So in case your files need to be handled by other plugins, there's no easy way
   * to compose plugins. You may need to write your all-in-one plugin by yourself.
   */
  filter?: RegExp;

  /** Further filter whether to enhance this file. */
  include?: (args: OnLoadArgs) => boolean | null | undefined

  /**
   * In addition to the `filter` option, this can be used to match import paths
   * to improve the performance. Default is match every import `/()/`.
   */
  filterResolve?: RegExp;

  /**
   * Automatically handle some paths if they match the pattern.
   * Under the hood it uses the `onResolve()` callback to handle these paths.
   * Example `[{ filter: /\.js$/ }]`.
   */
  auto?: {

    /** Filter in import paths to be externalized by this plugin. */
    filter: RegExp;

    /** Further filter whether to hanlde this path. */
    include?: (args: OnResolveArgs) => boolean | null | undefined

    /**
     * Replace the import path and use another for externalizing.
     * By default it strips leading `'../'` parts.
     */
    replace?: (path: string) => string | null | undefined;
  }[];
}

export function external(options: ExternalOptions = {}): Plugin {
  options.package ??= true

  return {
    name: 'hyrious:external',
    setup({ initialOptions, onResolve, onLoad }) {
      if (options.package) {
        const external = initialOptions.external ||= []
        mergeIntoArray(external, inferExternal(options.package))
      }

      if (options.auto) for (const config of options.auto) {
        const replace = config.replace ?? defaultReplace

        onResolve({ filter: config.filter }, args => {
          if (config.include && !config.include(args)) return;
          let p = replace(args.path)
          if (p) return { path: p, external: true, pluginData: args.pluginData };
        })
      }

      if (options.filter) {
        const mark = 'hyrious:external'

        onLoad({ filter: options.filter }, async args => {
          if (options.include && !options.include(args)) return;
          const contents = await fs.promises.readFile(args.path)
          return { contents, loader: 'default', pluginData: { [mark]: true } }
        })

        onResolve({ filter: options.filterResolve ?? /()/ }, args => {
          if (args.pluginData && args.pluginData[mark] && args.with['external'])
            return { path: args.with.external, external: true }
        })
      }
    }
  }

  function inferExternal(pkg: Exclude<ExternalOptions['package'], false | undefined>) {
    let cwd = process.cwd(), dep = true, peer = true, optional = true
    if (pkg !== true) {
      cwd = pkg.path ?? cwd
      dep = pkg.dependencies ?? dep
      peer = pkg.peerDependencies ?? peer
      optional = pkg.optionalDependencies ?? optional
    }

    let json: any
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

  function mergeIntoArray(a: string[], b: string[]) {
    const set = new Set(a)
    for (const item of b) {
      if (set.has(item)) continue;
      set.add(item)
      a.push(item)
    }
  }

  function defaultReplace(path: string) {
    return path.replace(/^(\.\.\/)+/, './')
  }
}

export { external as default }
