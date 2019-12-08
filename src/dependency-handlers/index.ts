import { DependencyHandler } from '../model';
import _defaultDependencyHandler from './default.handler';
import _angularRouterHandler from './angular.router.handler';

export const defaultDependencyHandler: DependencyHandler = _defaultDependencyHandler;
export const angularRouterHandler: DependencyHandler = _angularRouterHandler;

export const dependencyHandlers: DependencyHandler[] = [
  angularRouterHandler,
  defaultDependencyHandler,
];