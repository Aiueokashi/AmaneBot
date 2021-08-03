const { Structures } = require("okashidjs"),
  { findBestMatch } = require("string-similarity"),
  mongoose = require("mongoose");

//Message拡張
Structures.extend(
  "Message",
  (Message) =>
    class extends Message {
      constructor(client, data, channel) {
        super(client, data, channel);
      }
      escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }

      parse(data) {
        const client = this.client;
        const prefixRegex = new RegExp(
          `^(<@!?${this.client.user.id}>|${
            this.guild
              ? this.escapeRegex(data.guildData.prefix)
              : this.escapeRegex(this.client.config.prefix)
          })`
        );
        this._isCommand = prefixRegex.test(this.content);
        if (!this._isCommand) return;

        const [, matchedPrefix] = this.content.match(prefixRegex);
        let content = this.content.slice(matchedPrefix.length).split(/[\s]+/gm);
        if (content[0] === "") {
          content.shift();
        }
        const [commandPrefix, ...args] = content;

        if (commandPrefix === undefined) return;
        this.args = args;
        this.command =
          client.commands.get(commandPrefix.toLowerCase()) ||
          client.commands.get(client.aliases.get(commandPrefix.toLowerCase()));
        if (this.command && this.command.nonparse) {
          this.args = args.join(" ");
        }
      }
      checkEmoji() {
        if (this.channel.type == "dm") {
          return true;
        } else {
          return this.channel
            .permissionsFor(this.client.user)
            .has("USE_EXTERNAL_EMOJIS")
            ? true
            : false;
        }
      }
      delete(options = {}) {
        if (typeof options !== "object")
          return Promise.reject(
            new TypeError("INVALID_TYPE", "options", "object", true)
          );
        const { timeout = 0, reason } = options;
        if (timeout <= 0) {
          return this.channel.messages.delete(this.id, reason).then(() => this);
        } else {
          return new Promise((resolve) => {
            this.client.setTimeout(() => {
              resolve(this.delete({ reason }));
            }, timeout);
          });
        }
      }
    }
);
