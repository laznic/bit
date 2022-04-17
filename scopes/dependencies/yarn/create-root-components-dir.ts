import fs from 'fs-extra';
import path from 'path';
import { ComponentDependency, DependencyResolverMain } from '@teambit/dependency-resolver';
import { ComponentMap } from '@teambit/component';
import PackageJsonFile from '@teambit/legacy/dist/consumer/component/package-json-file';

export async function createRootComponentsDir({
  depResolver,
  rootDir,
  componentDirectoryMap,
}: {
  depResolver: DependencyResolverMain;
  rootDir: string;
  componentDirectoryMap: ComponentMap<string>;
}): Promise<Record<string, object>> {
  const pickedComponents = new Map<string, Record<string, any>>();
  const deps = await pickComponentsAndAllDeps(
    depResolver,
    Array.from(componentDirectoryMap.hashMap.keys()),
    componentDirectoryMap,
    pickedComponents
  );
  const copiesDir = path.join(rootDir, 'node_modules/.bit_components');
  await Promise.all(
    Array.from(pickedComponents.entries()).map(async ([rootComponentDir, packageJson]) => {
      const rel = path.relative(rootDir, rootComponentDir);
      const targetDir = path.join(copiesDir, rel);
      const modulesDir = path.join(rootComponentDir, 'node_modules');
      await fs.copy(rootComponentDir, targetDir, {
        filter: (src) => src !== modulesDir,
        overwrite: true,
      });
      await fs.writeJson(path.join(targetDir, 'package.json'), packageJson, { spaces: 2 });
    })
  );
  const newManifestsByPaths: Record<string, object> = {};
  for (const rootComponentDir of deps) {
    const rel = path.relative(rootDir, rootComponentDir);
    const targetDir = path.join(copiesDir, rel);
    const pkgJson = pickedComponents.get(rootComponentDir);
    if (pkgJson) {
      const compDir = path.join(rootDir, 'node_modules', pkgJson.name);
      newManifestsByPaths[compDir] = {
        name: pkgJson.name,
        dependencies: {
          [pkgJson.name]: `file:${path.relative(compDir, targetDir)}`,
          ...pkgJson.peerDependencies,
          ...pkgJson['defaultPeerDependencies'], // eslint-disable-line
        },
        // is it needed?
        installConfig: {
          hoistingLimits: 'dependencies',
        },
      };
    }
  }
  return newManifestsByPaths;
}

async function pickComponentsAndAllDeps(
  depResolver: DependencyResolverMain,
  rootComponentIds: string[],
  componentDirectoryMap: ComponentMap<string>,
  pickedComponents: Map<string, Record<string, any>>
) {
  const dependencies: string[] = [];
  await Promise.all(
    rootComponentIds.map(async (rootComponentId) => {
      const component = componentDirectoryMap.hashMap.get(rootComponentId);
      if (component) {
        dependencies.push(component[1]);
        let packageJsonObject = pickedComponents.get(component[1]);
        if (!packageJsonObject) {
          packageJsonObject = PackageJsonFile.createFromComponent(
            component[1],
            component[0].state._consumer
          ).packageJsonObject;
          pickedComponents.set(component[1], packageJsonObject);
        }
        const depsList = await depResolver.getDependencies(component[0]);
        const deps = await pickComponentsAndAllDeps(
          depResolver,
          depsList.dependencies
            .filter((dep) => dep instanceof ComponentDependency)
            .map((dep: any) => dep.componentId.toString()),
          componentDirectoryMap,
          pickedComponents
        );
        for (const dep of deps) {
          const pkgJson = pickedComponents.get(dep);
          if (pkgJson) {
            packageJsonObject.dependencies[pkgJson.name] = `file:${path.relative(component[1], dep)}`;
          }
        }
      }
    })
  );
  return dependencies;
}
