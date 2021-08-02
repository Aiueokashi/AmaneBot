const Command = require("../../Structures/Command");

class Test extends Command {
  constructor(client) {
    super(client, {
      name: "test",
      description: "テスト用",
      usage: "test",
      example: [],
      args: false,
      category: "TEST",
      cooldown: 10000,
      aliases: [],
      permLevel: 10,
      disable: false,
      guildOnly: true,
      ownerOnly: true,
    });
  }
}

module.exports = Test;
