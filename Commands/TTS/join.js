const Command = require("../../Structures/Command"),
  { AmaneEmbed } = require("../../Structures/Embed");

class Join extends Command {
  constructor(client) {
    super(client, {
      name: "join",
      description: "ボイスチャンネルに入室させます。",
      usage: "join",
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

  async run(message, args) {
    message.guild.ttsPlayer
      ._join(message.member.voice.channel, message.channel)
      .then((c) => {
        let embed = new AmaneEmbed(message.data.userData)
          .setTitle("ボイスチャンネルに接続しました。🔊")
          .addField("読み上げるチャンネル📖", `<#${message.channel.id}>`, true)
          .addField("ボイスチャンネル🎤", `<#${c.channel.id}>`, true);
        super.respond({ embeds: [embed] });
      });
  }
}

module.exports = Join;
