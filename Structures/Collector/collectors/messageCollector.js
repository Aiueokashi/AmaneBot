const {
  Message,
  MessageCollectorOptions,
  UserResolvable,
} = require("discord.js");
const { validateOptions } = require("../util/validate");

class MessageCollector {
  static question(options) {
    return this.__createMessageCollector(
      validateOptions(options, "messageQuestion")
    );
  }

  static asyncQuestion(options) {
    return this.__createAsyncMessageCollector(
      validateOptions(options, "messageAsyncQuestion")
    );
  }

  static __createMessageCollector(_options) {
    const { botMessage, user, collectorOptions, onMessage, deleteMessage } =
      _options;
    const filter = (message) =>
      message.author.id === user.id && !message.author.bot;
    const collector = botMessage.channel.createMessageCollector(
      filter,
      collectorOptions
    );
    collector.on("collect", async (message) => {
      if (deleteMessage) await message.delete();
      await onMessage(botMessage, message);
    });
    return collector;
  }

  static async __createAsyncMessageCollector(_options) {
    return new Promise(async (resolve, reject) => {
      const { botMessage, user, collectorOptions, deleteMessage } = _options;
      const filter = (message) =>
        message.author.id === user.id && !message.author.bot;
      const caughtMessages = await botMessage.channel.awaitMessages(
        filter,
        collectorOptions
      );
      if (caughtMessages.size > 0) {
        const message = caughtMessages.first();
        if (deleteMessage) await message.delete();
        return resolve(message);
      }

      return reject(false);
    });
  }
}

module.exports = {
  MessageCollector,
};
