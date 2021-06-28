const //chalk = require("chalk"),
  //axios = require("axios"),
  Command = require("../../Structures/Command");

class Register extends Command {
  constructor(client) {
    super(client, {
      name: "register",
      description: "Register slash command",
      usage: "register [command]",
      args: true,
      category: "Owner",
      cooldown: 0,
      permLevel: 10,
      ownerOnly: true,
    });
  }

  async run(message, [...target]) {
    const command = this.client.slashCommands.get("google");
    console.log(command);
    if (command.register === false) {
      command.create();
    }
  }
}

module.exports = Register;
