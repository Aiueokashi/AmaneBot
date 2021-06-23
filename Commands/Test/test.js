const Command = require("../../Structures/Command"),
  axios = require("axios"),
  url = "https://discord.com/api/v8/applications/823122293189902336/commands",
  json = {
    name: "test",
    description: "test",
    options: []
  };

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
      ownerOnly: true
    });
  }

  async run(message) {
    const client = this.client;
    const responce = await axios.get(
      "https://discord.com/api/v8/applications/823122293189902336/commands",
      {
        headers: {
          Authorization: "Bot " + process.env.TOKEN,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(responce.data);
    /*
		axios
			.post(url, json, {
				headers: {
					Authorization: 'Bot ' + process.env.TOKEN,
					'Content-Type': 'application/json'
				}
			})
			.then(res => console.log(res))
			.catch(e => console.error(e));
			*/
  }
}

module.exports = Test;
