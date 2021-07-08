const Command = require("../../Structures/Command");
const { AmaneEmbed, PaginatedEmbed } = require("../../Structures/Embed");

class Help extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      description: "ヘルプ表示",
      usage: "help",
      example: [],
      args: [],
      category: "一般",
      cooldown: 0,
      aliases: [],
      permLevel: 0,
      guildOnly: true,
    });
  }

  async run(message, [...args], data) {
    const client = this.client;

    if (args[0]) {
      const COMMAND = client.commands.get(args[0]);
      if (!COMMAND || COMMAND.ownerOnly) {
        return super.respond(
          "コマンドが見つからなかったよ... :`" + args[0] + "`"
        );
      } else {
        let PERMS = [];
        if (COMMAND.userPermsNotBit.length > 0) {
          COMMAND.userPermsNotBit.forEach((p) =>
            PERMS.push(message.member.hasPermission(p) ? `✅${p}` : `❎${p}`)
          );
          let help_embed = new AmaneEmbed(data.userData)
            .setTitle(`${COMMAND.name} | カテゴリー:${COMMAND.category}`)
            .setDescription(
              COMMAND.description.replace(/<<p>>/gm, message.guild.prefix)
            )
            .addField("引数", COMMAND.args ? "必須" : "不要")
            .addField(
              "使用例",
              `\`\`\`${
                (COMMAND.example &&
                  COMMAND.example
                    .map((x) => `${data.guildData.prefix}${COMMAND.name} ${x}`)
                    .join("\n")) ||
                "使用例なし"
              }\`\`\``
            )
            .addField(`ユーザーに必要な権限`, PERMS)
            .addField("状態", COMMAND.disable ? "メンテナンス中" : "利用可能");
          super.respond(help_embed);
        }
      }
    } else {
      const COMMANDS = client.commands.array();
      const Embed_Array = new Array();

      function* getPage(pageSize = 1, list) {
        let output = [];
        let index = 0;
        let outputIndex = 0;
        while (index < list.length) {
          output = [];
          for (let i = index; i < index + pageSize; i++) {
            if (list[i]) {
              output.push(list[i]);
            }
          }
          index += pageSize;
          outputIndex++;
          yield [outputIndex, output];
        }
      }
      var page = getPage(10, COMMANDS);

      for (const value of page) {
        let help_embed = new AmaneEmbed(data.userData).setTitle(
          `${client.user.tag} | HELP`
        );
        value[1].forEach((v) => {
          v.ownerOnly
            ? null
            : help_embed.addField(
                `**${message.guild.prefix}${v.name} ${
                  v.aliases.length === 0 ? "" : ` | (${v.aliases})`
                }**`,
                `${v.description.replace(/<<p>>/gm, message.guild.prefix)}\n(${
                  v.disable === false ? "利用可能" : "メンテナンス中"
                })`,
                true
              );
        });
        help_embed.setTimestamp();
        Embed_Array.push(help_embed);
      }

      const embed = new PaginatedEmbed(message.author, Embed_Array);
      embed.run(message.channel);
    }
  }
}

module.exports = Help;
