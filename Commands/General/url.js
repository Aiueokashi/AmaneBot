const Command = require("../../Structures/Command");
const axios = require("axios");

class Url extends Command {
  constructor(client) {
    super(client, {
      name: "url",
      description: "urlを短縮します",
      usage: "help",
      args: false,
      category: "一般",
      cooldown: 0,
      permLevel: 0,
      guildOnly: false,
      types: [
        {
          id: "url",
          type: "url",
        },
      ],
    });
  }
  async run(message, args) {
    const URL = args.url;
    const ApiURL = "https://ux.nu/api/short?url=" + URL;
    const res = await axios.get(ApiURL);
    const data = res.data.data.url;
    message.channel.embed(
      data,
      `URLを短縮しました`,
      message.data.userData.color
    );
  }
}
module.exports = Url;
