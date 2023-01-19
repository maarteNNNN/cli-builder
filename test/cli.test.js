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
            { option: 'v', help: 'v displayed' },
            { option: 's', help: 's displayed' },
          ],
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it should run help on a specific command with short and long possibilites', async () => {
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
            { option: 'v', help: 'v displayed' },
            { option: { short: 's', long: 'silly' }, help: 's displayed' },
          ],
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it should display version on help', async () => {
    try {
      const testCli = await initiateCli(exampleOptions, {
        _: [],
        help: true,
      });

      const commands = {
        options: [
          {
            option: { short: 'v', long: 'version' },
            help: 'Display current version',
          },
        ],
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
      };

      const testCli = await initiateCli(
        { ...exampleOptions },
        {
          _: ['wallet', 'child'],
          ...opts,
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

  it('it should not throw on known property without execution', async () => {
    try {
      const testCli = await initiateCli(
        { ...exampleOptions },
        {
          _: ['wallet', 'known-command'],
        },
      );

      const commands = {
        wallet: {
          execute: ({ argument, options }) => {},
          knownCommand: {
            help: 'test this help',
          },
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it correctly translates kebab-case to camelCase', async () => {
    try {
      const testCli = await initiateCli(
        { ...exampleOptions },
        {
          _: ['testing-this', 'testing-a-smaller-argument'],
          // help: true,
        },
      );

      const commands = {
        testingThis: {
          testingASmallerArgument: {
            execute: ({ argument, options }) => {},
            help: 'test this help',
          },
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it('it throws if the kebab-case is off', async () => {
    try {
      const testCli = await initiateCli(
        { ...exampleOptions },
        {
          //                        Wrong
          _: ['testing-this', 'testing-asmaller-argument'],
          // help: true,
        },
      );

      const commands = {
        testingThis: {
          testingASmallerArgument: {
            execute: ({ argument, options }) => {},
            help: 'test this help',
          },
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai
        .expect(e.message)
        .to.be.eql('command is invalid and needs more arguments');
    }
  });

  it('it prevents a project name from translating into camelCase with execute', async () => {
    const projectName = 'Pyaterochka-013152-SKU-auditor';
    try {
      const testCli = await initiateCli(
        { ...exampleOptions },
        {
          _: ['create', projectName],
        },
      );

      const commands = {
        create: {
          execute: ({ argument, options }) => {
            chai.expect(argument).to.be.eql(projectName);
          },
          help: 'test this help',
        },
      };

      await testCli.run(commands);
    } catch (e) {
      chai.expect(e).to.not.throw();
    }
  });

  it("it's unable to pass an argument without execute, that would just be a nested command", async () => {
    const projectName = 'Pyaterochka-013152-SKU-auditor';
    try {
      const testCli = await initiateCli(
        { ...exampleOptions },
        {
          _: ['create', projectName],
        },
      );

      const commands = {
        create: ({ argument, options }) => {},
      };

      await testCli.run(commands);
    } catch (e) {
      chai
        .expect(e.message)
        .to.be.eql('command is invalid and needs more arguments');
    }
  });
});
