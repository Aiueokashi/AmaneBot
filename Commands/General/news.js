const Command = require("../../Structures/Command");
const { AmaneEmbed } = require("../../Structures/Embed");
const axios = require("axios");

class News extends Command {
  constructor(client) {
    super(client, {
      name: "news",
      description: "今日のNewsを表示します",
      usage: "help",
      args: false,
      category: "一般",
      cooldown: 10000,
      permLevel: 0,
      guildOnly: false,
    });
  }
  async run(message, args) {
    //const client = this.client;
    const ApiURL = "https://news.yahoo.co.jp/rss/topics/top-picks.xml";
    const res = await axios.get(ApiURL);
    const embed = new AmaneEmbed(message.data.userData.color).setTitle(
      res.data
    );
    super.respond(embed);
  }
}
module.exports = News;
