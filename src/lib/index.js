const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

module.exports = {
  /**
   * Converts camelCase to kebas-case
   * @param {string} str String to be converted to kebab-case
   */
  camelCaseToKebab: (str) =>
    str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase(),
  /**
   * Converts kebab-case to camelCase
   * @param {string} str String to be converted to camelCase
   */
  kebabCaseToCamel: (str) => str.replace(/-./g, (x) => x.toUpperCase()[1]),
  /**
   * Prompt wrapper function
   * @param {string} message Prompt message
   * @param {boolean} secret When true input is hidden
   */
  promptInput: async (message, secret) => {
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
  },
};
