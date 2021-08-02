const { MessageButton } = require("discord.js");
const { AmaneError } = require("../Exntender/Error");
function split(array, count) {
  const groups = [];
  for (let i = 0; i < array.length; i += count)
    groups.push(array.slice(i, i + count));

  return groups;
}

module.exports = class ButtonMenu {
  constructor(message, mainEmbed, options) {
    this.mainEmbed = mainEmbed;
    this.constructor.validation(message, options);
    this.message = message;
    this.options = options;
    this.collector = null;
  }
  static validation(message, options) {
    if (typeof message !== "object")
      throw new AmaneError("BUTTONMENU_VALIDATION_FAILED", typeof message);
  }
  async start() {
    let row = [];
    const emojiKeys = Object.entries(this.options);

    emojiKeys.forEach((totalObj) => {
      const emojiId = totalObj[0];
      if (!totalObj[1]) return;
      const button = new MessageButton()
        .setCustomID(emojiId.toString())
        .setStyle("SUCCESS")
        .setEmoji(emojiId.toString());
      row.push(button);
    });

    row = split(row, 5);
    let message = await this.message.channel.send({
      embeds: [this.mainEmbed],
      components: row,
    });

    const collector = message.createMessageComponentInteractionCollector({
      idle: 45000,
      filter: (x) => x.user.id !== client.user.id,
    });
    await collector.on("collect", async (button) => {
      if (button.user.id !== this.message.author.id)
        return button.reply({
          content: "このボタンは使えません。",
          ephemeral: true,
        });
      const embed = this.options[button.customID];
      if (message.embeds[0].description == embed.description)
        return button.reply({
          content: "別のボタンを選んでください",
          ephemeral: true,
        });

      message = await message.edit({ embeds: [embed] });
      button.deferUpdate();
    });
    collector.on("end", () => message.edit({ components: [] }));
  }
};
