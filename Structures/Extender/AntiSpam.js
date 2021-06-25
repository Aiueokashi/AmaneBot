/*製作中*/

const Discord = require("discord.js"),
  { EventEmitter } = require("events");

class AntiSpamClient extends EventEmitter {
  constructor(options) {
    super();
    this.options = {
      warnThreshold: options.warnThreshold || 3,
      kickThreshold: options.kickThreshold || 5,
      banThreshold: options.banThreshold || 7,
      muteThreshold: options.muteThreshold || 4,

      maxInterval: options.maxInterval || 2000,
      maxDuplicatesInterval: options.maxDuplicatesInterval || 2000,

      maxDuplicatesWarn: options.maxDuplicatesWarn || 7,
      maxDuplicatesKick: options.maxDuplicatesKick || 10,
      maxDuplicatesBan: options.maxDuplicatesBan || 10,
      maxDuplicatesMute: options.maxDuplicatesMute || 9,

      muteRoleName: options.muteRoleName || "Muted",

      modLogsChannelName: options.modLogsChannelName || "mod-logs",
      modLogsEnabled: options.modLogsEnabled || false,
      warnMessage:
        options.warnMessage || "<<user>>, スパム行為が検出されました。",
      muteMessage: options.muteMessage || "**<<user_tag>>** をmuteしました。",
      kickMessage: options.kickMessage || "**<<user_tag>>** をkickしました。",
      banMessage: options.banMessage || "**<<user_tag>>** をbanしました。",

      errorMessages:
        options.errorMessages != undefined ? options.errorMessages : true,
      kickErrorMessage:
        options.kickErrorMessage ||
        " **<<user_tag>>** をkickできませんでした。",
      banErrorMessage:
        options.banErrorMessage || " **<<user_tag>>** をbanできませんでした。",
      muteErrorMessage:
        options.muteErrorMessage ||
        " **<<user_tag>>** をmuteできませんでした。",

      ignoredMembers: options.ignoredMembers || [],
      ignoredRoles: options.ignoredRoles || [],
      ignoredGuilds: options.ignoredGuilds || [],
      ignoredChannels: options.ignoredChannels || [],
      ignoredPermissions: options.ignoredPermissions || [],
      ignoreBots: options.ignoreBots != undefined ? options.ignoreBots : true,

      warnEnabled:
        options.warnEnabled != undefined ? options.warnEnabled : true,
      kickEnabled:
        options.kickEnabled != undefined ? options.kickEnabled : true,
      muteEnabled:
        options.muteEnabled != undefined ? options.muteEnabled : true,
      banEnabled: options.banEnabled != undefined ? options.banEnabled : true,

      deleteMessagesAfterBanForPastDays:
        options.deleteMessagesAfterBanForPastDays || 1,
      verbose: options.verbose || false,
      debug: options.debug || false,
      removeMessages:
        options.removeMessages != undefined ? options.removeMessages : true,

      removeBotMessages: options.removeBotMessages || false,
      removeBotMessagesAfter: options.removeBotMessagesAfter || 10000,
    };

    this.cache = {
      messages: [],
      warnedUsers: [],
      kickedUsers: [],
      mutedUsers: [],
      bannedUsers: [],
    };
  }

  format(string, message) {
    if (typeof string === "string") {
      return string
        .replace(/<<user>>/gm, message.author.toString())
        .replace(/<<user_tag>>/gm, message.author.tag)
        .replace(/<<server_name>>/gm, message.guild.name);
    } else {
      const embed = new Discord.MessageEmbed(string);
      if (embed.description)
        embed.setDescription(this.format(embed.description, message));
      if (embed.title) embed.setTitle(this.format(embed.title, message));
      if (embed.footer && embed.footer.text)
        embed.footer.text = this.format(embed.footer.text, message);
      if (embed.author && embed.author.name)
        embed.author.name = this.format(embed.author.name, message);
      return embed;
    }
  }

  log(msg, message, client) {
    if (this.options.modLogsEnabled) {
      const modLogChannel =
        client.channels.cache.get(this.options.modLogsChannelName) ||
        msg.guild.channels.cache.find(
          (channel) =>
            channel.name === this.options.modLogsChannelName &&
            channel.type === "text"
        );
      if (modLogChannel) {
        modLogChannel.send(message);
      }
    }
  }
  async clearSpamMessages(messages, client) {
    try {
      messages.forEach((message) => {
        const channel = client.channels.cache.get(message.channelID);
        if (channel) {
          const msg = channel.messages.cache.get(message.messageID);
          if (msg && msg.deletable) msg.delete();
        }
      });
    } catch (e) {
      if (e) {
        if (this.options.verbose) {
          console.log(`messageの削除に失敗しました。`);
        }
      }
    }
  }

  async clearBotMessages(message) {
    if (this.options.removeBotMessages == false) return;
    try {
      setTimeout(function () {
        message.delete();
      }, this.options.removeBotMessagesAfter);
    } catch (e) {
      if (this.options.verbose) {
        if (this.options.verbose) {
          console.log(`messageの削除に失敗しました。`);
        }
      }
    }
  }
}
