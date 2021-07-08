const { Permissions } = require("discord.js"),
  ContentParser = require("./Command/ContentParser"),
  ArgumentRunner = require("./Command/Argument/ArgumentRunner"),
  Argument = require("./Command/Argument/Argument"),
  AmaneError = require("./Extender/Error");

class Command {
  constructor(client, options = {}) {
    this.client = client;

    this.name = options.name || null;
    this.aliases = options.aliases || [];
    this.description = options.description || "説明なし";
    this.example = options.example || [];
    this.category = options.category || "一般";
    this.quoted = options.quoted || true;
    this.separator = options.separator || "";
    this.args = options.args || [];
    this.flags = options.flags || [];
    this.optionFlags = options.optionFlags || [];
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
    const { flagWords, optionFlagWords } = Array.isArray(this.args)
            ? ContentParser.getFlags(this.args)
            : { flagWords: this.flags, optionFlagWords: this.optionFlags };

    const  quoted = this.quoted;
    const separator = this.separator;
        this.contentParser = new ContentParser({
            flagWords,
            optionFlagWords,
            quoted,
            separator
        });

        this.argumentRunner = new ArgumentRunner(this);
        this.argumentGenerator = Array.isArray(this.args)
            ? ArgumentRunner.fromArguments(this.args.map(arg => [arg.id, new Argument(this, arg)]))
            : this.args.bind(this);
  }

  async run() {
    const err = new AmaneError("NOT_PROVIDE_RUN_METHOD", this.name);
    this.message.channel.send({
      embed: { title: err.code, description: err.message },
    });
    throw err;
  }

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
  parse(message, content) {
        const parsed = this.contentParser.parse(content);
        return this.argumentRunner.run(message, parsed, this.argumentGenerator);
    }
}

module.exports = Command;
