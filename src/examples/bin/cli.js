#!/usr/bin/env node

const { Cli } = require('../../');

const commands = {
  test: {
    execute: () => console.log('this is the run'),
    help: () => console.log('help of run')
  }
}

const cli = new Cli({ interactive: true }, commands)

cli.run()
