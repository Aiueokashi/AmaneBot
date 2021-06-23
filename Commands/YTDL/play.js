const Command = require("../../Structures/Command"),
  ytdl = require("ytdl-core"),
  YouTubeAPI = require("simple-youtube-api"),
  https = require("https"),
  youtube = new YouTubeAPI(process.env.YOUTUBE_API_KEY),
  { AmaneEmbed, PaginatedEmbed } = require("../../Structures/Embed");

class Play extends Command {
  constructor(client) {
    super(client, {
      name: "play",
      description: "音楽を再生します。",
      usage: "play <song url | song name>",
      example: [],
      args: false,
      category: "YTDL",
      cooldown: 1000,
      aliases: [],
      permLevel: 0,
      disable: false,
      guildOnly: true,
      ownerOnly: false
    });
  }

  async run(message, args, data) {
    const { channel } = message.member.voice;

    const serverQueue = message.guild.ytdlCore.queue;
    if (!channel)
      return message
        .reply("ボイスチャンネルに接続してください")
        .catch(console.error);
    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message
        .reply(`同じチャンネルに入ってないみたい...`)
        .catch(console.error);

    const search = args.join(" ");
    const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
    const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
    const url = args[0];
    const urlValid = videoPattern.test(args[0]);

    if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
      return this.client.commands.get("playlist").run(message, args, data);
    }

    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: 100,
      playing: true
    };

    let songInfo = null;
    let song = null;

    if (urlValid) {
      try {
        songInfo = await ytdl.getInfo(url);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds
        };
      } catch (error) {
        console.error(error);
        return message.reply(error.message).catch(console.error);
      }
    } else {
      try {
        const results = await youtube.searchVideos(search, 1);
        songInfo = await ytdl.getInfo(results[0].url);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds
        };
      } catch (error) {
        console.error(error);
        return message.reply(error.message).catch(console.error);
      }
    }

    if (serverQueue) {
      serverQueue.songs.push(song);
      return serverQueue.textChannel
        .send(
          `✅ **${song.title}** がキューに追加されました\n [${message.author}]`
        )
        .catch(console.error);
    }

    queueConstruct.songs.push(song);
    serverQueue = queueConstruct;

    try {
      queueConstruct.connection = await channel.join();
      await queueConstruct.connection.voice.setSelfDeaf(true);
      play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(error);
      message.guild.ytdlCore.queue = null;
      await channel.leave();
      return message.channel
        .send(`Could not join the channel: ${error}`)
        .catch(console.error);
    }
  }
}

module.exports = Play;
