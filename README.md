# CLI-Builder

[API Docs](API.md)

## Trying out an example

This example can be found in `bin/example-cli.js`

```sh
git clone https://github.com/maarteNNNN/cli-builder.git
npm install
npm link
cli-builder help
npm unlink # to delete the cli-builder bin
```

## Installing

```
npm install cli-builder
```

Be sure to take a look at `bin/example-cli.js`

Instantiate a new CLI with `new REPLClient({ ...options })` `REPL` stands for `Read Eval Print Loop`

defining an `commands` Object as shown below in [below](#commands-example)

```js
cli.run(commands);
```

## Commands example

```js
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
  },
  // A more comprehensive example below titled: Defining help with only one execute function
  exampleOneExecute: {
    knownCommand: {
      help: 'Help for this known command'
    },
    // Show the user there are other commands available
    'any-yet-unknown-property': {
      help: 'Help for ANY UNKOWN PROPERTY',
    },
    async execute(param) {
      console.log(this) // Mounts the REPLClient dynamically
      console.log(param) // Passes the last given param dynamically
    }
  }
}
```

---

<span style="color:orange">**WARNING**</span>

Help is dynamically mounted to the `commands` object. It generates a function which will mount all child `help` properties.

---

---

**NOTE**

Running is going through the object and should be written as arguments the following way: `deep nesting works as command` for the [example above](#commands-example) (It executes the function or the `execute` child function in case help wants to be added).
`deep nesting works as command help` (executes `help` child function in case it's available)

---

---

<span style="color:orange">**WARNING**</span>

functions are added as camelCase but are transformed to kebab-case:
`run-some-function` will call result in `runSomeFunction`.

---

---

<span style="color:red">**ADVANCED EXAMPLE**</span>

`actions` can be used to integrate imported files. You can check out the example of a full-fledged cli implementation in [ldpos-commander](https://github.com/Leasehold/ldpos-commander/) or [SocketCluster](https://github.com/SocketCluster/socketcluster).

The CLI (`REPLCient`) object is passed to the actions functions by [`Function.prototype.bind`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

The `bindActionArgs` are passed via [`Function.prototype.bind`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) as well. Except if an argument is passed in the commands object function Eg.

---

```js
someFunctionCmd: {
  // CLI as this will be available but bindActionArgs won't be as argument replaces them
  execute: (argument) => cli.actions.someFunction(argument),
}
```

---

## A more apprehensive example

```js
const actions = {
  getUserData = async (id, someFunction, aString, aNumber) => {
    try {
      const data = await axios.get(`user/${id}`)

      console.log(this.argv) // logs all passed arguments with - and --

      // this references to the cli object as it's bound
      this.successLog(data)

      someFunction()

      console.log(aString, aNumber)
    } catch (e) {
      throw new Error(e)
    }
  }
}

// Binding below array to `options.bindActionArgs` in `new REPLClient({ ...options })`
const options = {
  bindActionArgs = [123, () => console.log('function executed'), 'a string', 23123]
}

const cli = new REPLClient(options)

const commands = {
  // No arguments are passed here, they are mounted dynamically
  anActionTest: async () => await cli.actions.getUserData()
}

cli.run(commands)
```

using `cli-builder an-action-test` will execute the `getUserData` function with the `bindActionArgs` parameters bound to it.

## Defining `help` with only one `execute` function

When you want to dynamically output to the console Eg. get a JSON Object from an API with undefined structure but you want to be able to log any of those properties to the console it can be done via:

```js
const commands = {
  entrypoint: {
    any: {
      help: 'Help for any',
    },
    extra: {
      help: 'Help for extra',
    },
    helping: {
      help: 'Help for helping',
    },
    commands: {
      help: 'Help for commands',
    },
    'any-unknown-property': {
      help: 'Help for ANY UNKOWN PROPERTY',
    },
    async execute(param) {
      param = cli.kebabCaseToCamel(param);

      // We don't want the paging info in this case
      const {
        data: { data },
      } = axios.get('https://reqres.in/api/users?page=2');

      // If null it could be accessible, if undefined we know for sure it isn't
      if (!data[param] === undefined)
        throw new Error('Custom property not found.');

      // The `REPLCient` is object is dynamically mounted
      this.successLog(data[param], `${param}:`);
    },
  },
};
```
