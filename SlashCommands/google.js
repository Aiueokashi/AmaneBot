const SlashCommand = require("../Structures/SlashCommand");
const serp = require("serp");

class Google extends SlashCommand {
  constructor(client) {
    super(client, {
      name: "google",
      description: "Googleで検索します",
      options: [
        {
          name: "検索ワード",
          description: "検索ワードを入力",
          type: 3,
          required: true,
        },
      ],
    });
  }

  async run(client) {
    const interaction = this.interaction;
    //const id = interaction.member.user.id;
    try {
      const options = {
        host: "google.co.jp",
        qs: {
          q: interaction.data.options[0].value,
          filter: 0,
          pws: 0,
        },
        num: 3,
      };
      const links = await serp.search(options);
      super.respond({
        data: {
          type: 4,
          data: {
            embeds: [
              {
                title: "検索結果",
              },
            ],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    label: `${links[0].title}`,
                    style: 5,
                    url: `https://www.google.co.jp${links[0].url}`,
                  },
                  {
                    type: 2,
                    label: `${links[1].title}`,
                    style: 5,
                    url: `https://www.google.co.jp${links[1].url}`,
                  },
                  {
                    type: 2,
                    label: `${links[2].title}`,
                    style: 5,
                    url: `https://www.google.co.jp${links[2].url}`,
                  },
                ],
              },
            ],
          },
        },
      });
    } catch (error) {
      super.respond({
        data: {
          type: 3,
          data: {
            flags: 64,
            content:
              "検索結果が見つからなかったようです…\n検索語句を変えてもう一度試してください。",
          },
        },
      });
    }
  }
}

module.exports = Google;
