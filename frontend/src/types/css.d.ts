/**
 * Declares support for importing CSS Modules (*.module.css) in TypeScript.
 */
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
