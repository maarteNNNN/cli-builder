const chai = require('chai');

const { REPLClient } = require('../src');

const exampleArgs = {
  _: ['extreme', 'case', 'that', 'is', 'with', 'lots', 'of', 'commands'],
};

const exampleOptions = {
  enableInteractive: true,
  exceptions: ['test'],
  helpFooter: '',
  helpHeader: '',
};

const initiateCli = (options, argv) => {
  const cli = new REPLClient({ ...options, argv });

  return Promise.resolve(cli);
};

describe('REPL Client tests', () => {
  it('it should initialize', async () => {
    const testCli = await initiateCli(exampleOptions, exampleArgs);

    chai.expect(testCli).to.be.an('object');
  });

  it('it should run with execute as function', async () => {
    try {
      const testCli = await initiateCli(exampleOptions, { _: ['command'] });

      const commands = {
        command: {
          execute: () => {},
          help: 'works',
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it should run without execute as function', async () => {
    try {
      const testCli = await initiateCli(exampleOptions, { _: ['command'] });

      const commands = {
        command: () => {},
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it should run commands as function', async () => {
    try {
      const testCli = await initiateCli(exampleOptions, exampleArgs);

      const commands = {
        extreme: {
          case: {
            that: {
              is: {
                with: {
                  lots: {
                    of: {
                      commands: () => {},
                    },
                  },
                },
              },
            },
          },
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it should run help', async () => {
    try {
      const testCli = await initiateCli(exampleOptions, {
        _: ['command'],
        help: true,
      });

      const commands = {
        command: {
          execute: () => {},
          help: 'Testing this help',
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it should run help with options as -- argument', async () => {
    try {
      const testCli = await initiateCli(exampleOptions, {
        _: ['command'],
        help: true,
      });

      const commands = {
        command: {
          execute: () => {},
          help: 'Testing this help',
          options: [
            { option: 'v', help: 'version displayed' },
            { option: 's', help: 'version displayed' },
          ],
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it should run help with options as non -- argument', async () => {
    try {
      const testCli = await initiateCli(exampleOptions, {
        _: ['command'],
        help: true,
      });

      const commands = {
        command: {
          execute: () => {},
          help: 'Testing this help',
          options: [
            { option: 'v', help: 'version displayed' },
            { option: 's', help: 'version displayed' },
          ],
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it should run help with input', async () => {
    try {
      const testCli = await initiateCli(exampleOptions, {
        _: ['command'],
        help: true,
      });

      const commands = {
        command: {
          execute: ({ argument, options }) => console.log(argument, options),
          help: 'Testing this help',
          input: '<app-name>',
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it should pass a parameter', async () => {
    try {
      const param = 'argument';

      const testCli = await initiateCli(exampleOptions, {
        _: ['paramt', param],
        help: true,
      });

      const commands = {
        paramt: {
          execute: ({ argument }) => {
            chai.expect(argument).to.be.eql(param);
          },
          help: 'Testing this help',
          input: '<app-name>',
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it should pass on options', async () => {
    try {
      const opts = {
        test: 'pass this on',
        test2: 'pass this on',
      }

      const testCli = await initiateCli(
        { ...exampleOptions },
        {
          _: ['wallet', 'child'],
          ...opts
        },
      );

      const commands = {
        wallet: {
          execute: ({ argument, options }) => {
            chai.expect(options.test).to.be.eql(opts.test);
          },
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });
});
