const { AmaneEmbed } = require("../Embed");
const { VoiceText } = require("voice-text");
const { Readable } = require("stream");
const EventEmitter = require("events");
const GoogleTTS = require("google-translate-tts");
const { VoiceList/*, Mode*/ } = require("./Constants");
const voiceText = new VoiceText(process.env.VT_API_KEY);

class TTSPlayer {
  constructor(guild) {
    this.client = guild.client;
    this.guild = guild;
    this.queue = new Array();
    this.connection = null;
    this.channel = null;
    this.defaultVoiceType = "haruka";
    this.defaultTTSMode = 2;
    this.defaultSpeed = 100;
    this.defaultPitch = 100;
  }

  async _join(channel, t) {
    this.channel = channel;
    this.readC = t;
    this.connection = await channel.join();
    return this.connection;
  }

  async _leave() {
    await this.connection.disconnect();
    this.connection = null;
    this.channel = null;
    return true;
  }

  escapeStr(str) {
    var ret = str;
    const url = /(https?:\/\/[\x21-\x7e]+)/g;
    const emoji = /(<:\w*:\d*>)/g;
    const mention = /<@!?(\d*)>/g;
    const role = /<@&(\d*)>/g;
    const [parsedMentions] = ret.matchAll(mention);
    if (parsedMentions !== undefined) {
      ret = ret.replace(
        mention,
        this.client.users.resolve(parsedMentions[1]).username
      );
    }
    const [parsedRoles] = ret.matchAll(role);
    if (parsedRoles !== undefined) {
      ret = ret.replace(
        role,
        this.client.guilds.resolve(this.guild.id).roles.resolve(parsedRoles[1])
          .name
      );
    }
    return ret.replace(emoji, "").replace(url, "URL");
  }

  async _run(message, data) {
    const notEscapedTxt = message.content;
    const txt = this.escapeStr(notEscapedTxt);
    if (this.connection.status === 0) {
      const tts = new EventEmitter();
      const _read = () => {
        this.read(tts, data)
          .then((buffer) => {
            const voice = this.connection.play(this.bufferToStream(buffer));
            voice.on("finish", () => {
              this.queue.shift();
              if (this.queue.length > 0) {
                tts.emit("read");
              } else {
              }
            });
          })
          .catch((e) => console.log(e));
      };
      tts.on("read", () => {
        _read();
      });
      if (this.queue.length === 0) {
        const t = txt.match(/.{1,200}/g);
        t.forEach((t) => this.queue.push(t));
        _read();
      } else {
        const t = txt.match(/.{1,200}/g);
        t.forEach((t) => this.queue.push(t));
      }
    } else {
      message.channel.send("ボイスチャンネルに接続されていません。");
    }
  }

  read(tts, data) {
    if (this.queue !== null) {
      const text = this.queue[0];
      if (data.userData.TTSMode === 1) {
        return voiceText.fetchBuffer(text, {
          format: "wav",
          speaker: data.userData.voiceType
            ? VoiceList[data.userData.voiceType]
            : this.defaultVoiceType,
          pitch: data.userData.pitch ? data.userData.pitch : this.defaultPitch,
          speed: data.userData.speed ? data.userData.speed : this.defaultSpeed,
        });
      } else if (data.userData.TTSMode === 2) {
        return GoogleTTS.synthesize({
          text: text,
          voice: "ja",
        });
      }
    }
  }

  bufferToStream = (buffer) => {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  };
}

module.exports = TTSPlayer;
