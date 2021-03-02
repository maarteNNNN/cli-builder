#!/usr/bin/env node

const { CliInterface } = require('../src')

const cli = new CliInterface(
  {
    binCommand: 'cli-builder', // refers to naming in `package.json`
    interactive: true,
    helpFooter: 'This is shown in the footer',
    helpHeader: 'This is shown in the header',
  },
)

// DO NOT ADD HELP TO THE ROOT OBJECT. THIS IS DYNAMICALLY MOUNTED
const commands = {
  test: {
    execute: () => console.log('this is the test run'),
    help: 'help of test',
    testing: {
      execute: (InputArgPassedToFunction) => console.log(InputArgPassedToFunction),
      help: 'testing help',
      input: '<arg-to-pass-to-execute-function>', // arg passed to execute function
      // cmd test testing IAMPASSEDTOFUNCTION -f
      // -f argument can be found by using this.argv.f inside the action
      options: [{ option: 'f', help: 'Follow the logs' }], 
    },
    testing2: {
      execute: () => console.log('executing testing2'),
      help: 'testing2 help'),
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
          command: () => console.log('to run this type `deep nesting works as command`')
          // Or with help
          // command: {
          //   // this get executed as `deep nesting works as command`
          //   execute: () => console.log('to run this type `deep nesting works as command`'),
          //   // this get executed as `deep nesting works as command help`
          //   help: 'help of command'
          // }
        }
      }
    }
  },
  runSomeFunction: async () => {
    // DO SOME INSANE LOGIC HERE
  }
}

cli.run(commands)
