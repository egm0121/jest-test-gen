
import { DependencyHandler } from '../model';
import defaultDependencyHandler from './default.handler';

export default {
  run(result, dep, options) {
    defaultDependencyHandler.run(result, dep, options);

    // extra subject to support router events if property is used
    if (dep.type === 'Router' && options.sourceCode.includes(`${dep.name}.events`)) {
      result.imports.push({
        path: 'rxjs',
        names: ['ReplaySubject']
      });
      result.imports.push({
        path: '@angular/router',
        names: ['RouterEvent']
      });

      result.declarations.push({
        name: 'routerEventsSubject',
        type: 'ReplaySubject<RouterEvent>'
      });

      result.initializers.push({
        name: 'routerEventsSubject',
        value: 'new ReplaySubject<RouterEvent>(1)'
      });
    }

    if (dep.type === 'ActivatedRoute') {
      // param map mock
      if (options.sourceCode.includes(`${dep.name}.paramMap`)) {
        result.imports.push({
          path: '@angular/router',
          names: ['ParamMap']
        });

        result.imports.push({
          path: 'rxjs',
          names: ['Observable']
        });

        
        result.declarations.push({
          name: 'routeParams',
          type: '{ [prop: string]: string }'
        });

        result.initializers.push({
          name: 'routeParams',
          value: '{}'
        });

        result.declarations.push({
          name: 'routeParamMap',
          type: 'jasmine.SpyObj<ParamMap>'
        });

        result.initializers.push({
          name: 'routeParamMap',
          value: `jasmine.createSpyObj<ParamMap>(${options.quoteSymbol}ParamMap${options.quoteSymbol}, [${options.quoteSymbol}get${options.quoteSymbol}, ${options.quoteSymbol}has${options.quoteSymbol}])`
        });
        result.initializers.push({
          value: 'routeParamMap.get.and.callFake((k) => routeParams[k])'
        });

        result.initializers.push({
          value: 'routeParamMap.has.and.callFake((k) => !!routeParams[k])'
        });

        result.declarations.push({
          name: 'routeParamsSubject',
          type: 'ReplaySubject<ParamMap>'
        });

        result.initializers.push({
          // cast below makes sure that typescript is checking asignment
          // this is basically a workaround for readonly properties
          name: 'routeParamsSubject',
          value: `(${options.variableName} as { paramMap: Observable<ParamMap> }).paramMap = new ReplaySubject<ParamMap>(1)`
        });
      }
    }
  },

  test(dep) {
    return dep.type === 'Router' || dep.type === 'ActivatedRoute';
  }
} as DependencyHandler;