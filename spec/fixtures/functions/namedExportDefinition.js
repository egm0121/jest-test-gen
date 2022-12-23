import moduleOne from 'moduleOne';
import moduleTwo from 'moduleTwo';
import myDefaultExport, { myNamedExport } from 'moduleThree/deep/file';
import helpers from './local/helpers';


function helloNamedFunction(myArgOne, myArgTwo) {

};

function helloAsNamedFunction(myArgOne, myArgTwo) {

};

export { helloNamedFunction, helloAsNamedFunction as helloAsFunction };