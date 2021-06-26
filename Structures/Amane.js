const { Client, Collection, Intents } = require("discord.js"),
  chalk = require("chalk"),
  path = require("path"),
  fs = require("fs"),
  glob = require("glob"),
  COMMAND = require("./Command"),
  SLASHCOMMAND = require("./SlashCommand"),
  AmaneError = require("./Extender/Error"),
  { MONGO_URL, TOKEN, DEV_API_URL } = process.env,
  axios = require("axios"),
  mongoose = require("mongoose"),
  Constants = require("./Utils/Constants"),
  {
    ReactionRoleManager,
    MessageCollector,
    ReactionCollector,
  } = require("./Collector/index.js"),
  Parser = require("./Parser"),
  Util = require("./Utils/Util");

//console.log()拡張
require("./Extender/Console");
//儀式
require("./App/KeepAlive");
//Guild,Message拡張
require("./Extender/Message");
require("./Extender/Guild");

//client拡張
class Amane extends Client {
  constructor(options = {}) {
    super(options);
    this.slcUtil = {
      url: "https://discord.com/api/v8/applications/854281955168354335/commands",
      header: {
        headers: {
          Authorization: "Bot " + process.env.TOKEN,
          "Content-Type": "application/json",
        },
      },
    };
    this.partial = ["GUILD_MEMBER", "USER"];
    this.intents = Intents.ALL;
    //config読み込み
    this.config = require("../config");
    /* Collection<name, command> */
    this.commands = new Collection();
    /* Collection<name, slashCommand>*/
    this.slashCommands = new Collection();
    /* Collection<alias, name> */
    this.aliases = new Collection();
    //owner
    this.owners = this.config.master;
    //util読み込み
    this.util = new Util(this);

    this.commandParser = new Parser(this);

    this.events = new Collection();

    this.reactionRoleManager = new ReactionRoleManager(this, {
      storage: true,
      mongoDbLink: process.env.MONGO_URL,
    });
    this.reactionCollector = ReactionCollector;
    this.messageCollector = MessageCollector;

    this.guildsData = require("../Models/Guilds");
    this.membersData = require("../Models/Members");
    this.usersData = require("../Models/Users");

    this.databaseCache = {};
    this.databaseCache.users = new Collection();
    this.databaseCache.guilds = new Collection();
    this.databaseCache.members = new Collection();

    this.discordDB = [
      "851083957809971264",
      "851086175351734282",
      "851086296889294878",
    ];

    console.log(chalk.bold.bgRed("CLIENT [INITIALISED]"));
  }
  //ディレクトリ取得
  get directory() {
    return `${path.dirname(require.main.filename)}${path.sep}`;
  }
  //コマンド登録
  async loadCommands() {
    glob(`${this.directory}/Commands/**/*.js`, (err, files) => {
      if (err) throw new Error(err);

      for (const file of files) {
        delete require.cache[[`${file}`]];
        const command = new (require(file))(this),
          filename = file.slice(file.lastIndexOf("/") + 1, file.length - 3);

        if (!(command instanceof COMMAND))
          throw new AmaneError("INVALID_COMMAND_TYPE", filename);

        let c_conflict = this.commands.get(command.name.toLowerCase());
        if (c_conflict)
          throw new AmaneError(
            "COMMAND_CONFLICT",
            command.name,
            c_conflict.name
          );
        this.commands.set(command.name, command);

        command.aliases.length &&
          command.aliases.map((alias) => {
            const a_conflict = this.aliases.get(alias.toLowerCase());
            if (a_conflict)
              throw new AmaneError(
                "ALIAS_CONFLICT",
                alias,
                command.name,
                a_conflict
              );
            this.aliases.set(alias, command.name);
          });
      }
    });
    console.log(chalk.bold.bgBlue(`CLIENT_COMMAND [REGISTERING...]`));
  }
  async loadDatabse() {
    mongoose.connect(process.env.MONGO_URL);
  }
  async loadSlashCommands(client) {
    const SCData = await axios.get(client.slcUtil.url, client.slcUtil.header);
    glob(`${this.directory}/SlashCommands/**/*.js`, async (err, files) => {
      if (err) throw new Error(err);

      for (const file of files) {
        delete require.cache[[`${file}`]];
        const command = new (require(file))(this);
        if (!(command instanceof SLASHCOMMAND)) {
          throw new Error();
        }
        const _isRegistered = SCData.data.find((d) => d.name === command.name);
        if (_isRegistered !== undefined) {
          command.id = _isRegistered.id;
          this.slashCommands.set(command.name, command);
          command.register = true;
        } else {
          this.slashCommands.set(command.name, command);
          console.log(`unregister command :${command.name}`);
          command.register = false;
        }
        //イベントリスナー
        if (command.enable)
          client.ws.on("INTERACTION_CREATE", async (interaction) => {
            const cmd = interaction.data.name.toLowerCase();
            const args = interaction.data.options;
            if (cmd === command.name) {
              command.setInteraction(interaction);
              command.run(client, args);
            }
          });
      }
    });
    console.log(chalk.bold.bgBlue(`CLIENT_SLASH_COMMAND [REGISTERING...]`));
    return 1;
  }
  //イベントリスナー起動
  loadEvents() {
    glob(`${this.directory}/Listeners/**/*.js`, (err, files) => {
      if (err) throw new Error(err);

      for (const file of files) {
        delete require.cache[[`${file}`]];
        const event = new (require(file))(this),
          eventname = file.slice(file.lastIndexOf("/") + 1, file.length - 3);

        this.events.set(eventname, event);

        if (event.enable) super.on(eventname, (...args) => event.run(...args));
      }
    });
    console.log(chalk.bold.bgBlue(`CLIENT_EVENT [LISTENING]`));
  }

  async findOrCreateUser({ id: userID }, isLean) {
    if (this.databaseCache.users.get(userID)) {
      return isLean
        ? this.databaseCache.users.get(userID).toJSON()
        : this.databaseCache.users.get(userID);
    } else {
      let userData = isLean
        ? await this.usersData.findOne({ id: userID }).lean()
        : await this.usersData.findOne({ id: userID });
      if (userData) {
        if (!isLean) this.databaseCache.users.set(userID, userData);
        return userData;
      } else {
        userData = new this.usersData({ id: userID });
        await userData.save();
        this.databaseCache.users.set(userID, userData);
        return isLean ? userData.toJSON() : userData;
      }
    }
  }

  async findOrCreateMember({ id: memberID, guildID }, isLean) {
    if (this.databaseCache.members.get(`${memberID}${guildID}`)) {
      return isLean
        ? this.databaseCache.members.get(`${memberID}${guildID}`).toJSON()
        : this.databaseCache.members.get(`${memberID}${guildID}`);
    } else {
      let memberData = isLean
        ? await this.membersData.findOne({ guildID, id: memberID }).lean()
        : await this.membersData.findOne({ guildID, id: memberID });
      if (memberData) {
        if (!isLean)
          this.databaseCache.members.set(`${memberID}${guildID}`, memberData);
        return memberData;
      } else {
        memberData = new this.membersData({ id: memberID, guildID: guildID });
        await memberData.save();
        const guild = await this.findOrCreateGuild({ id: guildID });
        if (guild) {
          guild.members.push(memberData._id);
          await guild.save();
        }
        this.databaseCache.members.set(`${memberID}${guildID}`, memberData);
        return isLean ? memberData.toJSON() : memberData;
      }
    }
  }

  async findOrCreateGuild({ id: guildID }, isLean) {
    if (this.databaseCache.guilds.get(guildID)) {
      return isLean
        ? this.databaseCache.guilds.get(guildID).toJSON()
        : this.databaseCache.guilds.get(guildID);
    } else {
      let guildData = isLean
        ? await this.guildsData
            .findOne({ id: guildID })
            .populate("members")
            .lean()
        : await this.guildsData.findOne({ id: guildID }).populate("members");
      if (guildData) {
        if (!isLean) this.databaseCache.guilds.set(guildID, guildData);
        return guildData;
      } else {
        guildData = new this.guildsData({ id: guildID });
        await guildData.save();
        this.databaseCache.guilds.set(guildID, guildData);
        return isLean ? guildData.toJSON() : guildData;
      }
    }
  }

  //ログイン
  async login() {
    try {
      await super.login(TOKEN);
    } catch (e) {
      console.log(e);
    }
  }

  init() {
    this.loadCommands();
    this.loadEvents();
    this.login();
  }
}

module.exports = Amane;
