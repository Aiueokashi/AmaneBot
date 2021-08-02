const {
    Collection,
    MessageAttachment,
    MessageEmbed,
    Permissions,
  } = require("discord.js"),
  AmaneError = require("../Extender/Error"),
  { AmaneEmbed /*, PaginatedEmbed */ } = require("../Embed"),
  { Hex_Colors, Colors, Emojis } = require("./Constants");

class Util {
  constructor(client) {
    this.client = client;
  }

  static isPromise(value) {
    return (
      value &&
      typeof value.then === "function" &&
      typeof value.catch === "function"
    );
  }

  static isEventEmitter(value) {
    return (
      value &&
      typeof value.on === "function" &&
      typeof value.emit === "function"
    );
  }

  static prefixCompare(aKey, bKey) {
    if (aKey === "" && bKey === "") return 0;
    if (aKey === "") return 1;
    if (bKey === "") return -1;
    if (typeof aKey === "function" && typeof bKey === "function") return 0;
    if (typeof aKey === "function") return 1;
    if (typeof bKey === "function") return -1;
    return aKey.length === bKey.length
      ? aKey.localeCompare(bKey)
      : bKey.length - aKey.length;
  }

  static intoArray(x) {
    if (Array.isArray(x)) {
      return x;
    }

    return [x];
  }

  static intoCallable(thing) {
    if (typeof thing === "function") {
      return thing;
    }

    return () => thing;
  }

  static flatMap(xs, f) {
    const res = [];
    for (const x of xs) {
      res.push(...f(x));
    }

    return res;
  }

  static deepAssign(o1, ...os) {
    for (const o of os) {
      for (const [k, v] of Object.entries(o)) {
        const vIsObject = v && typeof v === "object";
        const o1kIsObject =
          Object.prototype.hasOwnProperty.call(o1, k) &&
          o1[k] &&
          typeof o1[k] === "object";
        if (vIsObject && o1kIsObject) {
          Util.deepAssign(o1[k], v);
        } else {
          o1[k] = v;
        }
      }
    }

    return o1;
  }

  static choice(...xs) {
    for (const x of xs) {
      if (x != null) {
        return x;
      }
    }

    return null;
  }

  canModifyQueue(member) {
    const { channelID } = member.voice;
    const botChannel = member.guild.voice.channelID;

    if (channelID !== botChannel) {
      member.send(
        new MessageEmbed()
          .setColor("RED")
          .setTitle("ERROR:warning:")
          .setDescription("ボイスチャンネルに接続してください")
      );

      return;
    }
    return 1;
  }

  resolveColor = (color) => {
    if (!color.startsWith("#")) {
      const Hex_Code = Hex_Colors.find(
        (c) => c.name.toLowerCase() === color.toLowerCase()
      );
      if (Hex_Code === undefined) {
        return Hex_Colors[0].hex;
      } else {
        return Hex_Code.hex;
      }
    } else {
      if (color.length === 7) {
        return color.toUpperCase();
      } else {
        return Hex_Colors[0].hex;
      }
    }
  };

  async getRank(client, guildID, target) {
    let rank = -1;
    const data = await client.membersData
      .find({ guildID: guildID }, { id: 1 })
      .sort({ exp: -1 })
      .lean();
    data.forEach((d, i) => {
      if (d.id === target) {
        rank = i + 1;
      }
    });
    return rank;
  }

  async addExp(memberData, str) {
    const exps = Math.ceil(str.length / 30);
    memberData.exp += exps;
    if (memberData.exp >= (memberData.level + 2) * (memberData.level + 1)) {
      memberData.level += 1;
    }

    await memberData.save();
  }

  hasSameStr(string) {
    let flag = false;
    const check = [];
    string.split("").forEach((s) => {
      if (check.includes(s)) {
        flag = true;
      }
      check.push(s);
    });
    return flag;
  }

  strToEmoji(char) {
    const res = Emojis.find((s) => s.char === char.toLowerCase());
    return res ? res.emoji : x;
  }

  resolveUser(text, users, caseSensitive = false, wholeWord = false) {
    return (
      users.get(text) ||
      users.find((user) => this.checkUser(text, user, caseSensitive, wholeWord))
    );
  }

  resolveUsers(text, users, caseSensitive = false, wholeWord = false) {
    return users.filter((user) =>
      this.checkUser(text, user, caseSensitive, wholeWord)
    );
  }

  checkUser(text, user, caseSensitive = false, wholeWord = false) {
    if (user.id === text) return true;

    const reg = /<@!?(\d{17,19})>/;
    const match = text.match(reg);

    if (match && user.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const username = caseSensitive
      ? user.username
      : user.username.toLowerCase();
    const discrim = user.discriminator;

    if (!wholeWord) {
      return (
        username.includes(text) ||
        (username.includes(text.split("#")[0]) &&
          discrim.includes(text.split("#")[1]))
      );
    }

    return (
      username === text ||
      (username === text.split("#")[0] && discrim === text.split("#")[1])
    );
  }

  resolveMember(text, members, caseSensitive = false, wholeWord = false) {
    return (
      members.get(text) ||
      members.find((member) =>
        this.checkMember(text, member, caseSensitive, wholeWord)
      )
    );
  }

  resolveMembers(text, members, caseSensitive = false, wholeWord = false) {
    return members.filter((member) =>
      this.checkMember(text, member, caseSensitive, wholeWord)
    );
  }

  checkMember(text, member, caseSensitive = false, wholeWord = false) {
    if (member.id === text) return true;

    const reg = /<@!?(\d{17,19})>/;
    const match = text.match(reg);

    if (match && member.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const username = caseSensitive
      ? member.user.username
      : member.user.username.toLowerCase();
    const displayName = caseSensitive
      ? member.displayName
      : member.displayName.toLowerCase();
    const discrim = member.user.discriminator;

    if (!wholeWord) {
      return (
        displayName.includes(text) ||
        username.includes(text) ||
        ((username.includes(text.split("#")[0]) ||
          displayName.includes(text.split("#")[0])) &&
          discrim.includes(text.split("#")[1]))
      );
    }

    return (
      displayName === text ||
      username === text ||
      ((username === text.split("#")[0] ||
        displayName === text.split("#")[0]) &&
        discrim === text.split("#")[1])
    );
  }

  resolveChannel(text, channels, caseSensitive = false, wholeWord = false) {
    return (
      channels.get(text) ||
      channels.find((channel) =>
        this.checkChannel(text, channel, caseSensitive, wholeWord)
      )
    );
  }

  resolveChannels(text, channels, caseSensitive = false, wholeWord = false) {
    return channels.filter((channel) =>
      this.checkChannel(text, channel, caseSensitive, wholeWord)
    );
  }

  checkChannel(text, channel, caseSensitive = false, wholeWord = false) {
    if (channel.id === text) return true;

    const reg = /<#(\d{17,19})>/;
    const match = text.match(reg);

    if (match && channel.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? channel.name : channel.name.toLowerCase();

    if (!wholeWord) {
      return name.includes(text) || name.includes(text.replace(/^#/, ""));
    }

    return name === text || name === text.replace(/^#/, "");
  }

  resolveRole(text, roles, caseSensitive = false, wholeWord = false) {
    return (
      roles.get(text) ||
      roles.find((role) => this.checkRole(text, role, caseSensitive, wholeWord))
    );
  }

  resolveRoles(text, roles, caseSensitive = false, wholeWord = false) {
    return roles.filter((role) =>
      this.checkRole(text, role, caseSensitive, wholeWord)
    );
  }

  checkRole(text, role, caseSensitive = false, wholeWord = false) {
    if (role.id === text) return true;

    const reg = /<@&(\d{17,19})>/;
    const match = text.match(reg);

    if (match && role.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? role.name : role.name.toLowerCase();

    if (!wholeWord) {
      return name.includes(text) || name.includes(text.replace(/^@/, ""));
    }

    return name === text || name === text.replace(/^@/, "");
  }

  resolveEmoji(text, emojis, caseSensitive = false, wholeWord = false) {
    return (
      emojis.get(text) ||
      emojis.find((emoji) =>
        this.checkEmoji(text, emoji, caseSensitive, wholeWord)
      )
    );
  }

  resolveEmojis(text, emojis, caseSensitive = false, wholeWord = false) {
    return emojis.filter((emoji) =>
      this.checkEmoji(text, emoji, caseSensitive, wholeWord)
    );
  }

  checkEmoji(text, emoji, caseSensitive = false, wholeWord = false) {
    if (emoji.id === text) return true;

    const reg = /<a?:[a-zA-Z0-9_]+:(\d{17,19})>/;
    const match = text.match(reg);

    if (match && emoji.id === match[1]) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? emoji.name : emoji.name.toLowerCase();

    if (!wholeWord) {
      return name.includes(text) || name.includes(text.replace(/:/, ""));
    }

    return name === text || name === text.replace(/:/, "");
  }

  resolveGuild(text, guilds, caseSensitive = false, wholeWord = false) {
    return (
      guilds.get(text) ||
      guilds.find((guild) =>
        this.checkGuild(text, guild, caseSensitive, wholeWord)
      )
    );
  }

  resolveGuilds(text, guilds, caseSensitive = false, wholeWord = false) {
    return guilds.filter((guild) =>
      this.checkGuild(text, guild, caseSensitive, wholeWord)
    );
  }

  checkGuild(text, guild, caseSensitive = false, wholeWord = false) {
    if (guild.id === text) return true;

    text = caseSensitive ? text : text.toLowerCase();
    const name = caseSensitive ? guild.name : guild.name.toLowerCase();

    if (!wholeWord) return name.includes(text);
    return name === text;
  }

  permissionNames() {
    return Object.keys(Permissions.FLAGS);
  }

  resolvePermissionNumber(number) {
    const resolved = [];

    for (const key of Object.keys(Permissions.FLAGS)) {
      if (number & Permissions.FLAGS[key]) resolved.push(key);
    }

    return resolved;
  }

  compareStreaming(oldMember, newMember) {
    const s1 =
      oldMember.presence.activity &&
      oldMember.presence.activity.type === "STREAMING";
    const s2 =
      newMember.presence.activity &&
      newMember.presence.activity.type === "STREAMING";
    if (s1 === s2) return 0;
    if (s1) return 1;
    if (s2) return 2;
    return 0;
  }

  async fetchMember(guild, id, cache) {
    const user = await this.client.users.fetch(id, cache);
    return guild.members.fetch(user, cache);
  }

  /**
   * Can be a number, hex string, an RGB array like:
   * ```js
   * [255, 0, 255] // purple
   * ```
   * or one of the following strings:
   * - `DEFAULT`
   * - `WHITE`
   * - `AQUA`
   * - `GREEN`
   * - `BLUE`
   * - `YELLOW`
   * - `PURPLE`
   * - `LUMINOUS_VIVID_PINK`
   * - `FUCHSIA`
   * - `GOLD`
   * - `ORANGE`
   * - `RED`
   * - `GREY`
   * - `NAVY`
   * - `DARK_AQUA`
   * - `DARK_GREEN`
   * - `DARK_BLUE`
   * - `DARK_PURPLE`
   * - `DARK_VIVID_PINK`
   * - `DARK_GOLD`
   * - `DARK_ORANGE`
   * - `DARK_RED`
   * - `DARK_GREY`
   * - `DARKER_GREY`
   * - `LIGHT_GREY`
   * - `DARK_NAVY`
   * - `BLURPLE`
   * - `GREYPLE`
   * - `DARK_BUT_NOT_BLACK`
   * - `NOT_QUITE_BLACK`
   * - `RANDOM`
   * @typedef {string|number|number[]} ColorResolvable
   */

  static resolveColor(color) {
    if (typeof color === "string") {
      if (color === "RANDOM") return Math.floor(Math.random() * (0xffffff + 1));
      if (color === "DEFAULT") return 0;
      color = Colors[color] || parseInt(color.replace("#", ""), 16);
    } else if (Array.isArray(color)) {
      color = (color[0] << 16) + (color[1] << 8) + color[2];
    }

    if (color < 0 || color > 0xffffff)
      throw new AmaneError("COLOR_RANGE", color);
    else if (color && isNaN(color))
      throw new AmaneError("COLOR_CONVERT", color);

    return color;
  }

  embed(data) {
    return new AmaneEmbed(data);
  }

  attachment(file, name) {
    return new MessageAttachment(file, name);
  }

  collection(iterable) {
    return new Collection(iterable);
  }

  createPageEmbed(message, pages, paging = false, trash = false) {
    let isJSON = true;

    let i = 0;

    try {
      paging &&
        pages.map((x, pi) =>
          x.footer
            ? (x.footer = {
                text: `${x.footer} | ${++pi} / ${Object.keys(pages).length}`,
              })
            : (x.footer = { text: `${++pi} / ${Object.keys(pages).length}` })
        );
    } catch (e) {
      isJSON = false;
      paging &&
        pages.toJSON().map((x, pi) =>
          x.footer
            ? (x.footer = {
                text: `${x.footer} | ${++pi} / ${Object.keys(pages).length}`,
              })
            : (x.footer = { text: `${++pi} / ${Object.keys(pages).length}` })
        );
    }
    message.channel
      .send(isJSON ? { embed: pages[i] } : { embed: pages[i].toJSON() })
      .then(async (msg) => {
        await msg.react("⬅️");

        const backFilter = (reaction) => reaction.emoji.name === "⬅️";
        const backCollector = msg.createReactionCollector(backFilter, {
          time: 900000,
        });

        await msg.react("➡️");

        const nextFilter = (reaction) => reaction.emoji.name === "➡️";
        const nextCollector = msg.createReactionCollector(nextFilter, {
          time: 900000,
        });

        backCollector.on("collect", (r) => {
          i > 0 &&
            msg.edit(
              isJSON ? { embed: pages[--i] } : { embed: pages[--i].toJSON() }
            );
          r.users.remove(
            r.users.cache.filter((u) => u === message.author).first()
          );
        });

        backCollector.on("end", () =>
          msg.reactions.removeAll().catch(() => {})
        );

        nextCollector.on("collect", (r) => {
          i < Object.keys(pages).length - 1 &&
            msg.edit(
              isJSON ? { embed: pages[++i] } : { embed: pages[++i].toJSON() }
            );
          r.users.remove(
            r.users.cache.filter((u) => u === message.author).first()
          );
        });

        if (trash) {
          await msg.react("🗑");

          const trashFilter = (reaction) => reaction.emoji.name === "🗑",
            trashCollector = msg.createReactionCollector(trashFilter, {
              time: 900000,
            });

          trashCollector.on("collect", (r) => {
            msg.delete({ timeout: 500 });
            message.delete({ timeout: 500 });
          });
        }
      });
  }
}

module.exports = Util;
