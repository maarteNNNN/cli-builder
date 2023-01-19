<a name="REPLClient"></a>

## REPLClient
**Kind**: global class  

* [REPLClient](#REPLClient)
    * [new REPLClient(options)](#new_REPLClient_new)
    * [.run([commands], [options])](#REPLClient+run)
    * [.successLog(successMsg, [prefix], [noExit])](#REPLClient+successLog)
    * [.errorLog(errorMsg, [prefix], [noExit], [force])](#REPLClient+errorLog)
    * [.exit([code], [override])](#REPLClient+exit)
    * [.pagination(output, pageInfo, [increments], [fn], [args])](#REPLClient+pagination) ⇒ <code>function</code> \| <code>null</code>
    * [.camelCaseToKebab(str)](#REPLClient+camelCaseToKebab) ⇒ <code>String</code>
    * [.kebabCaseToCamel(str)](#REPLClient+kebabCaseToCamel) ⇒ <code>String</code>
    * [.promptInput(message, [secret])](#REPLClient+promptInput) ⇒ <code>string</code>
    * [.promptConfirm(message, options)](#REPLClient+promptConfirm) ⇒ <code>Boolean</code>
    * [.promptList(message, [choices], [options])](#REPLClient+promptList) ⇒ <code>string</code>

<a name="new_REPLClient_new"></a>

### new REPLClient(options)
Instantiate the CLI


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | options |
| [options.enableInteractive] | <code>Boolean</code> | <code>true</code> | Allow interactive mode |
| [options.exceptions] | <code>Array.&lt;String&gt;</code> | <code>[]</code> | The ability to explicitely not execute code before the actual command. E.g. an API call. |
| [options.helpHeader] | <code>String</code> |  | Header to show in help |
| [options.helpFooter] | <code>String</code> |  | Footer to show in help |
| [options.binCommand] | <code>String</code> |  | If error it will show how to access the help command |
| [options.logStackErrorMessages] | <code>Boolean</code> |  | For debug purposes |
| [options.tabSize] | <code>Number</code> | <code>15</code> | Tab size between command and help |
| [options.argv] | <code>String</code> |  | Manually pass arguments to cli (used for testing) |
| [options.actions] | <code>Object.&lt;String, function()&gt;</code> | <code>{}</code> | Actions to mount to the CLI |

<a name="REPLClient+run"></a>

### replClient.run([commands], [options])
This is the initial entry to initialize the cli REPLClient.run({ commands })

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [commands] | <code>Object</code> | <code>{}</code> | Command object with function to execute |
| [options] | <code>Object</code> | <code>{}</code> | Command object with function to execute |

<a name="REPLClient+successLog"></a>

### replClient.successLog(successMsg, [prefix], [noExit])
When non-interactively it will exit, unless noExit is provided.

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| successMsg | <code>String</code> |  | Succes string to log |
| [prefix] | <code>String</code> | <code>&#x27;&#x27;</code> | Add a prefix to the message, it will print the message under a newline |
| [noExit] | <code>Boolean</code> | <code>false</code> | Force to not exit |

<a name="REPLClient+errorLog"></a>

### replClient.errorLog(errorMsg, [prefix], [noExit], [force])
When non-interactively it will exit, unless noExit is provided.

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| errorMsg | <code>String</code> |  | Succes string to log |
| [prefix] | <code>String</code> | <code>&#x27;&#x27;</code> | Add a prefix to the message, it will print the message under a newline |
| [noExit] | <code>Boolean</code> | <code>false</code> | Force to not exit |
| [force] | <code>Boolean</code> | <code>false</code> | Force to exit |

<a name="REPLClient+exit"></a>

### replClient.exit([code], [override])
Exit process

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [code] | <code>Number</code> | <code>0</code> | Exit status |
| [override] | <code>Boolean</code> | <code>false</code> | Boolean to override interactive |

<a name="REPLClient+pagination"></a>

### replClient.pagination(output, pageInfo, [increments], [fn], [args]) ⇒ <code>function</code> \| <code>null</code>
Clears the console to present the result(s)

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| output | <code>any</code> |  | What info will be outputted through the `successLog` method |
| pageInfo | <code>Object</code> |  | Info about the page |
| [pageInfo.offset] | <code>Number</code> | <code>1</code> | Offset of the query |
| [pageInfo.limit] | <code>Number</code> | <code>1</code> | Limit of the query |
| [pageInfo.pageNumber] | <code>Number</code> | <code>1</code> | Number of the current page |
| [pageInfo.order] | <code>&#x27;asc&#x27;</code> \| <code>&#x27;desc&#x27;</code> | <code>&#x27;asc&#x27;</code> | Order to run the query |
| [increments] | <code>Number</code> | <code>1</code> | Increments on offset en limit (is always lowercase) |
| [fn] | <code>function</code> | <code>()&#x3D;&gt;{}</code> | Function to execute while keeping page interactive |
| [args] | <code>Array.&lt;string&gt;</code> | <code>[]</code> | Arguments to pass on through the given fn function |

<a name="REPLClient+camelCaseToKebab"></a>

### replClient.camelCaseToKebab(str) ⇒ <code>String</code>
Converts camelCase to kebas-case

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  
**Returns**: <code>String</code> - kebab-case value  
**Throws**:

- <code>TypeError</code> No string given or not a string


| Param | Type | Description |
| --- | --- | --- |
| str | <code>String</code> | String to be converted to kebab-case |

<a name="REPLClient+kebabCaseToCamel"></a>

### replClient.kebabCaseToCamel(str) ⇒ <code>String</code>
Converts kebab-case to camelCase

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  
**Returns**: <code>String</code> - camelCase value  
**Throws**:

- <code>TypeError</code> No string given or not a string


| Param | Type | Description |
| --- | --- | --- |
| str | <code>String</code> | String to be converted to camelCase |

<a name="REPLClient+promptInput"></a>

### replClient.promptInput(message, [secret]) ⇒ <code>string</code>
Prompt wrapper function

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  
**Returns**: <code>string</code> - Value given to prompt  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>String</code> | Prompt message |
| [secret] | <code>Boolean</code> | When true input is hidden |

<a name="REPLClient+promptConfirm"></a>

### replClient.promptConfirm(message, options) ⇒ <code>Boolean</code>
Confirmation Prompt

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  
**Returns**: <code>Boolean</code> - Value given to prompt  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>String</code> | Message of confirmation |
| options | <code>Object</code> |  |
| options.default | <code>any</code> | Default of confirmation |

<a name="REPLClient+promptList"></a>

### replClient.promptList(message, [choices], [options]) ⇒ <code>string</code>
Confirmation Prompt

**Kind**: instance method of [<code>REPLClient</code>](#REPLClient)  
**Returns**: <code>string</code> - Value given to prompt  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| message | <code>String</code> |  | Message of confirmation |
| [choices] | <code>Array</code> | <code>[]</code> | Choices to list in the prompt |
| [options] | <code>Object</code> |  |  |
| [options.default] | <code>any</code> |  | Default of confirmation |

