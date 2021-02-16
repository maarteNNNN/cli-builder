# CLI-Builder

This builds cli's very quickly.
This is a WIP. As are the docs.

## Installing

```
npm install cli-builder
```

Take a look at `bin/example-cli.js`

Instantiate CLI with `new CliInterface({ ...options })`

- `options.command` - Type: `string` Command to put in logs
- `options.enableInteractive` - Type: `boolean` Allow interactive mode
- `options.helpHeader` - Type: `string` Header to show in help
- `options.helpFooter` - Type: `string` Footer to show in help
- `options.actions` - type `object` Object of functions that you can mount which will bind `cli` and `bindActionArgs` on it (more on `bindActionArgs` later).
- `options.bindActionArgs` - type `array` Array of any you can pass to the action functions.

and

and running with

```js
cli.run(commands)
```

an example of commands is shown below

## commands example

```js
// DO NOT ADD HELP TO THE ROOT OBJECT.
const commands = {
  test: {
    execute: () => console.log('this is the test run'),
    help: 'help of test',
    testing: {
      execute: () => console.log('executing testing'),
      help: 'testing help',
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
          command: {
            // this get executed as `deep nesting works as command`
            execute: () => console.log('to run this type `deep nesting works as command`'),
            // this get executed as `deep nesting works as command help`
            help: 'help of command'
          }
        }
      }
    }
  },
  runSomeFunction: async () => {
    // DO SOME INSANE LOGIC HERE
  }
}
```

Help is executed on the object. Eg. in this case executing `test help` will reveal help of `test` and it's help children (in this case `testing.help` and `testing2.help`)

Running a command is in a nesting way: `deep nesting works as command` for the example above (executes `execute` function case it's an object).
`deep nesting works as command help` (executes `help` function in case it's an object)

functions are added as camelCase but inside the command line you'll need to use kebab-case:
`run-some-function` will call function `runSomeFunction`.

`actions` can be used to integrate imported files. You can check out the example of a full-fledged cli implementation in [ldpos-commander](https://github.com/Leasehold/ldpos-commander/). It's basically passing the `cli` as `this`, therefore you can reference `cli` as `this` in your action and `bindActionArgs` will be all of the arguments you pass within that action function eg.:

```js
const actions = {
  getUserData = async (id, someFunction, aString, aNumber) => {
    try {
      const data = await axios.get(`user/${id}`)

      // this references to the cli object as it's bound
      this.successLog(data)

      someFunction()

      console.log(aString, aNumber)
    } catch (e) {
      throw new Error(e)
    }
  }
}

// Binding below array to `options.bindActionArgs` in `new CmdInterface({ ...options })`
const options = {
  bindActionArgs = [123, () => console.log('function executed'), 'a string', 23123]
}

const cli = new CmdInterface(options)

const commands = {
  // No arguments are passed here, they are mounted dynamically
  anActionTest: async () => await cli.actions.getUserData()
}

cli.run(commands)
```

using `cli-builder an-action-test` will execute the `getUserData` function with the `bindActionArgs` parameters bound to it.
