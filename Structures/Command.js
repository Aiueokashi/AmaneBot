const { Permissions } = require("discord.js"),
  //CommandParameter = require("./Extender/Parameter/CommandParameter"),
  AmaneError = require("./Extender/Error");

class Command {
  constructor(client, options = {}) {
    this.client = client;

    this.name = options.name || null;
    this.aliases = options.aliases || [];
    this.description = options.description || "説明なし";
    this.example = options.example || [];
    this.category = options.category || "一般";
    this.args = options.args || false;
    this.usage = options.usage || null;
    this.cooldown = options.cooldown || 1000;
    this.disable = options.disable || false;
    this.userPerms = new Permissions(
      options.userPerms || "SEND_MESSAGES"
    ).freeze();
    this.userPermsNotBit = options.userPerms || ["SEND_MESSAGES"];
    this.botPerms = new Permissions(
      options.botPerms || "SEND_MESSAGES"
    ).freeze();
    this.botPermsNotBit = options.botPerms || ["SEND_MESSAGES"];
    this.guildOnly = options.guildOnly || false;
    this.ownerOnly = options.ownerOnly || false;
    this.nsfw = options.nsfw || false;
    this.cmdCooldown = new Map();
  }

  async run() {
    const err = new AmaneError("NOT_PROVIDE_RUN_METHOD", this.name);
    this.message.channel.send({
      embed: { title: err.code, description: err.message }
    });
    throw err;
  }

  _run() {}

  startCooldown(user) {
    this.cmdCooldown.set(user, this.cooldown);
    setTimeout(() => {
      this.cmdCooldown.delete(user);
    }, this.cooldown);
  }

  setMessage(message) {
    this.message = message;
  }

  respond(message) {
    return this.message.channel.send(message);
  }
}

module.exports = Command;
