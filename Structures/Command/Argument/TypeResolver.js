const { ArgumentTypes } = require("../Constants");
const { Collection } = require("discord.js");
const { Hex_Colors } = require("../../Utils/Constants");
const { URL } = require("url");

class TypeResolver {
  constructor(command) {
    this.client = command.client;

    this.command = command;

    this.types = new Collection();

    this.addBuiltInTypes();
  }

  addBuiltInTypes() {
    const builtins = {
      [ArgumentTypes.STRING]: (message, phrase) => {
        return phrase || null;
      },

      [ArgumentTypes.LOWERCASE]: (message, phrase) => {
        return phrase ? phrase.toLowerCase() : null;
      },

      [ArgumentTypes.UPPERCASE]: (message, phrase) => {
        return phrase ? phrase.toUpperCase() : null;
      },

      [ArgumentTypes.CHAR_CODES]: (message, phrase) => {
        if (!phrase) return null;
        const codes = [];
        for (const char of phrase) codes.push(char.charCodeAt(0));
        return codes;
      },

      [ArgumentTypes.NUMBER]: (message, phrase) => {
        if (!phrase || isNaN(phrase)) return null;
        return parseFloat(phrase);
      },

      [ArgumentTypes.INTEGER]: (message, phrase) => {
        if (!phrase || isNaN(phrase)) return null;
        return parseInt(phrase);
      },

      [ArgumentTypes.BIGINT]: (message, phrase) => {
        if (!phrase || isNaN(phrase)) return null;
        return BigInt(phrase);
      },

      [ArgumentTypes.EMOJINT]: (message, phrase) => {
        if (!phrase) return null;
        const n = phrase.replace(/0⃣|1⃣|2⃣|3⃣|4⃣|5⃣|6⃣|7⃣|8⃣|9⃣|🔟/g, (m) => {
          return [
            "0⃣",
            "1⃣",
            "2⃣",
            "3⃣",
            "4⃣",
            "5⃣",
            "6⃣",
            "7⃣",
            "8⃣",
            "9⃣",
            "🔟",
          ].indexOf(m);
        });

        if (isNaN(n)) return null;
        return parseInt(n);
      },

      [ArgumentTypes.URL]: (message, phrase) => {
        if (!phrase) return null;
        if (/^<.+>$/.test(phrase)) phrase = phrase.slice(1, -1);

        try {
          return new URL(phrase);
        } catch (err) {
          return null;
        }
      },

      [ArgumentTypes.DATE]: (message, phrase) => {
        if (!phrase) return null;
        const timestamp = Date.parse(phrase);
        if (isNaN(timestamp)) return null;
        return new Date(timestamp);
      },

      [ArgumentTypes.COLOR]: (message, phrase) => {
        if (!phrase) return null;
        const color = phrase;
        if (!color.startsWith("#")) {
          const Hex_Code = Hex_Colors.find(
            (c) =>
              c.name.replace(/\s+/gm, "").toLowerCase() === color.toLowerCase()
          );
          if (Hex_Code === undefined) {
            return null;
          } else {
            return Hex_Code.hex;
          }
        } else {
          if (color.length === 7) {
            return color.toUpperCase();
          } else {
            return null;
          }
        }

        return color;
      },

      [ArgumentTypes.USER]: (message, phrase) => {
        if (!phrase) return null;
        return this.client.util.resolveUser(phrase, this.client.users.cache);
      },

      [ArgumentTypes.USERS]: (message, phrase) => {
        if (!phrase) return null;
        const users = this.client.util.resolveUsers(
          phrase,
          this.client.users.cache
        );
        return users.size ? users : null;
      },

      [ArgumentTypes.MEMBER]: (message, phrase) => {
        if (!phrase) return null;
        return this.client.util.resolveMember(
          phrase,
          message.guild.members.cache
        );
      },

      [ArgumentTypes.MEMBERS]: (message, phrase) => {
        if (!phrase) return null;
        const members = this.client.util.resolveMembers(
          phrase,
          message.guild.members.cache
        );
        return members.size ? members : null;
      },

      [ArgumentTypes.RELEVANT]: (message, phrase) => {
        if (!phrase) return null;

        const person =
          message.channel.type === "text"
            ? this.client.util.resolveMember(
                phrase,
                message.guild.members.cache
              )
            : message.channel.type === "dm"
            ? this.client.util.resolveUser(
                phrase,
                new Collection([
                  [message.channel.recipient.id, message.channel.recipient],
                  [this.client.user.id, this.client.user],
                ])
              )
            : this.client.util.resolveUser(
                phrase,
                new Collection([
                  [this.client.user.id, this.client.user],
                ]).concat(message.channel.recipients)
              );

        if (!person) return null;
        if (message.channel.type === "text") return person.user;
        return person;
      },

      [ArgumentTypes.RELEVANTS]: (message, phrase) => {
        if (!phrase) return null;

        const persons =
          message.channel.type === "text"
            ? this.client.util.resolveMembers(
                phrase,
                message.guild.members.cache
              )
            : message.channel.type === "dm"
            ? this.client.util.resolveUsers(
                phrase,
                new Collection([
                  [message.channel.recipient.id, message.channel.recipient],
                  [this.client.user.id, this.client.user],
                ])
              )
            : this.client.util.resolveUsers(
                phrase,
                new Collection([
                  [this.client.user.id, this.client.user],
                ]).concat(message.channel.recipients)
              );

        if (!persons.size) return null;

        if (message.channel.type === "text") {
          return persons.map((member) => member.user);
        }

        return persons;
      },

      [ArgumentTypes.CHANNEL]: (message, phrase) => {
        if (!phrase) return null;
        return this.client.util.resolveChannel(
          phrase,
          message.guild.channels.cache
        );
      },

      [ArgumentTypes.CHANNELS]: (message, phrase) => {
        if (!phrase) return null;
        const channels = this.client.util.resolveChannels(
          phrase,
          message.guild.channels.cache
        );
        return channels.size ? channels : null;
      },

      [ArgumentTypes.TEXT_CHANNEL]: (message, phrase) => {
        if (!phrase) return null;

        const channel = this.client.util.resolveChannel(
          phrase,
          message.guild.channels.cache
        );
        if (!channel || channel.type !== "text") return null;

        return channel;
      },

      [ArgumentTypes.TEXT_CHANNELS]: (message, phrase) => {
        if (!phrase) return null;

        const channels = this.client.util.resolveChannels(
          phrase,
          message.guild.channels.cache
        );
        if (!channels.size) return null;

        const textChannels = channels.filter((c) => c.type === "text");
        return textChannels.size ? textChannels : null;
      },

      [ArgumentTypes.VOICE_CHANNEL]: (message, phrase) => {
        if (!phrase) return null;

        const channel = this.client.util.resolveChannel(
          phrase,
          message.guild.channels.cache
        );
        if (!channel || channel.type !== "voice") return null;

        return channel;
      },

      [ArgumentTypes.VOICE_CHANNELS]: (message, phrase) => {
        if (!phrase) return null;

        const channels = this.client.util.resolveChannels(
          phrase,
          message.guild.channels.cache
        );
        if (!channels.size) return null;

        const voiceChannels = channels.filter((c) => c.type === "voice");
        return voiceChannels.size ? voiceChannels : null;
      },

      [ArgumentTypes.CATEGORY_CHANNEL]: (message, phrase) => {
        if (!phrase) return null;

        const channel = this.client.util.resolveChannel(
          phrase,
          message.guild.channels.cache
        );
        if (!channel || channel.type !== "category") return null;

        return channel;
      },

      [ArgumentTypes.CATEGORY_CHANNELS]: (message, phrase) => {
        if (!phrase) return null;

        const channels = this.client.util.resolveChannels(
          phrase,
          message.guild.channels.cache
        );
        if (!channels.size) return null;

        const categoryChannels = channels.filter((c) => c.type === "category");
        return categoryChannels.size ? categoryChannels : null;
      },

      [ArgumentTypes.NEWS_CHANNEL]: (message, phrase) => {
        if (!phrase) return null;

        const channel = this.client.util.resolveChannel(
          phrase,
          message.guild.channels.cache
        );
        if (!channel || channel.type !== "news") return null;

        return channel;
      },

      [ArgumentTypes.NEWS_CHANNELS]: (message, phrase) => {
        if (!phrase) return null;

        const channels = this.client.util.resolveChannels(
          phrase,
          message.guild.channels.cache
        );
        if (!channels.size) return null;

        const newsChannels = channels.filter((c) => c.type === "news");
        return newsChannels.size ? newsChannels : null;
      },

      [ArgumentTypes.STORE_CHANNEL]: (message, phrase) => {
        if (!phrase) return null;

        const channel = this.client.util.resolveChannel(
          phrase,
          message.guild.channels.cache
        );
        if (!channel || channel.type !== "store") return null;

        return channel;
      },

      [ArgumentTypes.STORE_CHANNELS]: (message, phrase) => {
        if (!phrase) return null;

        const channels = this.client.util.resolveChannels(
          phrase,
          message.guild.channels.cache
        );
        if (!channels.size) return null;

        const storeChannels = channels.filter((c) => c.type === "store");
        return storeChannels.size ? storeChannels : null;
      },

      [ArgumentTypes.ROLE]: (message, phrase) => {
        if (!phrase) return null;
        return this.client.util.resolveRole(phrase, message.guild.roles.cache);
      },

      [ArgumentTypes.ROLES]: (message, phrase) => {
        if (!phrase) return null;
        const roles = this.client.util.resolveRoles(
          phrase,
          message.guild.roles.cache
        );
        return roles.size ? roles : null;
      },

      [ArgumentTypes.EMOJI]: (message, phrase) => {
        if (!phrase) return null;
        return this.client.util.resolveEmoji(
          phrase,
          message.guild.emojis.cache
        );
      },

      [ArgumentTypes.EMOJIS]: (message, phrase) => {
        if (!phrase) return null;
        const emojis = this.client.util.resolveEmojis(
          phrase,
          message.guild.emojis.cache
        );
        return emojis.size ? emojis : null;
      },

      [ArgumentTypes.GUILD]: (message, phrase) => {
        if (!phrase) return null;
        return this.client.util.resolveGuild(phrase, this.client.guilds.cache);
      },

      [ArgumentTypes.GUILDS]: (message, phrase) => {
        if (!phrase) return null;
        const guilds = this.client.util.resolveGuilds(
          phrase,
          this.client.guilds.cache
        );
        return guilds.size ? guilds : null;
      },

      [ArgumentTypes.MESSAGE]: (message, phrase) => {
        if (!phrase) return null;
        return message.channel.messages.fetch(phrase).catch(() => null);
      },

      [ArgumentTypes.GUILD_MESSAGE]: async (message, phrase) => {
        if (!phrase) return null;
        for (const channel of message.guild.channels.cache.values()) {
          if (channel.type !== "text") continue;
          try {
            return await channel.messages.fetch(phrase);
          } catch (err) {
            if (/^Invalid Form Body/.test(err.message)) return null;
          }
        }

        return null;
      },

      [ArgumentTypes.RELEVANT_MESSAGE]: async (message, phrase) => {
        if (!phrase) return null;
        const hereMsg = await message.channel.messages
          .fetch(phrase)
          .catch(() => null);
        if (hereMsg) {
          return hereMsg;
        }

        if (message.guild) {
          for (const channel of message.guild.channels.cache.values()) {
            if (channel.type !== "text") continue;
            try {
              return await channel.messages.fetch(phrase);
            } catch (err) {
              if (/^Invalid Form Body/.test(err.message)) return null;
            }
          }
        }

        return null;
      },

      [ArgumentTypes.INVITE]: (message, phrase) => {
        if (!phrase) return null;
        return this.client.fetchInvite(phrase).catch(() => null);
      },

      [ArgumentTypes.USER_MENTION]: (message, phrase) => {
        if (!phrase) return null;
        const id = phrase.match(/<@!?(\d{17,19})>/);
        if (!id) return null;
        return this.client.users.cache.get(id[1]) || null;
      },

      [ArgumentTypes.MEMBER_MENTION]: (message, phrase) => {
        if (!phrase) return null;
        const id = phrase.match(/<@!?(\d{17,19})>/);
        if (!id) return null;
        return message.guild.members.cache.get(id[1]) || null;
      },

      [ArgumentTypes.CHANNEL_MENTION]: (message, phrase) => {
        if (!phrase) return null;
        const id = phrase.match(/<#(\d{17,19})>/);
        if (!id) return null;
        return message.guild.channels.cache.get(id[1]) || null;
      },

      [ArgumentTypes.ROLE_MENTION]: (message, phrase) => {
        if (!phrase) return null;
        const id = phrase.match(/<@&(\d{17,19})>/);
        if (!id) return null;
        return message.guild.roles.cache.get(id[1]) || null;
      },

      [ArgumentTypes.EMOJI_MENTION]: (message, phrase) => {
        if (!phrase) return null;
        const id = phrase.match(/<a?:[a-zA-Z0-9_]+:(\d{17,19})>/);
        if (!id) return null;
        return message.guild.emojis.cache.get(id[1]) || null;
      },

      [ArgumentTypes.COMMAND_ALIAS]: (message, phrase) => {
        if (!phrase) return null;
        return (
          this.client.commands.get(this.client.aliases.get(phrase)) || phrase
        );
      },

      [ArgumentTypes.COMMAND]: (message, phrase) => {
        if (!phrase) return null;
        return this.client.commands.get(phrase) || null;
      },
    };

    for (const [key, value] of Object.entries(builtins)) {
      this.types.set(key, value);
    }
  }

  type(name) {
    return this.types.get(name);
  }

  addType(name, fn) {
    this.types.set(name, fn);
    return this;
  }

  addTypes(types) {
    for (const [key, value] of Object.entries(types)) {
      this.addType(key, value);
    }

    return this;
  }
}

module.exports = TypeResolver;
