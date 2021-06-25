const SlashCommand = require("../Structures/SlashCommand");

class Test extends SlashCommand {
  constructor(client) {
    super(client, {
      name: "test",
      description: "テスト用",
    });
  }

  async run(client) {
    const interaction = this.interaction;
    const id = interaction.member.user.id;

    super.respond({
      data: {
        type: 4,
        data: {
          content: `<@${id}>`,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: `GlanzMember`,
                  style: 5,
                  url: "https://replit.com/@GlanzMember",
                },
              ],
            },
          ],
        },
      },
    });
  }
}

module.exports = Test;
