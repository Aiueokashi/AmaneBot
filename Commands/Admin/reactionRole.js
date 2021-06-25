const Command = require("../../Structures/Command");

class ReactionRole extends Command {
  constructor(client) {
    super(client, {
      name: "rolepanel",
      aliases: ["rp"],
      description:
        "ロールパネルを作ります。\n第一引数にロールID&メンション、第二引数にリアクションに使う絵文字を設定します。\nリアクションをつけるメッセージを指定したい場合は第三引数にメッセージIDを入れてください。",
      usage: "rolepanel @role <emoji> (messageId)",
      example: ["@verified  ✅ 1234567890123"],
      args: true,
      category: "Admin",
      cooldown: 1000,
      userPerms: ["ADMINISTRATOR"],
      permLevel: 9,
      ownerOnly: false,
    });
  }

  async run(message, [...args]) {
    if (args[0])
      var role = this.client.util.resolveRole(
        args[0],
        message.guild.roles.cache
      );
    if (args[1]) var emoji = args[1];
    if (args[2]) {
      var msg = await message.channel.messages.fetch(args[2]);
    } else {
      var msg = message;
    }

    this.client.reactionRoleManager.createReactionRole({
      message: msg,
      roles: [role],
      emoji,
      type: 1,
    });
  }
}

module.exports = ReactionRole;
