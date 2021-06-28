const Command = require("../../Structures/Command");
const { MessageAttachment } = require("discord.js");
const canvacord = require("canvacord");
const Canvas = require("canvas");
const { AmaneEmbed } = require("../../Structures/Embed");
//const font = fs.readFileSync("./Assets/Font/KleeOne-Regular.ttf",'utf-8')

class Rank extends Command {
  constructor(client) {
    super(client, {
      name: "rank",
      description: "xpやlevelの確認",
      usage: "help",
      example: [],
      args: false,
      category: "一般",
      cooldown: 10000,
      aliases: ["xp"],
      permLevel: 0,
      guildOnly: true,
    });
  }

  async run(message, [...args], d) {
    let msg = await message.channel.send(
      new AmaneEmbed(d.userData).setTitle(
        "<a:atlanta_loading:743090350490648727>画像を生成中です..."
      )
    );
    const canvas = Canvas.createCanvas(934, 282);
    let ctx = canvas.getContext("2d");
    const img = await Canvas.loadImage(
      "https://cdn.zekkei-japan.jp/images/articles/ef4f61494519692aa5ccb95d213a3e1b.jpg"
    );
    ctx.drawImage(img, -100, -200, 1100, 600);

    const client = this.client;
    //const resolveColor = client.util.resolveColor;
    const memberData = d.memberData;
    const userData = d.userData;
    const Rank = await client.util.getRank(
      client,
      message.guild.id,
      message.author.id
    );

    const rank = new canvacord.Rank()
      .registerFonts([
        {
          path: "./Assets/Font/KleeOne-Regular.ttf",
          face: { family: "Comic Sans" },
        },
      ])
      .setAvatar(message.author.displayAvatarURL({ format: "png" }))
      .setCurrentXP(memberData.exp)
      .setLevel(memberData.level)
      .setRank(Rank, `サーバー内順位:#`)
      .setBackground("IMAGE", await canvas.toBuffer())
      .setRequiredXP((memberData.level + 2) * (memberData.level + 1))
      .setStatus(message.author.presence.status)
      .setProgressBar(userData.color, "COLOR")
      .setUsername(
        message.member.nickname
          ? message.member.nickname
          : message.author.username
      )
      .setDiscriminator(message.author.discriminator);

    const data = await rank.build();
    const attachment = new MessageAttachment(data, "RankCard.png");
    msg.delete({ timeout: 100 });
    super.respond(attachment);
  }
}

module.exports = Rank;
