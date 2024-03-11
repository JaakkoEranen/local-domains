const sudo = require('sudo-prompt');

const executeSudoCommands = (commandsArray) => {
  const command = commandsArray.join(' && ');
  const options = {
    name: 'Local Domains',
  };
  
  return new Promise((resolve, reject) => {
    sudo.exec(command, options, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve({ stdout, stderr });
    });
  });
}

module.exports = { executeSudoCommands };