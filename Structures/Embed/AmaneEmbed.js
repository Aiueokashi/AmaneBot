const { MessageEmbed } = require("discord.js");

module.exports = class AmaneEmbed extends MessageEmbed {
  constructor(userData, data = {}, category = null) {
    super(data);
    if (userData) {
      this.setColor(userData.color);
    }
    this.setTimestamp();
  }

  setDescriptionFromBlockArray(blocks) {
    this.description = blocks
      .map((lines) => lines.filter((l) => !!l).join("\n"))
      .filter((b) => !!b.length)
      .join("\n\n");
    return this;
  }
};
