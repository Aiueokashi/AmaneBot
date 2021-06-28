const //{ Permissions } = require("discord.js"),
  //AmaneError = require("./Extender/Error"),
  axios = require("axios"),
  { TOKEN, DEV_API_URL } = process.env;
const Header = {
  headers: {
    Authorization: "Bot " + TOKEN,
    "Content-Type": "application/json",
  },
};

class SlashCommand {
  constructor(client, options = {}) {
    this.client = client;

    this.enable = options.enable || true;
    this.name = options.name || null;
    this.description = options.description || "説明なし";
    this.options = options.options || [];
  }

  setInteraction(interaction) {
    this.interaction = interaction;
  }

  respond(data) {
    return this.client.api
      .interactions(this.interaction.id, this.interaction.token)
      .callback.post(data);
  }

  async del() {
    const del = await axios.delete(`${DEV_API_URL}/${this.id}`, Header);
    return del.data;
  }

  async create() {
    const data = {
      name: this.name,
      description: this.description,
      options: this.options,
    };
    const post = await axios.post(DEV_API_URL, data, Header);
    if (!post.data) {
      return "failed";
    }
    return post.data;
  }

  async delete() {
    const del = await axios.delete(`${DEV_API_URL}`);
    return del;
  }

  async array() {
    const res = await axios.get(DEV_API_URL, Header);
    if (res.data) {
      return res.data;
    }
    return res.data;
  }
}

module.exports = SlashCommand;
