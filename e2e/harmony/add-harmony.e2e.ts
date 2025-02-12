import chai, { expect } from 'chai';
import path from 'path';
import { AddingIndividualFiles } from '../../src/consumer/component-ops/add-components/exceptions/adding-individual-files';
import { ParentDirTracked } from '../../src/consumer/component-ops/add-components/exceptions/parent-dir-tracked';
import Helper from '../../src/e2e-helper/e2e-helper';

chai.use(require('chai-fs'));

describe('add command on Harmony', function () {
  this.timeout(0);
  let helper: Helper;
  before(() => {
    helper = new Helper();
  });
  after(() => {
    helper.scopeHelper.destroy();
  });
  describe('adding files when workspace is new', () => {
    before(() => {
      helper.scopeHelper.setNewLocalAndRemoteScopesHarmony();
      helper.fixtures.createComponentBarFoo();
    });
    it('should throw an error AddingIndividualFiles', () => {
      const addFunc = () => helper.command.addComponent('bar/foo.js');
      const error = new AddingIndividualFiles(path.normalize('bar/foo.js'));
      helper.general.expectToThrow(addFunc, error);
    });
    it('when excluding a file, should throw an error', () => {
      helper.fs.outputFile('bar/foo1.js');
      const cmd = () => helper.command.addComponent('bar', { e: 'bar/foo1.js' });
      expect(cmd).to.throw('--exclude flag is used for legacy only');
    });
  });
  describe('add a directory inside an existing component', () => {
    before(() => {
      helper.scopeHelper.reInitLocalScopeHarmony();
      helper.fixtures.populateComponents(1);
      helper.fs.outputFile('comp1/foo/foo.ts');
    });
    it('should throw a descriptive error about parent-dir is tracked', () => {
      const cmd = () => helper.command.addComponent('comp1/foo');
      const error = new ParentDirTracked('comp1', 'comp1', path.normalize('comp1/foo'));
      helper.general.expectToThrow(cmd, error);
    });
  });
});
