const { Structures } = require("okashidjs");
(mongoose = require("mongoose")),
  (YTDLPlayer = require("../newYTDL/Player")),
  (TTSPlayer = require("../TTS/Player"));

//Guildクラス拡張
Structures.extend(
  "Guild",
  (Guild) =>
    class extends Guild {
      constructor(client, data) {
        super(client, data);
        this.ttsPlayer = new TTSPlayer(this);
        this.ytdlPlayer = new YTDLPlayer(this);
      }
      async setPrefix() {
        const p = await this.client.findOrCreateGuild({ id: this.id }, true);
        this.prefix = p.prefix;
        return this.prefix;
      }
    }
);
