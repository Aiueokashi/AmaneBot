const Command = require("../../Structures/Command");
  //{ PaginatedEmbed } = require("../../Structures/Embed");

class TTSSettings extends Command {
  constructor(client) {
    super(client, {
      name: "ttssetings",
      description: "読み上げの設定を行います。",
      usage: "tts",
      example: ["--mode 1", "--type haruka", "--speed 150", "--pitch 120"],
      args: true,
      category: "TTS",
      cooldown: 1000,
      aliases: ["tts"],
      permLevel: 0,
      disable: false,
      guildOnly: true,
      ownerOnly: false,
    });
  }

  async run(message) {
    const client = this.client;
    const userData = await client.findOrCreateUser({ id: message.author.id });
    const args = message.content.split("--");
    args.shift();
    switch (args[0]) {
      case "mode":
        const deft = userData.TTSMode;
        userData.TTSMode = args[1];
        await userData.save();
        super.respond(`モードを変更しました :${deft} => ${args[1]}`);
        break;
      case "type":
        const defv = userData.voiceType;
        userData.voiceType = args[1];
        await userData.save();
        super.respond(
          `タイプを変更しました(モード2のみ) :${defv} => ${args[1]}`
        );
        break;
      case "speed":
        const defs = userData.speed;
        userData.speed = args[1];
        await userData.save();
        super.respond(
          `スピードを変更しました(モード2のみ) :${defs} => ${args[1]}`
        );
        break;
      case "pitch":
        const defp = userData.pitch;
        userData.pitch = args[1];
        await userData.save();
        super.respond(
          `ピッチを変更しました(モード2のみ) :${defp} => ${args[1]}`
        );
        break;
    }
  }
}

module.exports = TTSSettings;
