const ytdl = require("ytdl-core-discord"),
  Discord = require("discord.js"),
  { canModifyQueue } = require("../Utils/Util"),
  { AmaneEmbed, PaginatedEmbed } = require("../Embed");

class YTDLCore {
  constructor(guild) {
    this.client = guild.client;
    this.guild = guild;
    this.queue = null;
    this.defaultVol = 100;
  }

  async play(song, message, data) {
    const queue = this.queue;
    if (!song) {
      setTimeout(function() {
        if (queue.connection.dispatcher && message.guild.me.voice.channel) {
          return;
        }
        queue.channel.leave();
        return queue.textChannel.send(
          new AmaneEmbed(data.userData).setTitle(
            "キューがなくなりました。\nボイスチャンネルから退出します。"
          )
        );
      });
    }
    let stream;
    let streamType = song.url.includes("youtube.com") ? "opus" : "ogg/opus";
    try {
      stream = await ytdl(song.url, { highWaterMark: 1 << 25 });
    } catch (e) {
      if (queue) {
        queue.songs.shift();
        this.play(queue.songs[0], message);
      }
      return message.channel.send(`エラー:${e.message ? e.message : e}`);
    }

    queue.connection.on("disconnect", () => (this.queue = null));

    const dispatcher = queue.connection
      .play(stream, { type: streamType })
      .on("finish", () => {
        if (collector && !collector.ended) {
          collector.stop();
          if (queue.loop) {
            const lastSong = queue.songs.shift();
            queue.songs.push(lastSong);
            this.play(queue.songs[0], message);
          } else {
            queue.songs.shift();
            this.play(queue.songs[0], message);
          }
        }
      })
      .on("error", err => {
        console.log(err);
        queue.songs.shift();
        this.play(queue.songs[0], message);
      });

    this.dispatcher.setVolumeLogarithmic(this.volume / 100);

    try {
      var playingMessage = await this.textChannel.send(
        new AmaneEmbed(data.userData)
          .setColor("GREEN")
          .setDescription(`🎶 再生中: **${song.title}** ${song.url}`)
      );

      await playingMessage.react("⏭");
      await playingMessage.react("⏯");
      await playingMessage.react("🔇");
      await playingMessage.react("🔉");
      await playingMessage.react("🔊");
      await playingMessage.react("🔁");
      await playingMessage.react("⏹");
    } catch (error) {
      console.error(error);
    }

    const filter = (reaction, user) => user.id !== message.client.user.id;
    var collector = playingMessage.createReactionCollector(filter, {
      time: song.duration > 0 ? song.duration * 1000 : 600000
    });

    collector.on("collect", (reaction, user) => {
      if (!queue) return;
      const member = message.guild.member(user);

      switch (reaction.emoji.name) {
        case "⏭":
          queue.playing = true;
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.connection.dispatcher.end();
          queue.textChannel
            .send(`${user} ⏩ スキップしました`)
            .catch(console.error);
          collector.stop();
          break;

        case "⏯":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          if (queue.playing) {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.pause(true);
            queue.textChannel.send(`${user} ⏸ 一時停止中`).catch(console.error);
          } else {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.resume();
            queue.textChannel.send(`${user} ▶ 再開`).catch(console.error);
          }
          break;

        case "🔇":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          if (queue.volume <= 0) {
            queue.volume = 100;
            queue.connection.dispatcher.setVolumeLogarithmic(100 / 100);
            queue.textChannel
              .send(`${user} 🔊 ミュート解除`)
              .catch(console.error);
          } else {
            queue.volume = 0;
            queue.connection.dispatcher.setVolumeLogarithmic(0);
            queue.textChannel.send(`${user} 🔇 ミュート`).catch(console.error);
          }
          break;

        case "🔉":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member) || queue.volume == 0) return;
          if (queue.volume - 10 <= 0) queue.volume = 0;
          else queue.volume = queue.volume - 10;
          queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
          queue.textChannel
            .send(`${user} 🔉 : **${queue.volume}**%`)
            .catch(console.error);
          break;

        case "🔊":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member) || queue.volume == 100) return;
          if (queue.volume + 10 >= 100) queue.volume = 100;
          else queue.volume = queue.volume + 10;
          queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
          queue.textChannel
            .send(`${user} 🔊 : **${queue.volume}**%`)
            .catch(console.error);
          break;

        case "🔁":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.loop = !queue.loop;
          queue.textChannel
            .send(`繰り返し : ${queue.loop ? "**on**" : "**off**"}`)
            .catch(console.error);
          break;

        case "⏹":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.songs = [];
          queue.textChannel.send(`${user} ⏹ : 停止`).catch(console.error);
          try {
            queue.connection.dispatcher.end();
          } catch (error) {
            console.error(error);
            queue.connection.disconnect();
          }
          collector.stop();
          break;

        default:
          reaction.users.remove(user).catch(console.error);
          break;
      }
    });

    collector.on("end", () => {
      playingMessage.reactions.removeAll().catch(console.error);
      if (queue.pruning && playingMessage && !playingMessage.deleted) {
        playingMessage.delete({ timeout: 3000 }).catch(console.error);
      }
    });
  }
}

module.exports = YTDLCore;
