const argv = require('minimist')(process.argv.slice(2));
const { kebabCaseToCamel, promptInput } = require('./lib');

class Cli {
  /**
   *
   * @param {Object} options options
   * @param {string} options.command Command to put in logs
   * @param {string} options.link Link to repo, this can help your error message
   * @param {boolean} options.enableInteractive Allow interactive mode
   * @param {Promise} options.beforeLoad Function to execute before initialization
   * @param {Promise} options.afterLoad Function to execute after initialization
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

    this.commands = commands || {};

    this.helpArray = [];

    this.commands = {
      ...this.commands,
      help: async () => {
        const commands = this.commands;
        delete commands.help;

        this.getHelpCommands(commands);

        for (let i = 0; i < this.helpArray.length; i++) {
          const helpLog = this.helpArray[i];
          await helpLog();
        }
      },
    };
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

  async run() {
    // Function to run before initialization
    if (this.options.preload) await this.options.preload();

    this.options.interactive
      ? await this.interactiveCmd()
      : await this.commandCmd();

    // Function to run after initialization
    if (this.options.afterLoad) await this.options.afterLoad();
  }

  async interactiveCmd() {
    const cmd = await promptInput('interactive command >');
    await this.execCmd(cmd);
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

        if (typeof accumulator.execute === 'function' && !currentValue)
          return await accumulator.execute();

        if (currentValue) {
          if (accumulator.hasOwnProperty(currentValue)) {
            accumulator = accumulator[currentValue];
            if (typeof accumulator === 'function') await accumulator();
          } else if (typeof accumulator[currentValue] === 'function')
            await accumulator[currentValue]();
          else throw new Error('command invalid');
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
  Cli,
  kebabCaseToCamel,
  promptInput,
};
