#!/usr/bin/env node

const { CliInterface } = require('../src')

// DO NOT ADD HELP TO ROOT.
const commands = {
  test: {
    execute: () => console.log('this is the test run'),
    help: () => console.log('help of test'),
    testing: {
      execute: () => console.log('executing testing'),
      help: () => console.log('testing help'),
    },
    testing2: {
      execute: () => console.log('executing testing2'),
      help: () => console.log('testing2 help'),
    },
  },
  test2: {
    execute: () => console.log('this is the test2 run'),
    help: () => console.log('help of test2'),
  },
  deep: {
    nesting: {
      works: {
        as: {
          command: {
            execute: () =>
              console.log('to run this type `deep nesting works as command`'),
            help: () => console.log('help of command'),
          },
        },
      },
    },
  },
  runSomeFunction: async () => {
    // DO SOME INSANE LOGIC HERE
  }
}

const cli = new CliInterface(
  {
    interactive: true,
    helpFooter: 'This is shown in the footer',
    helpHeader: 'This is shown in the header',
  },
  commands,
)

cli.run()
