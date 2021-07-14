const { Structures } = require("discord.js"),
  { AmaneEmbed } = require("../Embed");

//Guildクラス拡張
Structures.extend(
  "DMChannel",
  (DMChannel) =>
    class extends DMChannel {
      constructor(client, data) {
        super(client, data);
      }
      embed(d, t = null, c = null) {
        let embed = new AmaneEmbed();
        t === null ? null : embed.setTitle(t);
        c === null ? null : embed.setColor(c);
        this.send(embed.setDescription(d));
      }
    }
);

Structures.extend(
  "TextChannel",
  (TextChannel) =>
    class extends TextChannel {
      constructor(guild, data) {
        super(guild, data);
      }
      embed(d, t = null) {
        let embed = new AmaneEmbed();
        t === null ? null : embed.setTitle(t);
        this.send(embed.setDescription(d));
      }
    }
);
