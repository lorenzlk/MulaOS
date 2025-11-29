const { getCommandRegistry } = require('./NaturalLanguageParser');

/**
 * Extract domain from command parameters
 * @param {string} command - Command name
 * @param {Object} parameters - Command parameters
 * @returns {string|null} Extracted domain or null
 */
function extractDomainFromCommand(command, parameters) {
  // Direct domain parameter
  if (parameters.domain) {
    return parameters.domain;
  }

  // Extract from URL
  if (parameters.url) {
    try {
      const url = new URL(parameters.url.startsWith('http') ? parameters.url : `https://${parameters.url}`);
      return url.hostname;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Map parsed command to slash command format
 * @param {Object} parsedCommand - Parsed command from natural language parser
 * @returns {Object} Mapped command ready for execution
 */
function mapCommandToSlashCommand(parsedCommand) {
  if (!parsedCommand.command || parsedCommand.needs_clarification) {
    return {
      canExecute: false,
      command: null,
      parameters: {},
      error: 'Needs clarification',
      clarificationQuestions: parsedCommand.clarification_questions || []
    };
  }

  const { command, parameters } = parsedCommand;
  const domain = extractDomainFromCommand(command, parameters);

  return {
    canExecute: true,
    command,
    parameters,
    domain,
    originalParsed: parsedCommand
  };
}

module.exports = {
  extractDomainFromCommand,
  mapCommandToSlashCommand
};

