import template = require('lodash/template');
import uniq = require('lodash/uniq');
import { ParsedSourceFile, ParsedClass, ClassOptions, TemplateOptions, DependencyHandler, ParsedImport } from './model';
import { basename } from 'path';
import { readFileSync } from 'fs';

export function generateUnitTest(path: string, sourceCode: string, input: ParsedSourceFile, handlers: DependencyHandler[]) {
  const klass = input.classes[0];

  if (!klass) {
    throw new Error(`No classes found in ${path}`);
  }

  const templateOptions = getTemplateOptions(klass.name);

  const templateText = readFileSync(templateOptions.templatePath).toString();
  const generator = template(templateText);
  const relativePath = './' + basename(path).replace('.ts', '');

  const usedImports = input.imports.reduce((imports, value) => {
    const matchingDependencies = value.names.filter((name) => {
      return klass.dependencies.some(dep => !!dep.type && dep.type.replace(/(<.*)/, '') === name || dep.token === name);
    });
    if (matchingDependencies.length > 0) {
      imports.push({
        path: value.path,
        names: matchingDependencies
      });
    }
    return imports;
  }, [] as ParsedImport[]);

  const quoteSymbol = determinateUsedQuote(input.imports);

  const classOptions = getClassOptions(klass, handlers, {
    sourceCode,
    quoteSymbol,
    imports: usedImports,
    allImports: input.imports
  });

  const uniqueImports = prepareImports(usedImports, quoteSymbol);

  return generator({
    name: klass.name,
    path: relativePath,
    quoteSymbol,
    imports: uniqueImports,
    allImports: input.imports,
    ...classOptions,
    ...templateOptions
  });
}


function getClassOptions(klass: ParsedClass, handlers: DependencyHandler[], options: {
  sourceCode: string,
  quoteSymbol: string,
  imports: ParsedImport[],
  allImports: ParsedImport[]
}): ClassOptions {
  const result: ClassOptions = {
    declarations: [],
    initializers: [],
    dependencies: [],
    imports: options.imports
  };
  klass.dependencies.forEach(dep => {
    const offset = dep.name.indexOf('$') === 0 ? 1 : 0;
    const variableName = 'fake' + dep.name.charAt(offset).toUpperCase() + dep.name.slice(1 + offset);
    const injectionToken = dep.token ? dep.token : (dep.type && dep.type.replace(/(<.*)/, '') || 'unknown');

    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      if (handler.test(dep)) {
        handler.run(result, dep, {
          variableName,
          injectionToken,
          quoteSymbol: options.quoteSymbol,
          sourceCode: options.sourceCode,
          allImports: options.allImports,
        });
        return;
      }
    }
  });
  return result;
}

function prepareImports(imports: ParsedImport[], quoteSymbol: string): ParsedImport[] {
  const result: ParsedImport[] = [];
  let index = 0;
  while (index < imports.length) {
    const value = imports[index];
    if (!value.path.match(/['"]/)) {
      value.path = quoteSymbol + value.path + quoteSymbol;
    }
    result.push(value);
    index++;

    for (let i = imports.length - 1; i >= index; i--) {
      const target = imports[i];
      if (!target.path.match(/['"]/)) {
        target.path = quoteSymbol + target.path + quoteSymbol;
      }

      if (target.path === value.path) {
        value.names = uniq(value.names.concat(target.names));
        imports.splice(i, 1);
      }
    }
  }
  return result;
}

function determinateUsedQuote(imports: ParsedImport[]): string {

  for (const value of imports) {
    if (value.path.match(/['"']/)) {
      return value.path.substring(0, 1);
    }
  }

  return '\'';
}

function getTemplateOptions(name: string): TemplateOptions {

  if (name.indexOf('Component') !== -1) {
    return {
      instanceVariableName: 'component',
      templateType: 'Component',
      templatePath: __dirname + '/../templates/component.ts.tpl'
    };
  } else if (name.indexOf('Directive') !== -1) {
    return {
      instanceVariableName: 'directive',
      templateType: 'Directive',
      templatePath: __dirname + '/../templates/component.ts.tpl'
    };
  } else if (name.indexOf('Service') !== -1) {
    return {
      instanceVariableName: 'service',
      templateType: 'Service',
      templatePath: __dirname + '/../templates/class.ts.tpl'
    };
  } else if (name.indexOf('Pipe') !== -1) {
    return {
      instanceVariableName: 'pipe',
      templateType: 'Pipe',
      templatePath: __dirname + '/../templates/class.ts.tpl'
    };
  } else {
    return {
      instanceVariableName: 'instance',
      templateType: 'Instance',
      templatePath: __dirname + '/../templates/class.ts.tpl'
    };
  }
}
