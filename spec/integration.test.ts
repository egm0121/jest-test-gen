import { run } from '../src/main';

describe('integration', () => {
  describe(`single class default export by identifier`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/classes/defaultExportIdentifier.js',
    });
  });
  describe(`single class default export by identifier with static methods`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/classes/defaultExportStaticMethod.js',
    });
  });
  describe(`single class default export of assigned class`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/classes/defaultExportAssignment.js',
    });
  });
  describe(`single class named export of assigned class definition`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/classes/namedExportClassDefinition.js',
    });
  });
  describe(`single class named export of class identifier`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/classes/namedExportIdentifier.js',
    });
  });
  describe(`single class named export of variable declaration with class assignement`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/classes/namedExportVariableDeclaration.js',
    });
  });
  describe(`function default export assignement`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/functions/defaultExportAssignement.js',
    });
  });
  describe(`function default export identifier`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/functions/defaultExportIdentifier.js',
    });
  });
  describe(`function named export definition`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/functions/namedExportDefinition.js',
    });
  });
  describe(`function named export variable statement`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/functions/namedExportVariableStatement.js',
    });
  });
  describe(`pojo default export identifier`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/pojos/defaultExportIdentifier.js',
    });
  });
  describe(`pojo named export assignement`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/pojos/namedExportAssignement.js',
    });
  });
  describe(`pojo named export identifier`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/pojos/namedExportIdentifier.js',
    });
  });
  describe(`component class based`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/components/classComponent.js',
    });
  });
  describe(`component class based - default export`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/components/defaultClassComponent.js',
    });
  });
  describe(`component functional - default export`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/components/functionalDefaultExportComponent.js',
    });
  });
  describe(`component functional - anonymous default export`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/components/unnamedDefaultComponent.js',
    });
  });
  describe(`component functional - named export`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/components/functionalNamedComponent.js',
    });
  });
  describe(`components multiple - named export`, () => {
    createSnapshotTest({
      file: 'spec/fixtures/components/multipleComponent.js',
    });
  });
});

function createSnapshotTest(input: {
  file: string,
  arguments?: string[]
}) {
  it('should match snapshot', () => {
    expect(run([...(input.arguments || []), input.file], { returnOutput: true })).toMatchSnapshot();
  });
}