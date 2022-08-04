const template = require('lodash/template');
const trimEnd = require('lodash/trimEnd');

import { ParsedSourceFile, ParsedImport, ParsedSourceObject } from './model';
import { MOCK_MODULES_BLACKLIST, IMPORT_MODULES_BLACKLIST } from './constants';
import { basename, extname } from 'path';
import { readFileSync } from 'fs';
import debugFactory from 'debug';

const debug = debugFactory('jest-test-gen/generate-unit-test');

const cleanupImportPathName = (rawImportPath: string) => rawImportPath.toLowerCase().replace(/(\'|\")/g, '');
export function generateUnitTest(path: string, _sourceCode: string, input: ParsedSourceFile) {
  if (input.classes.length > 1) {
    console.warn('Multiple classes detected in source file, will only consider the first class declaration');
  }
  debug('parsedSourceCode', input);
  const templateOptions = {
    instanceVariableName: 'instance',
  }
  const templateDir = `${__dirname}/../templates`;
  const relativePath = './' + basename(path, extname(path));
  console.log(relativePath);
  const quoteSymbol = determinateUsedQuote(input.imports);

  let namedExportsList = [
    ...input.exportFunctions,
    ...input.exportPojos,
    ...input.exportComponents,
  ];
  if(input.exportClass){
    namedExportsList.unshift(input.exportClass);
  }
  const namedExportsNameList = namedExportsList.filter(exp => !exp.isDefaultExport).map(exp => exp.name);
  const maybeDefaultExport = namedExportsList.find(exp => exp.isDefaultExport);
  if (maybeDefaultExport) {
    maybeDefaultExport.name = maybeDefaultExport.name || applyExportCapitalization(maybeDefaultExport,basename(path).replace(/\.\w+/, ''));
  }
  const templateDataMap = {
    namedExportsList: namedExportsNameList.join(', '),
    defaultExport: maybeDefaultExport,
    path: relativePath,
    quoteSymbol,
    allImports: input.imports.filter(currImport => !IMPORT_MODULES_BLACKLIST.includes(cleanupImportPathName(currImport.path))),
    allMocks: input.imports.filter(currImport => !MOCK_MODULES_BLACKLIST.includes(cleanupImportPathName(currImport.path))),
    parsedSource: input,
    ...templateOptions,
  };
  
  const testImports = template(
    readFileSync(`${templateDir}/imports.tpl`).toString()
  )(templateDataMap);
  const testMocks = template(
    readFileSync(`${templateDir}/mocksDefinition.tpl`).toString()
  )(templateDataMap)
  const testClass = template(
    readFileSync(`${templateDir}/classDescribe.tpl`).toString()
  )(templateDataMap);
  const testFunctions = template(
    readFileSync(`${templateDir}/functionsDescribe.tpl`).toString()
  )(templateDataMap)
  const testPojos = template(
    readFileSync(`${templateDir}/pojosDescribe.tpl`).toString()
  )(templateDataMap)
  const testComponents = template(
    readFileSync(`${templateDir}/componentsDescribe.tpl`).toString()
  )(templateDataMap);
  return trimEnd([
    testImports,
    testMocks,
    testClass,
    testComponents,
    testFunctions,
    testPojos,
  ].filter(hasOutput => hasOutput.replace(/(\r|\n)/g,'')).join('\r\n'), 
  '\r\n');
}

function determinateUsedQuote(imports: ParsedImport[]): string {

  for (const value of imports) {
    if (value.path.match(/['"']/)) {
      return value.path.substring(0, 1);
    }
  }

  return '\'';
}

function applyExportCapitalization(parsedObject: ParsedSourceObject, exportName: string) : string {
  if('isFunctional' in parsedObject || 'methods' in  parsedObject){
    const firstLetter = exportName[0];
    return `${firstLetter.toUpperCase()}${exportName.slice(1)}`;
  }
  return exportName;
}