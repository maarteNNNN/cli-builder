# Installing

```
npm install cli-builder
```

Take a look at `bin/example-cli.js`

Instantiate CLI with `new CliInterface({ ...options }, commands)`

- `options.command` - Type: `string` Command to put in logs
- `options.enableInteractive` - Type: `boolean` Allow interactive mode
- `options.beforeLoad` - Type: `Promise` Function to execute before initialization
- `options.afterLoad` - Type: `Promise` Function to execute after initialization
- `options.helpHeader` - Type: `string` Header to show in help
- `options.helpFooter` - Type: `string` Footer to show in help

## commands example

```js
// DO NOT ADD HELP TO THE ROOT OBJECT.
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
          // Without help
          command: () => console.log('to run this type `deep nesting works as command`')
          // Or with help
          command: {
            execute: () => console.log('to run this type `deep nesting works as command`'),
            help: () => console.log('help of command')
          }
        }
      }
    }
  }
}
```

Help is executed on the object. Eg. in this case executing `test help` will reveal help of `test` and all child help functions (this case `testing.help()` and `testing2.help()`)

Running a command is in a nesting way: `deep nesting works as command` for the example above (executes `execute` function case it's an object).
`deep nesting works as command help` (executes `help` function in case it's an object)


