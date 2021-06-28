const { Structures } = require("discord.js"),
  mongoose = require("mongoose"),
  YTDLCore = require("../YTDL/Player"),
  TTSPlayer = require("../TTS/Player");

//Guildクラス拡張
Structures.extend(
  "Guild",
  (Guild) =>
    class extends Guild {
      constructor(client, data) {
        super(client, data);
        this.ttsPlayer = new TTSPlayer(this);
        this.ytdlCore = new YTDLCore(this);
      }
      async setPrefix() {
        const p = await this.client.findOrCreateGuild({ id: this.id }, true);
        this.prefix = p.prefix;
        return this.prefix;
      }
    }
);
