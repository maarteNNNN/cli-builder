const argv = require('minimist')(process.argv.slice(2));
const { kebabCaseToCamel, promptInput, camelCaseToKebab } = require('./lib');

class CliInterface {
  /**
   * Instanciate the cli
   * @param {Object} options options
   * @param {string} options.command Command to put in logs
   * @param {boolean} options.enableInteractive Allow interactive mode
   * @param {Array} options.exceptions Commands that do not execute the beforeCommandFn and afterCommandFn (eg. help)
   * @param {string} options.helpHeader Header to show in help
   * @param {string} options.helpFooter Footer to show in help
   * @param {string} options.binCommand If error it will show how to access the help command
   */
  constructor(options = {}) {
    this.argv = argv;

    // OPTIONS
    this.options = options;

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
        ...new Set([...this.options.exceptions, ...defaultExceptions]),
      ];

    // Check if has exceptions, this is only executed when not interactive
    for (let i = 0; i < this.options.exceptions.length; i++) {
      const exception = this.options.exceptions[i];
      if (argv.hasOwnProperty(exception)) {
        this.options.exception = true;
      }
    }

    if(!this.options.bindActionArgs) this.options.bindActionArgs = []

    this.helpArray = [];
    this.actions = {};

    // HELPER FUNCTIONS FROM LIB
    this.camelCaseToKebab = camelCaseToKebab;
    this.kebabCaseToCamel = kebabCaseToCamel;
    this.promptInput = promptInput;
  }

  logHelpCommands() {
    if (this.options.helpHeader) console.log(this.options.helpHeader);

    this.helpArray.forEach(({ command, description }) => {
      console.log(
        `${command} ${command.split(' ').map(() => '\t')} ${description}`,
      );
    });

    if (this.options.helpFooter) console.log(this.options.helpFooter);

    this.helpArray = [];
  }

  getHelpCommands(accumulator, commands, previousValue = null) {
    const keys = Object.keys(accumulator);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const currentValue = accumulator[key];

      if (
        (typeof currentValue === 'string' && key === 'help') ||
        (typeof currentValue === 'function' && key !== 'execute')
      ) {
        // bind for the helpLog function to take
        this.helpArray.push({
          // Add the command if is array join it eg. `some deep nested command` or key as string when it is in the root object
          command: Array.isArray(previousValue)
            ? previousValue.join(' ')
            : camelCaseToKebab(key),
          description:
            typeof currentValue === 'function'
              ? 'No description available'
              : currentValue,
        });
      } else {
        // Mount an array to get previous commands to display it nicely eg. `some deep nested command`
        const previousValues = previousValue
          ? Array.isArray(previousValue)
            ? [...previousValue, camelCaseToKebab(key)]
            : [camelCaseToKebab(previousValue), camelCaseToKebab(key)]
          : [camelCaseToKebab(key)];

        this.getHelpCommands(currentValue, commands, previousValues);
      }
    }
  }

  /**
   * Runs the cli interface
   * @param {Object} commands Command object with function to execute
   */
  async run(commands = {}) {
    // BIND ARGS TO FUNCTIONS
    for (let i = 0; i < Object.keys(this.options.actions).length; i++) {
      const key = Object.keys(this.options.actions)[i];
      this.actions[key] = this.options.actions[key].bind(
        this,
        ...this.options.bindActionArgs,
      );
    }

    // COMMANDS
    this.commands = commands;

    this.commands = {
      ...this.commands,
      help: async () => {
        const commands = this.commands;
        delete commands.help;

        this.getHelpCommands(commands, commands);

        this.logHelpCommands();
      },
    };

    // EXECUTE CLI
    this.options.interactive
      ? await this.interactiveCmd()
      : await this.commandCmd();
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
          this.getHelpCommands(accumulator, commands);
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
            throw new Error('command invalid');
          }
        }
      }
    } catch (e) {
      if (e.message === 'command invalid') {
        this.invalidCommand();
      } else {
        this.errorLog(e.message)
      }
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
        : `Command is not found. Run ${this.options.binCommand && this.options.binCommand + ' '}--help to see all available commands.`,
    );
  }

  exit = async (code = 0, override = false) => {
    if (!this.options.interactive || override) process.exit(code);
  };
}

module.exports = {
  CliInterface,
};
