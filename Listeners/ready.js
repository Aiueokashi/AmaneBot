const chalk = require("chalk");
//axios = require("axios"),
//glob = require("glob"),
//fs = require("fs"),
//path = require("path");

class Ready {
  constructor(client) {
    this.enable = true;
    this.client = client;
  }
  async run() {
    const client = this.client;
    console.log(chalk.bold.bgBlue("CLIENT [READY]: " + client.user.tag));
    client.debug(chalk.bold.bgBlue("CLIENT [READY]: " + client.user.tag));
    await client.loadSlashCommands(client);
    await client.loadGuilds();

    /*市区町村ファイル生成 (./Json/prefecture.json)*/

    /*const url = "https://madefor.github.io/jisx0401/api/v1/jisx0401-ja.json";
    const res = await axios.get(url);
    const data = res.data;
    let preArray = [];
    for(const d in data){
      const url2 = `https://www.land.mlit.go.jp/webland/api/CitySearch?area=${d}`;
      const resp = await axios.get(url2);
      delete resp.data.status;
      preArray.push({name:data[d],id:d,muni_data:resp.data.data})
    }
    fs.writeFileSync('prefecture.json',JSON.stringify(preArray))*/

    //<<<<<<<<<<<<<<<===================for debug====================>>>>>>>>>>>>>>>>>
    //console.log(client.commandHandler)
  }
}

module.exports = Ready;
