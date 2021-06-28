const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class Message {
  constructor(client) {
    this.enable = true;
    this.client = client;
  }

  async run(message) {
    const client = this.client;
    const data = {};

    if (message.author.bot || message.system) return;

    if (!message.member && message.guild)
      message.member = await message.guild.members.fetch(message.author.id);

    if (message.guild) {
      const guild = await client.findOrCreateGuild(
        { id: message.guild.id },
        true
      );
      message.guild.data = data.guildData = guild;
      message.guild.prefix = guild.prefix;
      const memberData = await client.findOrCreateMember({
        id: message.author.id,
        guildID: message.guild.id,
      });
      data.memberData = memberData;
    }

    const userData = await client.findOrCreateUser(
      { id: message.author.id },
      true
    );
    data.userData = userData;

    message.parse(data);

    if (data.guildData.plugins.leveling.enabled) {
      try {
        await client.util.addExp(data.memberData, message.content);
      } catch (e) {
        //エラーとか知るか連投するな
      }
    }
    if (message.guild.ttsPlayer.connection) {
      if (!message._isCommand) {
        if (message.guild.ttsPlayer.readC.id === message.channel.id) {
          message.guild.ttsPlayer._run(message, data);
        }
      }
    }

    if (!message.command) return;
    if (message.command.disable) return;
    if (message.command.cmdCooldown.has(message.author.id))
      return (
        message.delete({ timeout: 10000 }) &&
        message
          .reply(
            "`<<cmd>>`コマンドは`<<time>>`秒に1回だけ使えます。"
              .replace(
                /<<time>>/gm,
                message.command.cmdCooldown.get(message.author.id) / 1000
              )
              .replace(/<<cmd>>/gm, message.command.name)
          )
          .then((msg) => msg.delete({ timeout: 10000 }))
      );
    if (message.command.ownerOnly && !client.owners.includes(message.author.id))
      return;

    if (message.command.guildOnly && !message.guild) return;

    if (message.command.nsfw && !message.channel.nsfw) return;

    if (message.command.args && !message.args.length)
      return message.channel.send(
        !message.command.usage || ""
          ? `${message.author} 引数がありません!`
          : {
              embed: {
                title: `${message.command.name.replace(/\b\w/g, (l) =>
                  l.toUpperCase()
                )}`,
                description: `> ${message.command.description}`,
                fields: [
                  {
                    name: "構文",
                    value: `\`\`\`${message.command.usage}\`\`\``,
                  },
                  {
                    name: "使用例",
                    value: `\`\`\`${
                      (message.command.example &&
                        message.command.example
                          .map(
                            (x) =>
                              `${
                                message.guild.prefix ||
                                this.client.config.prefix
                              }${message.command.name} ${x}`
                          )
                          .join("\n")) ||
                      "使用例なし"
                    }\`\`\``,
                  },
                ],
              },
            }
      );

    if (message.guild && !client.owners.includes(message.author.id)) {
      const userPerms = message.channel
        .permissionsFor(message.member)
        .missing(message.command.userPerms);

      if (userPerms.length)
        return message.reply("このコマンドを実行する権限がありません。");

      const botPerms = message.channel
        .permissionsFor(client.user)
        .missing(message.command.botPerms);

      if (botPerms.length)
        return message.reply("botの権限設定を確認してください。");
    }

    message.command.setMessage(message);

    message.command.run(message, message.args, data).then((re) => {
      if (message.command.cooldown > 0 && re !== "failed") {
        message.command.startCooldown(message.author.id);
      }
    });
  }
}

module.exports = Message;
