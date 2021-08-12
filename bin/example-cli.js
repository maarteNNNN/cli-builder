#!/usr/bin/env node

const { REPLClient } = require('../src');

const cli = new REPLClient({
  binCommand: 'cli-builder', // refers to naming in `package.json`
  interactive: true,
  helpFooter: 'This is shown in the footer',
  helpHeader: 'This is shown in the header',
  logStackErrorMessages: true,
  // tabSize: 20
});

// DO NOT ADD HELP TO THE ROOT OBJECT. THIS IS DYNAMICALLY MOUNTED
const commands = {
  options: [{ option: { short: 'v', long: 'version' }, help: 'Version' }],
  test: {
    execute: () => console.log('this is the test run'),
    help: 'help of test',
    testing: {
      execute: ({ argument, options }) =>
        console.log('ARGUMENT: ', argument, '\nOPTIONS: ', options),
      help: 'testing help',
      input: '<arg-to-pass-to-execute-function>', // argument and options are passed as an object passed to execute function
      // cmd test testing IAMPASSEDTOFUNCTION -f
      options: [{ option: 'f', help: 'Follow the logs' }],
    },
    testing2: {
      execute: () => console.log('executing testing2'),
      help: 'testing2 help',
    },
  },
  test2: {
    execute: () => console.log('this is the test2 run'),
    help: 'help of test2',
  },
  deep: {
    nesting: {
      works: {
        as: {
          // Without help
          command: () =>
            console.log('to run this type `deep nesting works as command`'),
          // Or with help
          // command: {
          //   // this get executed as `deep nesting works as command`
          //   execute: () => console.log('to run this type `deep nesting works as command`'),
          //   // this get executed as `deep nesting works as command help`
          //   help: 'help of command'
          // }
        },
      },
    },
  },
  runSomeFunction: async () => {
    // DO SOME INSANE LOGIC HERE
  },
  // A more comprehensive example below titled: Defining help with only one execute function
  exampleWithOneExecute: {
    knownCommand: {
      help: 'Help for this known command',
    },
    // Show the user there are other commands available
    // This won't work if it has an execute!!! It needs to be camelcase for it to call execute
    'any-yet-unknown-property': {
      help: 'Help for ANY UNKOWN PROPERTY',
    },
    async execute({ argument, options }) {
      console.log(this); // Mounts the REPLClient dynamically
      console.log(argument); // Passes the last given argument/param dynamically
      console.log(options); // Passes the last given options/flags dynamically
    },
  },
};

cli.run(commands);
