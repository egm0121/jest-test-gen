import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as ts from 'typescript';
import { parseSourceFile } from './parse-source-file';
import { generateUnitTest } from './generate-unit-test';
import * as minimist from 'minimist';

type TRunOptions = {
  returnOutput?: boolean
}

export function run(args: minimist.ParsedArgs, opts?: TRunOptions) {
  if (!args._.length) {
    // tslint:disable-next-line:no-console
    console.error('missing path argument');
    console.error('USAGE: jest-test-gen <path-to-file> --outputDir ./my/custom/output --fileSuffix .generated.test')
    process.exit(1);
  }

  const inputPath = args._[0];
  const inputFileExtension = path.extname(inputPath);
  const inputFilenameNoExt = path.basename(inputPath, inputFileExtension);

  let finalOutputDir = path.dirname(inputPath);
  if (args.outputDir) {
    const homeDir = os.homedir();
    const resolvedConfigOutputDir = args.outputDir.replace(/^~(?=$|\/|\\)/, homeDir);
    if (path.isAbsolute(resolvedConfigOutputDir)){
      finalOutputDir = resolvedConfigOutputDir;
    } else {
      finalOutputDir = path.resolve(finalOutputDir, args.outputDir);
    }
  }
  let fileSuffix = '.generated.test';
  if (args.fileSuffix) {
    fileSuffix = args.fileSuffix;
  }
  const specFileName = path.join(finalOutputDir,`${inputFilenameNoExt}${fileSuffix}${inputFileExtension}`);

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
  console.log('Writing generated test file: ', specFileName);
  writeFileSync(specFileName, output);
  return specFileName;
}
