const { Structures } = require("discord.js"),
{ findBestMatch } = require('string-similarity'),
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
      checkEmoji() {
			if (this.channel.type == 'dm') {
				return true;
			} else {
				return this.channel.permissionsFor(this.client.user).has('USE_EXTERNAL_EMOJIS') ? true : false;
			}
		}
    }
);
