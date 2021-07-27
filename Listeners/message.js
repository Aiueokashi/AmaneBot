class Message {
  constructor(client) {
    this.enable = true;
    this.client = client;
  }

  async run(message) {
    const client = this.client;
    client.debug(client.chalk.bold.green(`Message: (${message.id})`));
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

    message.data = data;
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
    if(message.mentions.members.keyArray() !== []){
      const mems = message.mentions.members.keyArray();
      for await(const m of mems){
        const u = await client.findOrCreateUser({id:m},true);
        if(u.afk){
          message.channel.embed(`理由: ${u.afk}`,"あなたがメンションしたユーザーは離席中です。",data.userData.color)
        }
      }
    }
    if (data.userData.afk !== null) {
      let d = await client.findOrCreateUser({ id: message.author.id });
      message
        .channel.send({
          embed: {
            title: "AFK解除",
            color: message.data.userData.color,
            description: '発言したためAFKが解除されました'
          }
        })
        .then((msg) => msg.delete({ timeout: 10000 }))
      d.afk = null;
      await d.save();
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
    const t = await message.command.resolve();
    if (t === undefined) {
      return;
    }
    message.command.run(message, message.command.resolvedargs).then((re) => {
      if (message.command.cooldown > 0 && re !== "failed") {
        message.command.startCooldown(message.author.id);
      }
    });
  }
}

module.exports = Message;