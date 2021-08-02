const canvacord = require("canvacord");
const { MessageAttachment } = require("discord.js");

class GuildMemberAdd {
  constructor(client) {
    this.enable = true;
    this.client = client;
  }

  async run(member) {
    const client = this.client;
    const guildData = await client.findOrCreateGuild({ id: member.guild.id });

    if (guildData.plugins.welcome.enabled === false) {
      return;
    }

    const data = guildData.plugins.welcome;

    const welcome = new canvacord.Welcomer()
      .textTitle(member.user.tag)
      .setMemberCount(member.guild.memberCount)
      .textMessage(data.message);
    const img = await welcome.build();

    const attachment = new MessageAttachment(img, "WelcomeCard.png");

    member.guild.channels.get(data.channel).send(attachment);
  }
}

module.exports = GuildMemberAdd;
