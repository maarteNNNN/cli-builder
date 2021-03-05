const chai = require('chai');
const chaiThings = require('chai-things');
const chaiLike = require('chai-like');

const { REPLClient } = require('../src');

const exampleCommands = {
  extreme: {
    case: {
      that: {
        is: {
          with: {
            lots: {
              of: {
                commands: {
                  execute: () => {},
                  help: 'works',
                },
              },
            },
          },
        },
      },
    },
  },
};

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

  it('it should run with execute as function', async () => {
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
          execute: () => {},
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
          execute: (test) => {
            chai.expect(test).to.be.eql(param);
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

  // it('it should not pass a parameter when having bindActionArgs', async () => {
  //   try {
  //     const param = 'argument';

  //     const testCli = await initiateCli(
  //       { ...exampleOptions, bindActionArgs: ['test', 'testing'] },
  //       {
  //         _: ['paramt', param],
  //         help: true,
  //       },
  //     );

  //     const commands = {
  //       paramt: {
  //         execute: (test) => {
  //           chai.expect(test).to.be.eql(param);
  //         },
  //         help: 'Testing this help',
  //         input: '<app-name>',
  //       },
  //     };

  //     await testCli.run(commands);
  //   } catch (e) {
  //     chai
  //       .expect(e.message)
  //       .to.be.eql(
  //         'Command has parameter which is invalid',
  //       );
  //   }
  // });
});
