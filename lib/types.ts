import type { OnLoadArgs, OnResolveArgs } from 'esbuild';

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
