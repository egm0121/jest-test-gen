import handler from './default.handler';
import { DependencyHandler } from '../model';

export const defaultDependencyHandler: typeof handler = handler;

export const dependencyHandlers: DependencyHandler[] = [
  handler
];