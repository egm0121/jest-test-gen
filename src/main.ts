import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { parseSourceFile } from './parse-source-file';
import { generateUnitTest } from './generate-unit-test';

type TRunOptions = {
  returnOutput?: boolean
}

export function run(params: string[], opts?: TRunOptions) {
  if (!params.length) {
    // tslint:disable-next-line:no-console
    console.error('missing path argument');
    process.exit(1);
  }

  if (params.length > 1 && params[0].indexOf('--require') === 0) {
    require(params[1]);
    params = params.slice(2);
  }
  const inputPath = params[0];
  const inputFilenameNoExt = path.basename(inputPath, path.extname(inputPath));
  const specFileName = path.join(path.dirname(inputPath),`${inputFilenameNoExt}.generated.test.js`);

  const sourceCode = readFileSync(inputPath).toString();

  const sourceFile = ts.createSourceFile(
    inputPath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true, /*setParentNodes */
  );
  const input = parseSourceFile(sourceFile);
  const output = generateUnitTest(inputPath, sourceCode, input);
  if(opts?.returnOutput){
    return output;
  }
  return writeFileSync(specFileName, output);
}