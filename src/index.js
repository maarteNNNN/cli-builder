const argv = require('minimist')(process.argv.slice(2));
const inquirer = require('inquirer');

const prompt = inquirer.createPromptModule();

// TODO: Implement an automatic help header with interactive and non-interactive usage, when using help non-interactively
class REPLClient {
  /**
   * Instanciate the cli
   * @param {Object} options options
   * @param {Boolean} [options.enableInteractive=true] Allow interactive mode
   * @param {Array<String>} [options.exceptions=[]] The ability to explicitely not execute code before the actual command. E.g. an API call.
   * @param {String} [options.helpHeader] Header to show in help
   * @param {String} [options.helpFooter] Footer to show in help
   * @param {String} [options.binCommand] If error it will show how to access the help command
   * @param {String} [options.argv] Manually pass arguments to cli (used for testing)
   * @param {Object.<String, Function>} [options.actions={}] Actions to mount to the CLI
   */
  constructor(options = {}) {
    if (process.env.NODE_ENV !== 'testing') this.argv = argv;
    else this.argv = options.argv;

    this.testing = process.env.NODE_ENV === 'testing';

    // OPTIONS
    this.options = options;

    if (this.options.enableInteractive == undefined)
      this.options.enableInteractive = true;

    this._isInteractive();

    if (!this.options.command) this.options.command = '';

    const defaultExceptions = ['help', 'h', 'v', 'version'];
    if (!this.options.exceptions) this.options.exceptions = defaultExceptions;
    else
      this.options.exceptions = [
        ...new Set([...this.options.exceptions, ...defaultExceptions]),
      ];

    if (!this.options.bindActionArgs) this.options.bindActionArgs = [];

    this.helpArray = [];
    this.actions = {};

    this.paginationActive = false;

    this.interactive = true
  }

  /**
   * @private
   */
  _isInteractive() {
    this.options.interactive =
      (!this.argv._.length || Object.keys(this.argv).length > 1) &&
      // Case its --help, --version or -v
      !Object.keys(this.argv).slice(1).length &&
      this.options.enableInteractive;
  }

  /**
   * @private
   */
  _logHelpCommands() {
    if (this.options.helpHeader) console.log(this.options.helpHeader);

    this.helpArray.forEach(
      ({ command, description, options = null, input = null }) => {
        const commandCharacterCount =
          command.length + (input ? input.length : -1);
        const size = 100 - commandCharacterCount;

        console.log(
          `${command}${input ? ' ' + input : ''} ${Array(size)
            .fill(' ')
            .join('')} ${description}`,
        );
        if (Array.isArray(options)) {
          for (let i = 0; i < options.length; i++) {
            const { option, help } = options[i];
            const optionSize = 100 - option.length - 3;
            console.log(
              `   -${option} ${Array(optionSize).fill(' ').join('')} ${help}`,
            );
          }
        }
      },
    );

    if (this.options.helpFooter) console.log(this.options.helpFooter);

    this.helpArray = [];
  }

  /**
   * @private
   */
  _getHelpCommands(
    accumulator,
    commands,
    previousValue = null,
    previousAccumulator = null,
  ) {
    const keys = Object.keys(accumulator);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const currentValue = accumulator[key];
      previousAccumulator = accumulator;

      if (
        (typeof currentValue === 'string' && key === 'help') ||
        (typeof currentValue === 'function' && key !== 'execute')
      ) {
        // bind for the helpLog function to take
        this.helpArray.push({
          // Add the command if is array join it eg. `some deep nested command` or key as string when it is in the root object
          command: Array.isArray(previousValue)
            ? this.camelCaseToKebab(previousValue.join(' '))
            : this.camelCaseToKebab(key),
          description:
            typeof currentValue === 'function'
              ? 'No description available'
              : currentValue,
          options: previousAccumulator.options,
          input: previousAccumulator.input,
        });
      } else {
        // Mount an array to get previous commands to display it nicely eg. `some deep nested command`
        if (key !== 'options' && key !== 'input') {
          const previousValues = previousValue
            ? Array.isArray(previousValue)
              ? [...previousValue, key]
              : [previousValue, key]
            : [key];

          this._getHelpCommands(
            currentValue,
            commands,
            previousValues,
            previousAccumulator,
          );
        }
      }
    }
  }

  /**
   * Runs the cli interface
   * @param {Object} [commands={}] Command object with function to execute
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

    // FORCE UPDATE OF INTERACTIVE
    this._isInteractive();

    // EXECUTE CLI
    this.options.interactive
      ? await this._interactiveCmd()
      : await this._commandCmd();
  }

  /**
   * @async
   * @private
   */
  async _interactiveCmd() {
    while(this.interactive) {
      const command = await this.promptInput('>');
      if(!command) continue
      this.argv._ = command.split(' ')
      await this._execCmd(command);
    }
  }

  /**
   * @async
   * @private
   */
  async _commandCmd() {
    const command = [].concat(this.argv._, Object.keys(this.argv).slice(1));
    await this._execCmd(command);
  }

  /**
   * @async
   * @private
   */
  async _execCmd(cmd) {
    // If interactive make the cmd an array to loop over
    if (cmd.includes(' ')) cmd = cmd.split(' ');

    try {
      const commands = [].concat(cmd);
      let accumulator = this.commands;

      for (let i = 0; i < commands.length + 1; i++) {
        const currentValue = commands[i]
          ? this.kebabCaseToCamel(commands[i])
          : null;
        const nextValue = commands[i + 1]
          ? this.kebabCaseToCamel(commands[i + 1])
          : null;

        if (typeof accumulator.execute === 'function' && !currentValue) {
          await accumulator.execute.call(
            this,
            this.camelCaseToKebab(currentValue),
          );
          if (this.options.interactive) break;
        }

        if (currentValue === 'help' || currentValue === 'h') {
          const { help } = this.commands;

          // Delete help out of command to not display it in the help command.
          delete this.commands.help;

          this._getHelpCommands(accumulator, commands);
          this._logHelpCommands();

          // Add the command again
          this.commands.help = help;

          // Return because the action is done
          break;
        }

        if (currentValue) {
          if (accumulator.hasOwnProperty(currentValue)) {
            if (
              accumulator[currentValue].hasOwnProperty('help') &&
              !accumulator[currentValue].hasOwnProperty('execute')
            ) {
              await accumulator.execute.call(
                this,
                this.camelCaseToKebab(currentValue),
              );
              if (this.options.interactive) break;
            }

            accumulator = accumulator[currentValue];

            if (typeof accumulator === 'function' && !nextValue) {
              await accumulator();
            } else if (typeof accumulator.execute === 'function') continue;
            else if (nextValue === 'help') continue;
            else if (!accumulator.hasOwnProperty(nextValue)) {
              throw new Error('command is invalid and needs more arguments');
            }
          } else if (typeof accumulator['--' + currentValue] === 'function') {
            await accumulator['--' + currentValue]();
          } else {
            if (typeof accumulator.execute === 'function') {
              await accumulator.execute.call(
                this,
                this.camelCaseToKebab(currentValue),
              );
              break;
            } else if (this.options.bindActionArgs.length) {
              throw new Error('Command has parameter which is invalid.');
            }
            throw new Error('Command invalid.');
          }
        }
      }
    } catch (e) {
      this._invalidCommand(e.message);
    }
  }

  /**
   * Logging green message of success to the console
   * @description When non-interactively it will exit, unless noExit is provided.
   * @param {String} successMsg Succes string to log
   * @param {String} [prefix=''] Add a prefix to the message, it will print the message under a newline
   * @param {Boolean} [noExit=false] Force to not exit
   */
  successLog(successMsg, prefix = '', noExit = false) {
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
    if (noExit) return;
    this.exit(0);
  }

  /**
   * Logging red message of success to the console
   * @description When non-interactively it will exit, unless noExit is provided.
   * @param {String} errorMsg Succes string to log
   * @param {String} [prefix=''] Add a prefix to the message, it will print the message under a newline
   * @param {Boolean} [noExit=false] Force to not exit
   * @param {Boolean} [force=false] Force to exit
   */
  errorLog(errorMsg, code = null, noExit = false, force = false) {
    if (noExit && force) throw new Error('Both noExit and force are true.');
    if (this.testing) throw new Error(errorMsg);
    console.log(`\x1b[1m\x1b[31mError: ${errorMsg}\x1b[0m`);
    if (noExit && !force) return;
    this.exit(code || 1, force);
  }

  /**
   * Logs help command when an invalid command is given
   * @private
   */
  _invalidCommand(message) {
    this.errorLog(message, null, true);
    this.errorLog(
      this.options.interactive
        ? 'Type help to see all available commands.'
        : `Run ${
            this.options.binCommand ? this.options.binCommand + ' ' : ''
          }--help to see all available commands.`,
    );
  }

  /**
   * Exit process
   * @param {Number} [code=0] Exit status
   * @param {Boolean} [override=false] Boolean to override interactive
   */
  exit(code = 0, override = false) {
    if (this.options.interactive && !override) return;
    if (this.paginationActive) return;
    if (this.testing) return;
    this.interactive = false
    process.exit(code);
  }

  /**
   * Makes pagination available to interactively browser through results
   * @description Clears the console to present the result(s)
   * @param {any} output What info will be outputted through the `successLog` method
   * @param {Object} pageInfo Info about the page
   * @param {Number} [pageInfo.offset=1] Offset of the query
   * @param {Number} [pageInfo.limit=1] Limit of the query
   * @param {Number} [pageInfo.pageNumber=1] Number of the current page
   * @param {('asc'|'desc')} [pageInfo.order='asc'] Order to run the query
   * @param {Number} [increments=1] Increments on offset en limit (is always lowercase)
   * @param {Function} [fn=()=>{}] Function to execute while keeping page interactive
   * @param {Array<string>} [args=[]] Arguments to pass on through the given fn function
   * @async
   * @returns {(Function|null)}
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
      const paginationInput = await this.promptInput('>');
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
      pageInfo.pageNumber++;
    } else if (action === 'p' && pageInfo.pageNumber !== 1) {
      pageInfo.offset -= increments;
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

  /**
   * Converts camelCase to kebas-case
   * @param {String} str String to be converted to kebab-case
   * @returns {String} kebab-case value
   * @throws {TypeError} No string given or not a string
   */
  camelCaseToKebab(str) {
    if (!str) return;
    if (typeof str !== 'string')
      throw new TypeError('Not a string or no string given');
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Converts kebab-case to camelCase
   * @param {String} str String to be converted to camelCase
   * @returns {String} camelCase value
   * @throws {TypeError} No string given or not a string
   */
  kebabCaseToCamel(str) {
    if (!str) return;
    if (typeof str !== 'string')
      throw new TypeError('Not a string or no string given');
    return str.includes('--')
      ? str.replace('--', '')
      : str.replace(/-./g, (x) => x.toUpperCase()[1]);
  }

  /**
   * Prompt wrapper function
   * @param {String} message Prompt message
   * @param {Boolean} secret When true input is hidden
   * @returns {string} Value given to prompt
   * @async
   */
  async promptInput(message, secret) {
    const answer = await prompt([
      {
        type: secret ? 'password' : 'input',
        message,
        name: 'result',
        default: null,
        prefix: '',
      },
    ]);
    return answer.result;
  }

  /**
   * Confirmation Prompt
   * @param {String} message Message of confirmation
   * @param {Object} options
   * @param {any} options.default Default of confirmation
   * @returns {Boolean} Value given to prompt
   * @async
   */
  async promptConfirm(message, options) {
    const promptOptions = {
      type: 'confirm',
      message,
      name: 'result',
    };

    if (options && options.default) {
      promptOptions.default = options.default;
    }

    const answers = await prompt([promptOptions]);
    return answers.result;
  }

  /**
   * Confirmation Prompt
   * @param {String} message Message of confirmation
   * @param {Array} [choices=[]] Choices to list in the prompt
   * @param {Object} options
   * @param {any} options.default Default of confirmation
   * @returns {string} Value given to prompt
   * @async
   */
  async promptList(message, choices = [], options) {
    const promptOptions = {
      type: 'list',
      message,
      choices,
      name: 'result',
    };

    if (options && options.default) {
      promptOptions.default = options.default;
    }

    const answers = await prompt([promptOptions]);
    return answers.result;
  }
}

module.exports = {
  REPLClient,
};
