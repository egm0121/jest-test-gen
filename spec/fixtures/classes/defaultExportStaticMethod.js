import moduleOne from 'moduleOne';
import moduleTwo from 'moduleTwo';
import myDefaultExport, { myNamedExport } from 'moduleThree/deep/file';
import helpers from './local/helpers';

export default class {
  static makeInstance(config) {}

  constructor(options = {}) {
    console.log('hello from MyDemoClass');
  }
  
  myDemoMethod() {

  }
};