import { run } from '../src/main';
import { unlinkSync, readFileSync } from 'fs';

const leaveSpecFilesOnDisk = true;

describe('integration', () => {

  describe(`login form component test`, () => {

    createSpec({
      file: 'spec/fixtures/components/login/login-form.component.ts',
      spec: 'spec/fixtures/components/login/login-form.component.spec.ts',
      expected: 'spec/fixtures/components/login/login-form.component.spec.expected.ts'
    });

  });

  fdescribe(`home component test`, () => {

    createSpec({
      file: 'spec/fixtures/components/home-page/home-page.component.ts',
      spec: 'spec/fixtures/components/home-page/home-page.component.spec.ts',
      expected: 'spec/fixtures/components/home-page/home-page.component.spec.expected.ts'
    });

  });

  describe('with dependency handlers', () => {

    describe('login form component test', () => {

      createSpec({
        file: 'spec/fixtures/components/login/login-form.component.ts',
        spec: 'spec/fixtures/components/login/login-form.component.spec.ts',
        expected: 'spec/fixtures/components/login/login-form.component.spec.expected.with-handlers.ts',
        arguments: ['--handlers', 'spec/fixtures/dependency-handlers']
      });

    });

  });

  describe('auth service', () => {

    createSpec({
      file: 'spec/fixtures/auth.service.ts',
      spec: 'spec/fixtures/auth.service.spec.ts',
      expected: 'spec/fixtures/auth.service.spec.expected.ts'
    });

    describe('with double quotes', () => {

      createSpec({
        file: 'spec/fixtures/auth.service.with-double-quote.ts',
        spec: 'spec/fixtures/auth.service.with-double-quote.spec.ts',
        expected: 'spec/fixtures/auth.service.with-double-quote.spec.expected.ts'
      });

    });

  });

});

function createSpec(input: {
  file: string,
  spec: string,
  expected: string,
  arguments?: string[]
}) {
  beforeAll(() => {
    run([...(input.arguments || []), input.file]);
  });

  if (!leaveSpecFilesOnDisk) {
    afterAll(() => {
      unlinkSync(input.spec);
    });
  }

  it('should create a matching spec file', () => {
    const content = readFileSync(input.spec).toString().split(/\r\n|\n/) || [];
    const expected = readFileSync(input.expected).toString().split(/\r\n|\n/) || [];
    let line = 0;
    // compare lines
    while (content.length || expected.length) {
      line++;
      const prefix = `line(${line})`; // line number
      expect(prefix + content.shift()).toEqual(prefix + expected.shift());
    }
  });
}
