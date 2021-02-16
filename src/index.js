const argv = require('minimist')(process.argv.slice(2));
const { kebabCaseToCamel, promptInput } = require('./lib');

class CliInterface {
  /**
   * Instantiates a cli interface
   * @param {Object} options options
   * @param {string} options.command Command to put in logs
   * @param {boolean} options.enableInteractive Allow interactive mode
   * @param {Array} options.exceptions Commands that do not execute the beforeCommandFn and afterCommandFn (eg. help)
   * @param {Promise} options.beforeCommandFn Function to execute before initialization
   * @param {Promise} options.afterCommandFn Function to execute after initialization
   * @param {string} options.helpHeader Header to show in help
   * @param {string} options.helpFooter Footer to show in help
   * @param {Object} commands Command object with function to execute
   */
  constructor(options, commands) {
    this.options = options || {};

    if (!this.options.enableInteractive) this.options.enableInteractive = true;

    this.options.interactive =
      (!argv._.length || Object.keys(argv).length > 1) &&
      // Case its --help, --version or -v
      !Object.keys(argv).slice(1).length &&
      this.options.enableInteractive;

    if (!this.options.command) this.options.command = '';

    const defaultExceptions = ['help', 'v', 'version'];
    if (!this.options.exceptions) this.options.exceptions = defaultExceptions;
    else
      this.options.exceptions = [
        ...new Set([...this.options.exceptions, defaultExceptions]),
      ];

    // Check if has exceptions, this is only executed when not interactive
    for (let i = 0; i < this.options.exceptions.length; i++) {
      const exception = this.options.exceptions[i];
      if (argv.hasOwnProperty(exception)) {
        this.options.exception = true;
      }
    }

    this.helpArray = [];
  }

  logHelpCommands() {
    if (this.options.helpHeader) console.log(this.options.helpHeader);

    for (let i = 0; i < this.helpArray.length; i++) {
      this.helpArray[i]();
    }

    if (this.options.helpFooter) console.log(this.options.helpFooter);

    this.helpArray = [];
  }

  getHelpCommands(object) {
    const accumulator = object;
    const keys = Object.keys(object);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const currentValue = accumulator[key];

      if (typeof currentValue === 'function' && key === 'help')
        this.helpArray.push(currentValue);
      else this.getHelpCommands(currentValue);
    }
  }

  async run(commands) {
    this.commands = commands || {};

    this.commands = {
      ...this.commands,
      help: async () => {
        const commands = this.commands;
        delete commands.help;

        this.getHelpCommands(commands);

        this.logHelpCommands();
      },
    };

    // Function to run before initialization
    if (this.options.beforeCommandFn && !this.exception)
      await this.options.beforeCommandFn();

    this.options.interactive
      ? await this.interactiveCmd()
      : await this.commandCmd();

    // Function to run after initialization
    if (this.options.afterCommandFn && !this.exception)
      await this.options.afterCommandFn();
  }

  async interactiveCmd() {
    const command = await promptInput('interactive command >');
    await this.execCmd(command);
  }

  async commandCmd() {
    const command = [].concat(argv._, Object.keys(argv).slice(1));
    await this.execCmd(command);
  }

  async execCmd(cmd) {
    if (cmd === '' && this.options.interactive) {
      await this.interactiveCmd();
      return;
    }

    if (cmd.includes(' ')) cmd = cmd.split(' ');

    try {
      const commands = [].concat(cmd);
      let accumulator = this.commands;

      for (let i = 0; i < commands.length + 1; i++) {
        const currentValue = commands[i] ? kebabCaseToCamel(commands[i]) : null;

        if (
          (currentValue === 'help' || currentValue === '--help') &&
          commands.length - 1 === i &&
          commands.length !== 1
        ) {
          this.getHelpCommands(accumulator);
          this.logHelpCommands();
          return;
        }

        if (typeof accumulator.execute === 'function' && !currentValue)
          return await accumulator.execute();

        if (currentValue) {
          if (accumulator.hasOwnProperty(currentValue)) {
            accumulator = accumulator[currentValue];
            if (typeof accumulator === 'function') await accumulator();
          } else if (typeof accumulator[currentValue] === 'function')
            await accumulator[currentValue]();
          else if (typeof accumulator['--' + currentValue] === 'function')
            await accumulator['--' + currentValue]();
          else {
            debugger;
            throw new Error('command invalid');
          }
        }
      }
    } catch (e) {
      debugger;
      this.invalidCommand();
    }

    if (this.options.interactive) this.interactiveCmd();
  }

  successLog(successMsg, prefix = '') {
    successMsg =
      typeof successMsg === 'object'
        ? JSON.stringify(successMsg, null, 2)
        : successMsg;

    prefix = typeof prefix === 'string' ? prefix.toUpperCase() : '';

    console.log(
      `\x1b[1m\x1b[32m${prefix}${
        prefix && prefix.length && '\n'
      }${successMsg}\x1b[0m`,
    );
    this.exit(0);
  }

  errorLog(errorMsg) {
    console.log(`\x1b[1m\x1b[31mError: ${errorMsg}\x1b[0m`);
    this.exit(1);
  }

  invalidCommand() {
    this.errorLog(
      this.options.interactive
        ? 'Type help to see all available commands.'
        : 'Command is not found. Run ${this.options.command}  --help to see all available commands.',
    );
  }

  exit = async (code = 0, override = false) => {
    if (!this.options.interactive || override) process.exit(code);
  };
}

module.exports = {
  CliInterface,
  kebabCaseToCamel,
  promptInput,
};
