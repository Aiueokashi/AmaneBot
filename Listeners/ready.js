const chalk = require("chalk");
const glob = require("glob");

class Ready {
  constructor(client) {
    this.enable = true;
    this.client = client;
  }
  async run() {
    const client = this.client;
    console.log(chalk.bold.bgBlue("CLIENT [READY]: " + client.user.tag));
    client.debug(chalk.bold.bgBlue("[DISCORD] LOGIN_SUCCESSFULLY"));
    await client.loadCommands();
    await client.loadGuilds();

    //glob("./Assets/Image/output_refs/**/*.png", async (err, files) => {
    /*if(err) console.error(err);
      
      let index = 0;
      let i = 0
      for(const file of files){
        const filename = file.slice(file.lastIndexOf("/") + 1, file.length - 4);
        client.guilds.cache.get(client.discordDB[i]).emojis.create(file,filename)
        if(index === 49 ){
          i++;
          index = 0;
        }else{
          index++;
        }
      }
    })*/

    //<<<<<<<<<<<<<<<===================for debug====================>>>>>>>>>>>>>>>>>
  }
}

module.exports = Ready;
