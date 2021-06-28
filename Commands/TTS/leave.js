const Command = require("../../Structures/Command"),
  { AmaneEmbed } = require("../../Structures/Embed");

class Leave extends Command {
  constructor(client) {
    super(client, {
      name: "leave",
      description: "ボイスチャンネルから退出させます。",
      usage: "leave",
      example: [],
      args: false,
      category: "TTS",
      cooldown: 1000,
      aliases: [],
      permLevel: 0,
      disable: false,
      guildOnly: true,
      ownerOnly: false,
    });
  }

  async run(message, args, data) {
    message.guild.ttsPlayer._leave().then(() => {
      let embed = new AmaneEmbed(data.userData).setTitle(
        "ボイスチャンネルから退出しました。。🔊"
      );
      super.respond(embed);
    });
  }
}

module.exports = Leave;
