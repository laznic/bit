import { ComponentMap } from '../component/component-map';

// :TODO refactor to building an AST and generate source code based on it.
export function generateLink(componentMap: ComponentMap<string[]>, defaultModule?: string): string {
  return `
var componentMap = ${stringifyComponentMap(componentMap)};

${makeExports([
  ['componentMap', 'componentMap'],
  ['mainModule', defaultModule ? `require('${defaultModule}')` : '{}'],
])}
`;
}

export function makeExports(entries: [string, string][]) {
  return `
Object.defineProperty(exports, "__esModule", {
  value: true
});

${entries.map(([name, value]) => `exports.${name} = ${value};`).join('\n')}
`;
}

export function makeReExport(entries: [string, string][]) {
  const reexport = entries.map(([name, path]) => [name, `require('${path}')`] as [string, string]);
  return makeExports(reexport);
}

export function makeLinkUpdater(targetPath: string) {
  return `
var preview = require('${require.resolve('./preview.preview')}');
var modulesIndex = require('${targetPath}');
var updateModules = preview.updateModules;

updateModules(modulesIndex);

if(module.hot){
  module.hot.accept('${targetPath}', function() {
    var modules = require('${targetPath}');
    updateModules(modules);
  });
}
`;
}

function stringifyComponentMap(componentMap: ComponentMap<string[]>) {
  const items = componentMap
    .toArray()
    .map(
      ([component, paths]) => `'${component.id.fullName}': [${paths.map((path) => `require('${path}')`).join(', ')}]`
    )
    .join(',\n');

  return ['{', items, '}'].join('\n');
}
