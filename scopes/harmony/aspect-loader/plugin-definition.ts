export interface PluginDefinition<T> {
  /**
   * regex pattern for detecting the definition file within a component.
   */
  pattern: string | RegExp;

  /**
   * runtimes for the plugin to apply.
   */
  runtimes: string[];

  /**
   * register the plugin to its slot registry.
   */
  register(object: T): void;
}
