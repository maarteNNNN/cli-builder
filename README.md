# Installing

```
npm install cli-builder
```

Take a look at `examples/bin/cli.js`

Instantiate CLI with `new CliInterface({ ...options })`


`options.command` - Type: `string` Command to put in logs
`options.enableInteractive` - Type: `boolean` Allow interactive mode
`options.beforeLoad` - Type: `Promise` Function to execute before initialization
`options.afterLoad` - Type: `Promise` Function to execute after initialization
`options.helpHeader` - Type: `string` Header to show in help
`options.helpFooter` - Type: `string` Footer to show in help
