const Command = require("../../Structures/Command");
const { AmaneEmbed, PaginatedEmbed } = require("../../Structures/Embed");
const { MessageButton } = require("okashidjs");

class Help extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      description: "ヘルプ表示",
      usage: "help",
      example: [],
      args: true,
      slash: {
        name: "help",
        description: "コマンドのヘルプを表示します。",
        options: [
          {
            name: "command",
            description:
              "コマンドの名前を指定すると詳しい情報を表示します(任意)。",
            required: false,
            type: 3,
          },
        ],
        async run(interaction, args) {
          const a = { command: client.commands.get(args[0]?.value) ?? "none" };
          client.commands.get(this.name).run(interaction, a);
        },
      },
      types: [
        {
          id: "command",
          type: "command",
          subtype: "commandAlias",
          default: "none",
        },
      ],
      category: "一般",
      cooldown: 0,
      aliases: [],
      permLevel: 0,
      guildOnly: true,
    });
  }

  async run(message, args) {
    const client = this.client;

    if (args.command !== "none" && args.command !== null) {
      const COMMAND = args.command;
      if (typeof COMMAND === "string") {
        return super.respond(
          "コマンドが見つからなかったよ... :`" + args.command + "`"
        );
      } else {
        let PERMS = [];
        COMMAND.userPermsNotBit.forEach((p) =>
          PERMS.push(message.member.permissions.has(p) ? `✅${p}` : `❎${p}`)
        );
        let help_embed = new AmaneEmbed(message.data.userData)
          .setTitle(`${COMMAND.name} | カテゴリー : ${COMMAND.category}`)
          .setDescription(
            COMMAND.description.replace(/<<p>>/gm, message.guild.prefix)
          )
          .addField("引数", COMMAND.args ? "必須" : "不要");
        COMMAND.aliases.length
          ? help_embed.addField("別称(alias)", COMMAND.aliases.join("|"))
          : null;
        help_embed
          .addField(
            "使用例",
            `\`\`\`${
              (COMMAND.example &&
                COMMAND.example
                  .map(
                    (x) =>
                      `${message.data.guildData.prefix}${COMMAND.name} ${x}`
                  )
                  .join("\n")) ||
              "使用例なし"
            }\`\`\``
          )
          .addField(`ユーザーに必要な権限`, PERMS.join(""))
          .addField("状態", COMMAND.disable ? "メンテナンス中" : "利用可能");
        super.respond({ embeds: [help_embed] });
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
        let help_embed = new AmaneEmbed(message.data.userData).setTitle(
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
      const button1 = new MessageButton()
        .setLabel("Previous")
        .setCustomID("previousbtn")
        .setStyle("DANGER");

      const button2 = new MessageButton()
        .setLabel("Next")
        .setCustomID("nextbtn")
        .setStyle("SUCCESS");
      const buttonList = [button1, button2];

      PaginatedEmbed(message, Embed_Array, buttonList);
    }
  }
}

module.exports = Help;
