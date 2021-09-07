const Command = require("../../Structures/Command");
const SnakeGame = require("../../Structures/Utils/Snake");

class SnakeCommand extends Command {
  constructor(client) {
    super(client, {
      name: "snake",
      description: "ヘビゲーム",
      usage: "",
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

  async run(message) {
    const snake = new SnakeGame(message);
    snake.newGame();
  }
}

module.exports = SnakeCommand;
