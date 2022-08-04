import * as ts from 'typescript';

export interface ParsedReactProp {
  name: ts.__String | string,
  type: ts.__String | string,
  isOptional: boolean,
}
export interface ParsedReactComponent {
  name: ts.__String | string;
  isFunctional: boolean;
  props?: ParsedReactProp[];
  isDefaultExport: boolean;
  tsPropTypeName?: ts.__String | string;
}
export interface ParsedClass {
  name: ts.__String | string;
  methods: ParsedMethod[];
  isDefaultExport: boolean;
}

export interface ParsedMethod {
  methodName: ts.__String | string;
  isAsync: boolean;
  isStatic: boolean;
  params: ts.__String[];
}

export interface ParsedFunction {
  name: ts.__String| string;
  isAsync: boolean;
  isDefaultExport: boolean;
}

export interface ParsedPojo {
  name:  ts.__String| string;
  methods: ParsedMethod[];
  isDefaultExport: boolean;
}

export interface ParsedClassDependency {
  name: string;
  type?: string;
  token?: string;
}
export interface ParsedImport {
  path: string;
  names: string[];
  importText: string;
}

export interface ParsedSourceFile {
  imports: ParsedImport[];
  exportFunctions: ParsedFunction[],
  exportPojos: ParsedPojo[],
  exportClass?: ParsedClass,
  exportComponents: ParsedReactComponent[],
  components: ParsedReactComponent[],
  classes: ParsedClass[];
  functions: ParsedFunction[],
  pojos: ParsedPojo[],
  typeDefinitions: ts.TypeAliasDeclaration[]
}

export interface ClassOptions {
  declarations: { name: string, type: string }[];
  initializers: { name?: string, value: string }[];
  dependencies: { name: string, token: string }[];
  imports: ParsedImport[];
}

export interface TemplateOptions {
  instanceVariableName: string;
  templateType: string;
  templatePath: string;
}

export interface DependencyHandlerOptions {
  variableName: string;
  injectionToken?: string;
  sourceCode: string;
  allImports: ParsedImport[];
  quoteSymbol: string;
}
export interface DependencyHandler {
  run(result: ClassOptions, dep: ParsedClassDependency, options: DependencyHandlerOptions): void

  test(dep: ParsedClassDependency): boolean;
};
export type ParsedSourceObject = ParsedClass | ParsedFunction | ParsedPojo | ParsedReactComponent;