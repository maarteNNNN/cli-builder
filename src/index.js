const argv = require('minimist')(process.argv.slice(2));
const inquirer = require('inquirer');

const prompt = inquirer.createPromptModule();

// TODO: Implement an automatic help header with interactive and non-interactive usage, when using help non-interactively
class REPLClient {
  /**
   * Instantiate the CLI
   * @param {Object} options options
   * @param {Boolean} [options.enableInteractive=true] Allow interactive mode
   * @param {Array<String>} [options.exceptions=[]] The ability to explicitely not execute code before the actual command. E.g. an API call.
   * @param {String} [options.helpHeader] Header to show in help
   * @param {String} [options.helpFooter] Footer to show in help
   * @param {String} [options.binCommand] If error it will show how to access the help command
   * @param {Boolean} [options.logStackErrorMessages] For debug purposes
   * @param {Number} [options.tabSize=15] Tab size between command and help
   * @param {String} [options.argv] Manually pass arguments to cli (used for testing)
   * @param {Object.<String, Function>} [options.actions={}] Actions to mount to the CLI
   */
  constructor(options = {}) {
    if (process.env.NODE_ENV !== 'testing') this.argv = argv;
    else this.argv = options.argv;

    this.testing = process.env.NODE_ENV === 'testing';

    // OPTIONS
    this.options = options;
    this.options.tabSize = options.tabSize || 15;

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

    this.interactive = true;
  }

  /**
   * @private
   * @description Discover whether it's interactively ran or non-interactively
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
   * @description Log commands accordingly
   */
  _logHelpCommands() {
    // Log help header is there is any
    if (this.options.helpHeader) console.log(this.options.helpHeader);

    this.helpArray.forEach(
      ({ command, description, options = null, input = null }) => {
        const commandCharacterCount = command
          ? command.length + (input ? input.length : -1)
          : 0;
        const size = this.options.tabSize * 4 - commandCharacterCount;

        /**
         * If command log it with its discription
         * If log additional header for command specific help
         * e.g. cli-builder testing -h
         * will output the else if statement
         */
        if (command) {
          console.log(
            `${command}${input ? ' ' + input : ''} ${Array(size)
              .fill(' ')
              .join('')} ${description}`,
          );
        } else if (!options) {
          console.log(
            `\n\x1b[1mCommand help:\x1b[0m\n${description}\n\n\x1b[1mAdditional information, parameters, arguments, flags or options:\x1b[0m`,
          );
        }

        /**
         * Log the options related to the command help
         * Options is an object with option and help
         * Option can be a string or object with values short and long.
         *    Short is for example -v
         *    Long is for example --version
         *    Both of these have the same help description
         * Help only accepts a string
         *    It displays what the command does.
         */
        if (Array.isArray(options)) {
          for (let i = 0; i < options.length; i++) {
            const { option, help } = options[i];

            // Simulate tab spaces
            const tab = 4;
            const size = this.options.tabSize * 4;

            if (typeof option === 'object') {
              const optionSize =
                size - option.short.length - option.long.length - tab;

              console.log(
                `${command ? '    ' : ''}-${option.short}, --${
                  option.long
                } ${Array(optionSize).fill(' ').join('')} ${help}`,
              );
            } else {
              const optionSize = size - option.length - tab;

              console.log(
                `${command ? '    ' : ''}-${option} ${Array(optionSize)
                  .fill(' ')
                  .join('')} ${help}`,
              );
            }
          }
        }
      },
    );

    // Log help footer is there is any
    console.log('');
    if (this.options.helpFooter) console.log(this.options.helpFooter);

    this.helpArray = [];
  }

  /**
   * @private
   * @description Build an array to later on loop over and log them
   */
  _getHelpCommands(
    accumulator,
    commands,
    parentCommand,
    previousValue = null,
    root = true,
  ) {
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
            ? this.camelCaseToKebab(previousValue.join(' '))
            : this.camelCaseToKebab(key === 'help' ? null : key),
          description:
            typeof currentValue === 'function'
              ? 'No description available'
              : currentValue,
          options: !root ? accumulator.options : null,
          input: !root ? accumulator.input : null,
          parentCommand: key === 'help',
        });

        continue;
      } else {
        /**
         * Mount an array to get previous commands to display it nicely eg. `some deep nested command`
         * This used when using nested commands
         * TODO: Explain better what this actually does
         */
        if (key !== 'options' && key !== 'input') {
          const previousValues = previousValue
            ? Array.isArray(previousValue)
              ? [...previousValue, key]
              : [previousValue, key]
            : [key];

          this._getHelpCommands(
            currentValue,
            commands,
            parentCommand,
            previousValues,
            false,
          );

          continue;
        }

        /**
         * Display options on the root of the object
         */
        if (key === 'options' && root) {
          this.helpArray.push({ options: accumulator.options });
        }
      }
    }
  }

  /**
   * Runs the cli interface
   * @param {Object} [commands={}] Command object with function to execute
   * @param {Object} [options={}] Command object with function to execute
   * @description This is the initial entry to initialize the cli REPLClient.run({ commands })
   */
  async run(commands = {}) {
    /**
     * bindActionArgs are arguments that you want to pass to any function
     */
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

    /**
     * Runs the cli in interactive or non-interactive mode.
     * E.g. `cli-builder` will run interactive (if enabled in the options)
     * E.g. `cli-builder testing` will run in non-interactive mode
     */
    this.options.interactive
      ? await this._interactiveCmd()
      : await this._commandCmd();
  }

  /**
   * @async
   * @private
   * @description Loop over command until an exit or process.exit takes place
   */
  async _interactiveCmd() {
    while (this.interactive) {
      const command = await this.promptInput('>');
      if (!command) continue;
      this.argv._ = command.split(' ');
      await this._execCmd(command);
    }
  }

  /**
   * @async
   * @private
   * @description Executes a command
   */
  async _commandCmd() {
    const options = { ...this.argv };
    delete options._;
    await this._execCmd(this.argv._, options);
  }

  /**
   * @async
   * @private
   * @description Both interactive and non-interactive mode execute this function.
   */
  async _execCmd(cmd, options = {}) {
    // If interactive make the cmd an array to loop over
    if (cmd.includes(' ')) cmd = cmd.split(' ');

    try {
      const commands = [].concat(cmd);
      let accumulator = this.commands;

      for (let i = 0; i < commands.length + 1; i++) {
        const previousValue = commands[i - 1]
          ? this.kebabCaseToCamel(commands[i - 1])
          : null;

        const currentValue = commands[i]
          ? this.kebabCaseToCamel(commands[i])
          : null;

        const nextValue = commands[i + 1]
          ? this.kebabCaseToCamel(commands[i + 1])
          : null;

        /**
         * If non-interactive and -h or --help is provided
         * If interactive and help, -h or --help is provided
         * Construct the help output
         */
        if (
          // If it isn't interactive
          (!this.options.interactive &&
            !currentValue &&
            (options.hasOwnProperty('h') || options.hasOwnProperty('help'))) ||
          // If it is interactivecli
          (this.options.interactive &&
            (currentValue === 'help' ||
              currentValue === '-h' ||
              currentValue === '--help'))
        ) {
          const { help } = this.commands;

          // Delete help out of command to not display it in the help command.
          delete this.commands.help;

          this._getHelpCommands(accumulator, commands, previousValue);
          this._logHelpCommands();

          // Add the command again
          this.commands.help = help;

          // Return because the action is done
          break;
        }

        /**
         * If there isn't a currentValue and execute is part of the current accumulator then execute it.
         * Attach this so we can use it inside the function call
         * If interactive break and continue the while loop
         */
        if (typeof accumulator.execute === 'function' && !currentValue) {
          await accumulator.execute.call(this, {
            argument: this.camelCaseToKebab(currentValue),
            options,
          });
          if (this.options.interactive) break;
        }

        /**
         * If currentValue
         *    If accumulator has the currentValue
         *      If accumulator has the currentValue and had a help property in the object
         *      It doesn't have execute
         *      run execute
         *      I
         */
        if (currentValue) {
          if (accumulator.hasOwnProperty(currentValue)) {
            /**
             * If there is help on a known command but no execute, execute the parent command's execute
             * This is useful for e.g. extract a known property from an object
             * e.g. cli-builder get object returns { foo: 'foo', bar: 'bar' }
             * e.g. cli-builder get object foo returns foo
             */
            if (
              accumulator[currentValue].hasOwnProperty('help') &&
              !accumulator[currentValue].hasOwnProperty('execute')
            ) {
              await accumulator.execute.call(this, {
                argument: this.camelCaseToKebab(currentValue),
                options,
              });
              if (this.options.interactive) break;
              return;
            }

            accumulator = accumulator[currentValue];

            /**
             * If we're on the function execute it attach this and pass it options
             * It shouldn't have an argument so we pass null
             */
            if (typeof accumulator === 'function' && !nextValue) {
              await accumulator.call(this, { argument: null, options });
              /**
               * Continue if execute is a function
               * Let the next loop handle it
               */
            } else if (typeof accumulator.execute === 'function') {
              continue;
              /**
               * Continue if options.help or options.h is present
               * Let the next loop handle it
               */
            } else if (options.help || options.h) {
              continue;
              /**
               * If there isn't a nextValue throw and error
               * Command is invalid and needs more arguments
               */
            } else if (!accumulator.hasOwnProperty(nextValue)) {
              throw new Error('command is invalid and needs more arguments');
            }
            /**
             * It doesn't have the currentValue in the accumulator.
             * We presume it's an argument that needs to be passed to the function
             */
          } else {
            /**
             * If the accumulator has execute and it's a function
             * Execute it, give the currentValue
             * Break the loop because we're done
             * It will continue the while loop in interactive mode
             * Or exit when non-interactive
             */
            if (typeof accumulator.execute === 'function') {
              await accumulator.execute.call(this, {
                argument: this.camelCaseToKebab(currentValue),
                options,
              });
              break;
            } else if (this.options.bindActionArgs.length) {
              throw new Error('Command has parameter which is invalid.');
            }
            throw new Error('Command invalid.');
          }
        }
      }
    } catch (e) {
      if (this.options.logStackErrorMessages) console.error(e);
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
    this.interactive = false;
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
    return str.replace(/\B([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * Converts kebab-case to camelCase
   * @param {String} str String to be converted to camelCase
   * @returns {String} camelCase value
   * @throws {TypeError} No string given or not a string
   */
  kebabCaseToCamel(str) {
    if (!str) return;
    if (str.split('')[0] === '-') return str;
    if (typeof str !== 'string')
      throw new TypeError('Not a string or no string given');
    return str.includes('--')
      ? str.replace('--', '')
      : str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
  }

  /**
   * Prompt wrapper function
   * @param {String} message Prompt message
   * @param {Boolean} [secret] When true input is hidden
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
   * @param {Object} [options]
   * @param {any} [options.default] Default of confirmation
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
