const Command = require("../../Structures/Command");
const { MessageSelectMenu, MessageActionRow } = require("okashidjs");

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
  async run(message, args) {
    const menu = new MessageSelectMenu()
      .setCustomID("menu")
      .addOptions({ label: "test1", value: "test1を選択したよ" })
      .addOptions({ label: "test2", value: "test2を選択したよ" });
    const row = new MessageActionRow().addComponents(menu);
    message.channel.send({ content: "test", components: [row] });
    this.client.on("interactionCreate", async (i) => {
      if (i.type === "MESSAGE_COMPONENT") {
        if (i.user.id === message.author.id) {
          i.reply(i.values[0]);
        }
      } else {
        return;
      }
    });
  }
}

module.exports = Test;
