# CLI-Builder

## Installing

```
npm install cli-builder
```

Be sure to take a look at `bin/example-cli.js`

Instantiate a new CLI with `new REPLClient({ ...options })` `REPL` stands for `Read Eval Print Loop`

defining an `commands` Object as shown below in [below](#Commands+example)

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

Running is going through the object and should be written as arguments the following way: `deep nesting works as command` for the [example above](Commands+example) (It executes the function or the `execute` child function in case help wants to be added).
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

# Docs

<a name="REPLClient"></a>

## REPLClient

**Kind**: global class

- [REPLClient](#REPLClient)
  - [new REPLClient(options)](#new_REPLClient_new)
  - [.promptInput](#REPLClient+promptInput) ⇒ <code>string</code>
  - [.promptConfirm](#REPLClient+promptConfirm) ⇒ <code>Boolean</code>
  - [.promptList](#REPLClient+promptList) ⇒ <code>string</code>
  - [.run([commands])](#REPLClient+run)
  - [.successLog(successMsg, [prefix], [noExit])](#REPLClient+successLog)
  - [.errorLog(errorMsg, [prefix], [noExit])](#REPLClient+errorLog)
  - [.exit([code], [override])](#REPLClient+exit)
  - [.pagination(output, pageInfo, [increments], [fn], [args])](#REPLClient+pagination) ⇒ <code>function</code> \| <code>null</code>
  - [.camelCaseToKebab(str)](#REPLClient+camelCaseToKebab) ⇒ <code>String</code>
  - [.kebabCaseToCamel(str)](#REPLClient+kebabCaseToCamel) ⇒ <code>String</code>

<a name="new_REPLClient_new"></a>

### new REPLClient(options)

Instanciate the cli

| Param                       | Type                                           | Default           | Description                                                                    |
| --------------------------- | ---------------------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| options                     | <code>Object</code>                            |                   | options                                                                        |
| [options.enableInteractive] | <code>Boolean</code>                           | <code>true</code> | Allow interactive mode                                                         |
| [options.exceptions]        | <code>Array.&lt;String&gt;</code>              | <code>[]</code>   | Commands that do not execute the beforeCommandFn and afterCommandFn (eg. help) |
| [options.helpHeader]        | <code>String</code>                            |                   | Header to show in help                                                         |
| [options.helpFooter]        | <code>String</code>                            |                   | Footer to show in help                                                         |
| [options.binCommand]        | <code>String</code>                            |                   | If error it will show how to access the help command                           |
| [options.argv]              | <code>String</code>                            |                   | Manually pass arguments to cli (used for testing)                              |
| [options.actions]           | <code>Object.&lt;String, function()&gt;</code> | <code>{}</code>   | Actions to mount to the CLI                                                    |

<a name="REPLClient+promptInput"></a>

### replClient.promptInput ⇒ <code>string</code>

Prompt wrapper function

**Kind**: instance property of [<code>REPLClient</code>](#REPLClient)  
**Returns**: <code>string</code> - Value given to prompt

| Param   | Type                 | Description               |
| ------- | -------------------- | ------------------------- |
| message | <code>String</code>  | Prompt message            |
| secret  | <code>Boolean</code> | When true input is hidden |

<a name="REPLClient+promptConfirm"></a>

### replClient.promptConfirm ⇒ <code>Boolean</code>

Confirmation Prompt

**Kind**: instance property of [<code>REPLClient</code>](#REPLClient)  
**Returns**: <code>Boolean</code> - Value given to prompt

| Param           | Type                | Description             |
| --------------- | ------------------- | ----------------------- |
| message         | <code>String</code> | Message of confirmation |
| options         | <code>Object</code> |                         |
| options.default | <code>any</code>    | Default of confirmation |

<a name="REPLClient+promptList"></a>

### replClient.promptList ⇒ <code>string</code>

Confirmation Prompt

**Kind**: instance property of [<code>REPLClient</code>](#REPLClient)  
**Returns**: <code>string</code> - Value given to prompt

| Param           | Type                | Default         | Description                   |
| --------------- | ------------------- | --------------- | ----------------------------- |
| message         | <code>String</code> |                 | Message of confirmation       |
| [choices]       | <code>Array</code>  | <code>[]</code> | Choices to list in the prompt |
| options         | <code>Object</code> |                 |                               |
| options.default | <code>any</code>    |                 | Default of confirmation       |

<a name="REPLClient+run"></a>

### replClient.run([commands])

Runs the cli interface

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)

| Param      | Type                | Default         | Description                             |
| ---------- | ------------------- | --------------- | --------------------------------------- |
| [commands] | <code>Object</code> | <code>{}</code> | Command object with function to execute |

<a name="REPLClient+successLog"></a>

### replClient.successLog(successMsg, [prefix], [noExit])

When non-interactively it will exit, unless noExit is provided.

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)

| Param      | Type                 | Default                   | Description                                                            |
| ---------- | -------------------- | ------------------------- | ---------------------------------------------------------------------- |
| successMsg | <code>String</code>  |                           | Succes string to log                                                   |
| [prefix]   | <code>String</code>  | <code>&#x27;&#x27;</code> | Add a prefix to the message, it will print the message under a newline |
| [noExit]   | <code>Boolean</code> | <code>false</code>        | Force to not exit                                                      |

<a name="REPLClient+errorLog"></a>

### replClient.errorLog(errorMsg, [prefix], [noExit])

When non-interactively it will exit, unless noExit is provided.

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)

| Param    | Type                 | Default                   | Description                                                            |
| -------- | -------------------- | ------------------------- | ---------------------------------------------------------------------- |
| errorMsg | <code>String</code>  |                           | Succes string to log                                                   |
| [prefix] | <code>String</code>  | <code>&#x27;&#x27;</code> | Add a prefix to the message, it will print the message under a newline |
| [noExit] | <code>Boolean</code> | <code>false</code>        | Force to not exit                                                      |

<a name="REPLClient+exit"></a>

### replClient.exit([code], [override])

Exit process

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)

| Param      | Type                 | Default            | Description                     |
| ---------- | -------------------- | ------------------ | ------------------------------- |
| [code]     | <code>Number</code>  | <code>0</code>     | Exit status                     |
| [override] | <code>Boolean</code> | <code>false</code> | Boolean to override interactive |

<a name="REPLClient+pagination"></a>

### replClient.pagination(output, pageInfo, [increments], [fn], [args]) ⇒ <code>function</code> \| <code>null</code>

Clears the console to present the result(s)

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)

| Param                 | Type                                                          | Default                      | Description                                                 |
| --------------------- | ------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------- |
| output                | <code>any</code>                                              |                              | What info will be outputted through the `successLog` method |
| pageInfo              | <code>Object</code>                                           |                              | Info about the page                                         |
| [pageInfo.offset]     | <code>Number</code>                                           | <code>1</code>               | Offset of the query                                         |
| [pageInfo.limit]      | <code>Number</code>                                           | <code>1</code>               | Limit of the query                                          |
| [pageInfo.pageNumber] | <code>Number</code>                                           | <code>1</code>               | Number of the current page                                  |
| [pageInfo.order]      | <code>&#x27;asc&#x27;</code> \| <code>&#x27;desc&#x27;</code> | <code>&#x27;asc&#x27;</code> | Order to run the query                                      |
| [increments]          | <code>Number</code>                                           | <code>1</code>               | Increments on offset en limit (is always lowercase)         |
| [fn]                  | <code>function</code>                                         | <code>()&#x3D;&gt;{}</code>  | Function to execute while keeping page interactive          |
| [args]                | <code>Array.&lt;string&gt;</code>                             | <code>[]</code>              | Arguments to pass on through the given fn function          |

<a name="REPLClient+camelCaseToKebab"></a>

### replClient.camelCaseToKebab(str) ⇒ <code>String</code>

Converts camelCase to kebas-case

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  
**Returns**: <code>String</code> - kebab-case value  
**Throws**:

- <code>TypeError</code> No string given or not a string

| Param | Type                | Description                          |
| ----- | ------------------- | ------------------------------------ |
| str   | <code>String</code> | String to be converted to kebab-case |

<a name="REPLClient+kebabCaseToCamel"></a>

### replClient.kebabCaseToCamel(str) ⇒ <code>String</code>

Converts kebab-case to camelCase

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  
**Returns**: <code>String</code> - camelCase value  
**Throws**:

- <code>TypeError</code> No string given or not a string

| Param | Type                | Description                         |
| ----- | ------------------- | ----------------------------------- |
| str   | <code>String</code> | String to be converted to camelCase |
