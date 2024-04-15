import { extname, normalize } from 'path';
import { globSync } from 'glob';

/**
 * Loads all exported classes from the given directory.
 */
export async function importClassesFromDirectories(
  directories: string[],
  formats = ['.js', '.ts', '.tsx']
): Promise<Function[]> {
  const loadFileClasses = function (exported: any, allLoaded: Function[]) {
    if (exported instanceof Function) {
      allLoaded.push(exported);
    } else if (exported instanceof Array) {
      exported.forEach((i: any) => loadFileClasses(i, allLoaded));
    } else if (exported instanceof Object || typeof exported === 'object') {
      Object.keys(exported).forEach(key => loadFileClasses(exported[key], allLoaded));
    }

    return allLoaded;
  };

  const allFiles = directories.reduce((allDirs, dir) => {
    // Replace \ with / for glob
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return allDirs.concat(globSync(normalize(dir).replace(/\\/g, '/')));
  }, [] as string[]);

  const dirs = await Promise.all(
    allFiles
      .filter(file => {
        const dtsExtension = file.substring(file.length - 5, file.length);
        return formats.indexOf(extname(file)) !== -1 && dtsExtension !== '.d.ts';
      })
      .map(file => {
        return import(file);
      })
  );

  return loadFileClasses(dirs, []);
}
