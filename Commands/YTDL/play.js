const Command = require("../../Structures/Command"),
  ytdl = require("ytdl-core"),
  YouTubeAPI = require("simple-youtube-api"),
  //https = require("https"),
  youtube = new YouTubeAPI(process.env.YOUTUBE_API_KEY),
  { AmaneEmbed, PaginatedEmbed } = require("../../Structures/Embed");

class Play extends Command {
  constructor(client) {
    super(client, {
      name: "play",
      description: "音楽を再生します。",
      usage: "play <song url | song name>",
      example: [],
      args: true,
      nonparse: true,
      slash: {
        name: "play",
        description: "音楽を再生します。",
        options: [
          {
            name: "music",
            description: "曲の名前か、YoutubeのURL",
            required: true,
            type: 3,
          },
        ],
        async run(interaction, args) {
          const a = { song: args[0]?.value };
          client.commands.get(this.name).run(interaction, a);
        },
      },
      types: [
        {
          id: "song",
          type: "string",
        },
      ],
      category: "YTDL",
      cooldown: 1000,
      aliases: ["p"],
      permLevel: 0,
      disable: false,
      guildOnly: true,
      ownerOnly: false,
    });
  }

  async run(message, args) {
    let queue;
    const player = message.guild.ytdlPlayer;
    player.createQueue();
    try {
      queue = await player.join(message);
    } catch (e) {
      super.respond("ボイスチャンネルに接続してください。", true);
      console.log(e);
    }
    queue.play(args.song);
  }
}

module.exports = Play;
