const { Collection, Client } = require("discord.js");

module.exports = class CollectorManager {
  constructor(client) {
    __collectors = new Collection();

    this.client = client;

    client.on("message", message => {});
    client.on("messageReactionAdd", handleMessageEvent.bind(this));
  }
};
