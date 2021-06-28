const SlashCommand = require("../Structures/SlashCommand");

class TTS extends SlashCommand {
  constructor(client) {
    super(client, {
      name: "tts",
      description: "読み上げ設定を変更します。",
      options: [
        {
          name: "読み上げ音声",
          description: "",
          type: 3,
          required: true,
          choices: [
            {
              name: "type",
              value: "type",
            },
            {
              name: "mode",
              value: "mode",
            },
            {
              name: "speed",
              value: "speed",
            },
            {
              name: "pitch",
              value: "pitch",
            },
          ],
        },
        {},
      ],
    });
  }

  async run(client) {
    //const interaction = this.interaction;
    //const id = interaction.member.user.id;

    super.respond({
      data: {},
    });
  }
}

module.exports = TTS;
