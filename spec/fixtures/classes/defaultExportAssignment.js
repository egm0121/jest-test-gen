import moduleOne from 'moduleOne';
import moduleTwo from 'moduleTwo';
import myDefaultExport, { myNamedExport } from 'moduleThree/deep/file';
import helpers from './local/helpers';

export default class {
  constructor(options = {}) {
    console.log('hello from MyDemoClass');
  }

  hiThere() {}

  myDemoMethod() {

  }
};