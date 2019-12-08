import { readFileSync, writeFileSync, readdirSync } from 'fs';
import * as ts from 'typescript';
import { parseSourceFile } from './parse-source-file';
import { generateUnitTest } from './generate-unit-test';
import { DependencyHandler } from './model';
import { dependencyHandlers } from './dependency-handlers';

export function run(params: string[]) {
  if (!params.length) {
    // tslint:disable-next-line:no-console
    console.error('missing path argument');
    process.exit(1);
  }

  if (params.length > 1 && params[0].indexOf('--require') === 0) {
    require(params[1]);
    params = params.slice(2);
  }

  const handlers: DependencyHandler[] = [];
  if (params.length > 1 && params[0].indexOf('--handlers') === 0) {
    const files = readdirSync(params[1]);
    files.forEach((file) => {
      const value = require(process.cwd() + '/' + params[1] + '/' + file);
      handlers.push(value.default || value);
    });
    params = params.slice(2);
  }
  handlers.push(...dependencyHandlers);

  const path = params[0];

  const specPath = path.substring(0, path.length - 2) + 'spec.ts';
  const sourceCode = readFileSync(path).toString();

  const sourceFile = ts.createSourceFile(
    path,
    sourceCode,
    ts.ScriptTarget.Latest,
        /*setParentNodes */ true
  );

  const input = parseSourceFile(sourceFile);
  const output = generateUnitTest(path, sourceCode, input, handlers);

  writeFileSync(specPath, output);
}
