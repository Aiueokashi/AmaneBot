const Command = require("../../Structures/Command"),
  axios = require("axios");
const url = "https://srhpyqt94yxb.statuspage.io/api/v2/summary.json";
const components = [
  ["CloudFlare"],
  ["Voice"],
  ["API"],
  ["Tax Calculation Service"],
  ["Gateway"],
  ["Push Notifications"],
  ["Media Proxy"],
  ["Third-party"],
  ["EU West"],
  ["US West"],
  ["EU Central"],
  ["Brazil"],
  ["Singapore"],
  ["Hong Kong"],
  ["Sydney"],
  ["Russia"],
  ["US Central"],
  ["Japan"],
  ["US East"],
  ["South Africa"],
  ["US South"],
];
const { AmaneEmbed, PaginatedEmbed } = require("../../Structures/Embed");

class Ping extends Command {
  constructor(client) {
    super(client, {
      name: "ping",
      description: "pingコマンド",
      usage: "ping",
      example: [],
      args: false,
      category: "一般",
      cooldown: 10000,
      aliases: ["🏓"],
      permLevel: 0,
      guildOnly: true,
    });
  }

  async run(message, args, data) {
    const client = this.client;

    const dataEmbed = {
      title: "PONG",
      fields: [
        {
          name: "ボット",
          value: [
            "```",
            `     遅延 | ${Date.now() - message.createdTimestamp}ms`,
            `WebSocket | ${client.ws.ping}ms `,
            "```",
          ].join("\n"),
        },
      ],
      footer: "✔:利用可能 | ✗:利用不可 | ?:データ未取得",
    };

    try {
      const responce = await axios.get(url);
      const data = responce.data;
      components.forEach((c, i) => {
        const res = data.components.find((x) => x.name === c[0]);
        components[parseInt(i, 10)][1] = res
          ? res.status === "operational"
            ? "✔"
            : "✗"
          : "?";
      });
      dataEmbed.fields.push(
        {
          name: "サービス",
          value: [
            "```",
            `CloudFlare │ ${[components[0][1]]} : ${[
              components[1][1],
            ]} │ Voice`,
            `       API │ ${[components[2][1]]} : ${[
              components[3][1],
            ]} │ Tax Calc`,
            `   Gateway │ ${[components[4][1]]} : ${[
              components[5][1],
            ]} │ Push Notif`,
            `Med. Proxy │ ${[components[6][1]]} : ${[
              components[7][1],
            ]} │ Third-party`,
            "```",
          ].join("\n"),
        },
        {
          name: "サーバーステータス",
          value: [
            "```",
            `   EU West │ ${[components[8][1]]} : ${[
              components[9][1],
            ]} │ US West`,
            `EU Central │ ${[components[10][1]]} : ${[
              components[11][1],
            ]} │ Brazil`,
            ` Singapore │ ${[components[12][1]]} : ${[
              components[13][1],
            ]} │ Hong Kong`,
            `    Sydney │ ${[components[14][1]]} : ${[
              components[15][1],
            ]} │ Russia`,
            `US Central │ ${[components[16][1]]} : ${[
              components[17][1],
            ]} │ Japan`,
            `   US East │ ${[components[18][1]]} : ${[
              components[19][1],
            ]} │ South Afr`,
            `  US South │ ${[components[20][1]]} :   │ `,
            "```",
          ].join("\n"),
        },
        {
          name: "障害",
          value: `\`\`\`${data.incidents ? "なし" : data.incidents}\`\`\``,
        }
      );
    } catch (e) {
      e;
    } finally {
      //console.log(dataEmbed)
      const embed = new AmaneEmbed(data.userData,dataEmbed);
      const info = new AmaneEmbed(data.userData).setTitle("いんふぉ");
      const page = new PaginatedEmbed(message.client.user, [embed]);
      page.setInfoPage(info);
      page.run(message.channel);
    }
  }
}

module.exports = Ping;
