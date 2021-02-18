const argv = require('minimist')(process.argv.slice(2));
const {
  kebabCaseToCamel,
  promptInput,
  camelCaseToKebab,
  constants,
  keyPress,
} = require('./lib');

// TODO: Implement an automatic help header with interactive and non-interactive usage, when using help non-interactivaly
// TODO: Align columns in help
class REPLClient {
  /**
   * Instanciate the cli
   * @param {Object} options options
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

    if (!this.options.bindActionArgs) this.options.bindActionArgs = [];

    this.helpArray = [];
    this.actions = {};

    // HELPER FUNCTIONS FROM LIB
    this.camelCaseToKebab = camelCaseToKebab;
    this.kebabCaseToCamel = kebabCaseToCamel;
    this.promptInput = promptInput;
    this.keyPress = keyPress;

    // CONSTANTS
    this.constants = constants;

    this.paginationActive = false;
  }

  logHelpCommands() {
    if (this.options.helpHeader) console.log(this.options.helpHeader);

    this.helpArray.forEach(({ command, description }) => {
      const commandCharacterCount = command.length;
      const size = 100 - commandCharacterCount;
      let spaces = '';

      for (let i = 0; i < size; i++) {
        spaces = spaces + ' ';
      }

      console.log(`${command} ${spaces} ${description}`);
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
    if (this.options.actions) {
      for (let i = 0; i < Object.keys(this.options.actions).length; i++) {
        const key = Object.keys(this.options.actions)[i];
        this.actions[key] = this.options.actions[key].bind(
          this,
          ...this.options.bindActionArgs,
        );
      }
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
    const command = await promptInput('>');
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
          if (this.options.interactive) await this.interactiveCmd();
          return;
        }

        if (typeof accumulator.execute === 'function' && !currentValue) {
          await accumulator.execute();
          await this.interactiveCmd();
          return
        }

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
        this.errorLog(e.message);
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
        : `Command is not found. Run ${
            this.options.binCommand ? this.options.binCommand + ' ' : ''
          }--help to see all available commands.`,
    );
  }

  exit = async (code = 0, override = false) => {
    if (this.options.interactive && !override) return;
    if (this.paginationActive) return;
    process.exit(code);
  };

  /**
   *
   * @param {any} output What info will be outputted through the `successLog` method
   * @param {Object} pageInfo Info about the page
   * @param {Number} pageInfo.offset Offset of the query
   * @param {Number} pageInfo.limit Limit of the query
   * @param {Number} pageInfo.pageNumber Number of the current page
   * @param {Number} pageInfo.order Order to run the query
   * @param {Number} increments Increments on offset en limit
   * @param {Function} fn Function to execute while keeping page interactive
   * @param {Array<string>} args Arguments to pass through that function
   */
  async pagination(
    output,
    pageInfo = { offset: 1, limit: 1, pageNumber: 1, order: 'asc' },
    increments = 1,
    fn = () => {},
    args = [],
  ) {
    // To use in exit for it not to
    this.paginationActive = true;

    console.clear();
    this.successLog(output, false);
    console.log(
      `Paged output: previous (p)        ${pageInfo.pageNumber}         next (n)`,
    );
    console.log(`Quit (q)`);
    const actionPrompt = async () => {
      const paginationInput = await promptInput('>');
      if (paginationInput === '') {
        actionPrompt();
      } else if (['q', 'quit', 'exit'].includes(paginationInput)) {
        this.paginationActive = false;
        return Promise.resolve('q');
      } else if (['p', 'previous', 'back'].includes(paginationInput)) {
        return Promise.resolve('p');
      } else if (['n', 'next'].includes(paginationInput)) {
        return Promise.resolve('n');
      } else if (['o', 'order'].includes(paginationInput)) {
        return Promise.resolve('o');
      } else if (['h', 'help'].includes(paginationInput)) {
        console.log('previous (p)   -- to go to the previous page');
        console.log('next (n)       -- to go to the next page');
        console.log('quit (q)       -- to stop browsing the pages');
        await actionPrompt();
      } else {
        this.errorLog('Input not recognized');
        await actionPrompt();
      }
    };

    const action = await actionPrompt();

    if (action === 'n') {
      pageInfo.offset += increments;
      pageInfo.limit += increments;
      pageInfo.pageNumber++;
    } else if (action === 'p' && pageInfo.pageNumber !== 1) {
      pageInfo.offset -= increments;
      pageInfo.limit -= increments;
      pageInfo.pageNumber--;
    } else if (action === 'o') {
      pageInfo.order === 'asc' ? 'desc' : 'asc';
    }

    if (action !== 'q') {
      return await fn.call(this, ...args);
    } else {
      return this.successLog('Exiting pagination...');
    }
  }
}

module.exports = {
  REPLClient,
};
