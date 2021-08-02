const Command = require("../../Structures/Command");
const { MessageEmbed } = require("discord.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

class Weather2 extends Command {
  constructor(client) {
    super(client, {
      name: "weather2",
      aliases: ["wea2"],
      description: "今日,明日,明後日の天気を表示します",
      usage: "weather2 [city name]",
      example: ["東京"],
      args: true,
      types: [
        {
          id: "prefecture",
          type: "string",
        },
      ],
      category: "一般",
      cooldown: 0,
      permLevel: 0,
      guildOnly: true,
    });
  }
  //ディレクトリ取得
  get directory() {
    return `${path.dirname(require.main.filename)}${path.sep}`;
  }
  async run(message, args) {
    const client = this.client;
    const wea_json = JSON.parse(
      fs.readFileSync(`${this.directory}/Assets/Json/prefecture.json`, "utf8")
    );
    let Wea_embed_array = new Array();
    const prefecture = wea_json.find((j) => j.name.startsWith(args.prefecture));
    if (prefecture === undefined) {
      return super.respond("都道府県名を指定してください。");
    }
    if (prefecture.id === "01") {
      return super.respond("北海道は大きすぎるので市区町村の指定が必要です。");
    }
    const ApiURL =
      "https://www.jma.go.jp/bosai/forecast/data/forecast/" +
      prefecture.id +
      "0000.json";
    const res = await axios.get(ApiURL);
    const data = res.data;
    data[0].timeSeries[0].areas.forEach((area) => {
      let wea_embed = new MessageEmbed();
      wea_embed
        .setTitle(data[0].publishingOffice)
        .setDescription(`対象地域: ${area.area.name} (${area.area.code})`)
        .addField(
          "今日の天気",
          `${this.client.findWeatherCode(area.weatherCodes[0])}`,
          true
        );
      wea_embed.addField(
        "明日の天気",
        `${this.client.findWeatherCode(area.weatherCodes[1])}`,
        true
      );
      wea_embed.addField(
        "明後日の天気",
        `${this.client.findWeatherCode(area.weatherCodes[2])}`,
        true
      );
      wea_embed.setTimestamp(data[0].reportDatetime);
      Wea_embed_array.push(wea_embed);
    });
    client.util.createPageEmbed(message, Wea_embed_array, true, true);
  }
}
module.exports = Weather2;
