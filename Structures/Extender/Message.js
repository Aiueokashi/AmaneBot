const { Structures } = require("discord.js"),
  { findBestMatch } = require("string-similarity"),
  mongoose = require("mongoose");

//Message拡張
Structures.extend(
  "Message",
  (Message) =>
    class extends Message {
      constructor(client, data, channel) {
        super(client, data, channel);
        this.args = [];
      }
      escapeRegex(str) {
        str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }

      parse(data) {
        const client = this.client;
        if (this.guild) {
          const prefixRegex = new RegExp(
            `^(<@!?${this.client.user.id}>|${this.escapeRegex(
              data.guildData.prefix
            )})`
          );
          this._isCommand = prefixRegex.test(this.content);
          if (!this._isCommand) return;

          const [, matchedPrefix] = this.content.match(prefixRegex);
          let content = this.content
            .slice(matchedPrefix.length)
            .split(/[\s]+/gm);
          if (content[0] === "") {
            content.shift();
          }
          const [commandPrefix, ...args] = content;

          if (commandPrefix === undefined) return;
          this.args = args;
          this.command =
            client.commands.get(commandPrefix.toLowerCase()) ||
            client.commands.get(
              client.aliases.get(commandPrefix.toLowerCase())
            );
          if(this.command.nonparse){
            this.args = args.join(' ');
          }
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
    }
);
