const Command = require("../../Structures/Command");
const Calc = require("../../Structures/Utils/Calculator");

class Calculator extends Command {
  constructor(client) {
    super(client, {
      name: "calculator",
      description: "計算機を表示します。",
      usage: "calculator",
      example: [],
      args: false,
      category: "一般",
      cooldown: 10000,
      aliases: ["calc"],
      permLevel: 0,
      disable: false,
      guildOnly: true,
      ownerOnly: false,
    });
  }

  async run(message) {
    Calc(message);
  }
}

module.exports = Calculator;
