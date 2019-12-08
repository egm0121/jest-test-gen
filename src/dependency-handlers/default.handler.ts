import { ParsedClassDependency, ClassOptions, DependencyHandler, DependencyHandlerOptions } from '../model';
import { getUsedMethods } from '../helpers';

export default {
  run(result: ClassOptions, dep: ParsedClassDependency, options: DependencyHandlerOptions) {
    const usedMethods = getUsedMethods(options.sourceCode, dep.name);

    result.declarations.push({
      name: options.variableName,
      type: `jasmine.SpyObj<${dep.type || 'any'}>`
    });

    result.initializers.push({
      name: options.variableName,
      value: `jasmine.createSpyObj<${dep.type || 'any'}>(${options.quoteSymbol}${dep.type === 'any' || !dep.type ? dep.name : dep.type}${options.quoteSymbol}, [${usedMethods.map(m => (options.quoteSymbol + m + options.quoteSymbol)).join(`, `)}])`
    });

    result.dependencies.push({
      name: options.variableName,
      token: options.injectionToken || 'no-token'
    });
  },

  test(_dep: ParsedClassDependency) {
    return true;
  }
} as DependencyHandler;
