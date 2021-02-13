#!/usr/bin/env node

const { CliBuilder } = require('../../');

// DO NOT ADD HELP TO ROOT.
const commands = {
  test: {
    execute: () => console.log('this is the test run'),
    help: () => console.log('help of test'),
    testing: {
      help: () => console.log('testing help')
    },
    testing2: {
      help: () => console.log('testing2 help')
    }
  },
  test2: {
    execute: () => console.log('this is the test2 run'),
    help: () => console.log('help of test2'),
  },
};

const cli = new CliBuilder(
  {
    interactive: true,
    helpFooter: 'This is shown in the footer',
    helpHeader: 'This is shown in the header',
  },
  commands,
);

cli.run();
