const chalk = require("chalk"),
  Discord = require("discord.js");
(axios = require("axios")),
  (Canvas = require("canvas")),
  (Command = require("../../Structures/Command"));

class Eval extends Command {
  constructor(client) {
    super(client, {
      name: "eval",
      description: "Evaluate/Execute JavaScript code",
      usage: "eval [...code]",
      args: true,
      types: [
        {
          id: "code",
          type: "string",
        },
      ],
      nonparse: true,
      category: "Owner",
      cooldown: 0,
      permLevel: 10,
      ownerOnly: true,
    });
  }

  async run(message, args, data) {
    try {
      let evaled = await eval(args.code);
      if (typeof evaled !== "string")
        evaled = require("util").inspect(evaled, { depth: 0 });
      if (evaled.includes(this.client.token))
        evaled = evaled.replace(this.client.token, "gm", "*Token*");
      message.channel.send({ content: `\`\`\`js\n${evaled}\`\`\`` });
    } catch (error) {
      let errorDetails = error.toString();

      if (errorDetails.includes(this.client.token))
        errorDetails = errorDetails.replace(this.client.token, "gm", "*Token*");

      message.channel.send({ content: `\`\`\`js\n${errorDetails}\`\`\`` });
    } finally {
      const log = ` USE OF EVAL by ${message.author.username} ( ${message.author.id} )`;

      console.log(chalk.bold.bgRed(`EVAL [${log}]`));
    }
  }
}

module.exports = Eval;
