const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
      const memberData = await client.findOrCreateMember(
        {
          id: message.author.id,
          guildID: message.guild.id
        },
        true
      );
      data.memberData = memberData;
    }

    const userData = await client.findOrCreateUser(
      { id: message.author.id },
      true
    );
    data.userData = userData;

    if (data.guildData.plugins.leveling.enabled) {
      try {
        await client.util.addExp(data.memberData, message.content);
      } catch (e) {
        //エラーとか知るか連投するな
      }
    }
    if (message.guild.ttsPlayer.connection) {
      const prefixRegex = new RegExp(
        `^(<@!?${message.client.user.id}>|${escapeRegex(
          data.guildData.prefix
        )})`
      );
      if (!prefixRegex.test(message.content)) {
        if (message.guild.ttsPlayer.readC.id === message.channel.id) {
          message.guild.ttsPlayer._run(message, data);
        }
      }
    }

    const prefixRegex = new RegExp(
      `^(<@!?${message.client.user.id}>|${escapeRegex(data.guildData.prefix)})`
    );
    if (!prefixRegex.test(message.content)) return;
    const [, matchedPrefix] = message.content.match(prefixRegex);
    let content = message.content.slice(matchedPrefix.length).split(/[\s]+/gm);

    if (content[0] === "") {
      let trash = content.shift();
    }
    const [commandPrefix, ...args] = content;

    if (commandPrefix === undefined) return;

    const command =
      client.commands.get(commandPrefix.toLowerCase()) ||
      client.commands.get(client.aliases.get(commandPrefix.toLowerCase()));

    if (!command) return;
    if (command.disable) return;
    if (command.cmdCooldown.has(message.author.id))
      return (
        message.delete({ timeout: 10000 }) &&
        message
          .reply(
            "`<<cmd>>`コマンドは`<<time>>`秒に1回だけ使えます。"
              .replace(
                /<<time>>/gm,
                command.cmdCooldown.get(message.author.id) / 1000
              )
              .replace(/<<cmd>>/gm, command.name)
          )
          .then(msg => msg.delete({ timeout: 10000 }))
      );
    if (command.ownerOnly && !client.owners.includes(message.author.id)) return;

    if (command.guildOnly && !message.guild) return;

    if (command.nsfw && !message.channel.nsfw) return;

    if (command.args && !args.length)
      return message.channel.send(
        !command.usage || ""
          ? `${message.author} 引数がありません!`
          : {
              embed: {
                title: `${command.name.replace(/\b\w/g, l => l.toUpperCase())}`,
                description: `> ${command.description}`,
                fields: [
                  {
                    name: "構文",
                    value: `\`\`\`${command.usage}\`\`\``
                  },
                  {
                    name: "使用例",
                    value: `\`\`\`${(command.example &&
                      command.example
                        .map(
                          x =>
                            `${message.guild.prefix ||
                              this.client.config.prefix}${command.name} ${x}`
                        )
                        .join("\n")) ||
                      "使用例なし"}\`\`\``
                  }
                ]
              }
            }
      );

    if (message.guild && !client.owners.includes(message.author.id)) {
      const userPerms = message.channel
        .permissionsFor(message.member)
        .missing(command.userPerms);

      if (userPerms.length)
        return message.reply("このコマンドを実行する権限がありません。");

      const botPerms = message.channel
        .permissionsFor(client.user)
        .missing(command.botPerms);

      if (botPerms.length)
        return message.reply("botの権限設定を確認してください。");
    }

    command.setMessage(message);

    command.run(message, args, data).then(re => {
      if (command.cooldown > 0 && re !== "failed") {
        command.startCooldown(message.author.id);
      }
    });
  }
}

module.exports = Message;
