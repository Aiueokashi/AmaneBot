const {
  Message,
  MessageEmbed,
  EmojiResolvable,
  UserResolvable,
} = require("discord.js");
const Discord = require("discord.js");
const { validateOptions } = require("../util/validate");
const { findRecursively } = require("../util/find");

class Controller {
  constructor(botMessage, collector, pages) {
    this._botMessage = botMessage;
    this._collector = collector;
    this._pages = pages;
    this._lastPage = null;
    this._currentPage = null;
  }

  stop(reason = "user") {
    if (this.messagesCollector) this.messagesCollector.stop(reason);
    return this._collector.stop(reason);
  }

  resetTimer(options) {
    if (this.messagesCollector) this.messagesCollector.resetTimer(options);
    this.collector.resetTimer(options);
  }

  async goTo(pageId) {
    const pages = [];
    findRecursively({
      obj: this.pages,
      key: "id",
      value: pageId,
      type: "object",
      result: pages,
    });
    const page = pages.shift();
    if (!page)
      return Promise.reject(
        new Error(
          `Invalid action: Couldn't go to page '${pageId}', this page doens't exists.`
        )
      );

    this.currentPage = page;
    await this.update();
  }

  async back() {
    if (!this.canBack) {
      return Promise.reject(
        new Error("Invalid action: Cannot back without last page valid.")
      );
    }

    const aux = this.currentPage;
    this.currentPage = this.lastPage;
    this.lastPage = aux;
    return this.update();
  }

  async update(onlyMessage = false) {
    if (onlyMessage) return this.botMessage.edit(this.currentPage);

    await this.botMessage.edit(this.currentPage);
    await this.botMessage.reactions.removeAll();
    if (this.currentPage.clearReactions) {
      await this.botMessage.reactions.removeAll();
    } else if (this.currentPage.reactions) {
      await Promise.all(
        this.currentPage.reactions.map((r) => this.botMessage.react(r))
      );
    }

    if (this.currentPage.backEmoji)
      await this.botMessage.react(this.currentPage.backEmoji);
  }

  get botMessage() {
    return this._botMessage;
  }

  get lastPage() {
    return this._lastPage;
  }

  set messagesCollector(value) {
    this._messagesCollector = value;
  }

  get messagesCollector() {
    return this._messagesCollector;
  }

  get collector() {
    return this._collector;
  }

  get currentPage() {
    return this._currentPage;
  }

  set currentPage(value) {
    this.lastPage = this.currentPage || value;
    this._currentPage = value;
  }

  set lastPage(value) {
    this._lastPage = value;
  }

  get pages() {
    return this._pages;
  }

  get canBack() {
    return this.lastPage != null;
  }
}

class ReactionCollector {
  static async menu(options, ...args) {
    const { botMessage, user, pages, collectorOptions } = validateOptions(
      options,
      "reactMenu"
    );

    const keys = Object.keys(pages);
    const allReactions = findRecursively({
      obj: pages,
      key: "reactions",
      result: keys,
      type: "array",
    });
    findRecursively({
      obj: pages,
      key: "backEmoji",
      result: allReactions,
      type: "value",
    });
    const needCollectMessages =
      findRecursively({ obj: pages, key: "onMessage" }).length > 0;

    const filter = (r, u) =>
      u.id === user.id &&
      (allReactions.includes(r.emoji.id) ||
        allReactions.includes(r.emoji.name)) &&
      !user.bot;
    const collector = botMessage.createReactionCollector(
      filter,
      collectorOptions
    );
    const controller = new Controller(botMessage, collector, pages);
    collector.on("collect", async (reaction) => {
      const emoji = reaction.emoji.id || reaction.emoji.name;
      if (
        controller.currentPage &&
        emoji === controller.currentPage.backEmoji &&
        controller.canBack
      ) {
        controller.back();
        return;
      }

      controller.currentPage =
        controller.currentPage && controller.currentPage.pages
          ? controller.currentPage.pages[emoji]
          : pages[emoji];
      if (controller.currentPage) {
        if (typeof controller.currentPage.onReact === "function") {
          await controller.currentPage.onReact(controller, reaction, ...args);
        }
      }
      await controller.update();
      await reaction.users.remove(user.id);
    });
    await Promise.all(Object.keys(pages).map((r) => botMessage.react(r)));
    collector.on("end", async () => botMessage.reactions.removeAll());

    if (needCollectMessages) {
      const messagesCollector = botMessage.channel.createMessageCollector(
        (message) => message.author.id === user.id,
        collectorOptions
      );
      controller.messagesCollector = messagesCollector;
      messagesCollector.on("collect", async (message) => {
        if (message.deletable) await message.delete();
        if (
          controller.currentPage &&
          typeof controller.currentPage.onMessage === "function"
        ) {
          await controller.currentPage.onMessage(controller, message, ...args);
        }
      });

      collector.on("end", () => messagesCollector.stop());
    }
    return controller;
  }

  static async paginator(options) {
    const {
      botMessage,
      user,
      pages,
      collectorOptions,
      reactionsMap,
      deleteReaction,
      deleteAllOnEnd,
    } = validateOptions(options, "reactPaginator");
    if (!pages || pages.length === 0)
      return Promise.reject(new Error("Invalid input: pages is null or empty"));

    pages.index = 0;
    await botMessage.edit({ embed: pages[pages.index] });
    const collector = this.__createReactionCollector(
      {
        botMessage,
        user,
        reactionsMap,
        collectorOptions,
        deleteReaction,
        deleteAllOnEnd,
      },
      botMessage,
      pages
    );
    return collector;
  }

  static question(options, ...args) {
    return this.__createReactionCollector(
      validateOptions(options, "reactQuestion"),
      ...args
    );
  }

  static async yesNoQuestion(options) {
    return this.__createYesNoReactionCollector(
      validateOptions(options, "yesNoQuestion")
    );
  }

  static async __createReactionCollector(_options, ...args) {
    const {
      botMessage,
      reactionsMap,
      user,
      collectorOptions,
      deleteReaction,
      deleteAllOnEnd,
    } = _options;
    const reactions = Object.keys(reactionsMap) || reactionsMap;
    await Promise.all(reactions.map((r) => botMessage.react(r)));
    const filter = (r, u) =>
      u.id === user.id &&
      (reactions.includes(r.emoji.id) || reactions.includes(r.emoji.name)) &&
      !user.bot;
    const collector = botMessage.createReactionCollector(
      filter,
      collectorOptions
    );
    collector.on("collect", async (reaction) => {
      const emoji = reaction.emoji.id || reaction.emoji.name;
      if (deleteReaction) await reaction.users.remove(user.id);
      if (typeof reactionsMap[emoji] === "function")
        reactionsMap[emoji](reaction, collector, ...args);
    });
    if (deleteAllOnEnd) {
      collector.on("end", async () => botMessage.reactions.removeAll());
    }
    return collector;
  }

  static async __createYesNoReactionCollector(_options) {
    return new Promise(async (resolve) => {
      const {
        botMessage,
        reactionsMap,
        user,
        collectorOptions,
        deleteReaction,
        deleteAllOnEnd,
      } = _options;
      const reactions = Object.keys(reactionsMap) || reactionsMap;
      await Promise.all(reactions.map((r) => botMessage.react(r)));
      const filter = (r, u) =>
        u.id === user.id &&
        (reactions.includes(r.emoji.id) || reactions.includes(r.emoji.name)) &&
        !user.bot;
      const caughtReactions = await botMessage.awaitReactions(
        filter,
        collectorOptions
      );
      if (caughtReactions.size > 0) {
        const reactionCollected = caughtReactions.first();
        if (deleteAllOnEnd)
          await reactionCollected.message.reactions.removeAll();
        else if (deleteReaction) await reactionCollected.users.remove(user.id);
        return resolve(
          reactions.indexOf(
            reactionCollected.emoji
              ? reactionCollected.emoji.name || reactionCollected.emoji.id
              : reactionCollected.name || reactionCollected.id
          ) === 0
        );
      }
      return resolve(false);
    });
  }
}

module.exports = {
  Controller,
  ReactionCollector,
};
