const { Collection } = require("discord.js");

class CommandUtil {
  constructor(handler, message) {
    this.handler = handler;

    this.message = message;

    this.parsed = null;

    this.shouldEdit = false;

    this.lastResponse = null;

    if (this.handler.storeMessages) {
      this.messages = new Collection();
    } else {
      this.messages = null;
    }
  }

  setLastResponse(message) {
    if (Array.isArray(message)) {
      this.lastResponse = message.slice(-1)[0];
    } else {
      this.lastResponse = message;
    }

    return this.lastResponse;
  }

  addMessage(message) {
    if (this.handler.storeMessages) {
      if (Array.isArray(message)) {
        for (const msg of message) {
          this.messages.set(msg.id, msg);
        }
      } else {
        this.messages.set(message.id, message);
      }
    }

    return message;
  }

  setEditable(state) {
    this.shouldEdit = Boolean(state);
    return this;
  }

  async send(options) {
    const transformedOptions = this.constructor.transformOptions(options);
    const hasFiles =
      transformedOptions.files && transformedOptions.files.length > 0;
    if (
      this.shouldEdit &&
      (this.command ? this.command.editable : true) &&
      !hasFiles &&
      !this.lastResponse.deleted &&
      !this.lastResponse.attachments.size
    ) {
      return this.lastResponse.edit(transformedOptions);
    }

    const sent = await this.message.channel.send(transformedOptions);
    const lastSent = this.setLastResponse(sent);
    this.setEditable(!lastSent.attachments.size);
    return sent;
  }

  async sendNew(options) {
    const sent = await this.message.channel.send(
      this.constructor.transformOptions(options)
    );
    const lastSent = this.setLastResponse(sent);
    this.setEditable(!lastSent.attachments.size);
    return sent;
  }

  reply(options) {
    return this.send({
      reply: { messageReference: this.message, failIfNotExists: false },
      ...this.constructor.transformOptions(options),
    });
  }

  edit(options) {
    return this.lastResponse.edit(options);
  }

  static transformOptions(options) {
    const transformedOptions =
      typeof options === "string" ? { content: options } : { ...options };
    if (!transformedOptions.content) transformedOptions.content = null;
    if (!transformedOptions.embeds) transformedOptions.embeds = [];
    return transformedOptions;
  }
}

module.exports = CommandUtil;
