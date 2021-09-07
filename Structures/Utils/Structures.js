"use strict";

/**
 * An extendable structure:
 * * **`GuildEmoji`**
 * * **`DMChannel`**
 * * **`TextChannel`**
 * * **`VoiceChannel`**
 * * **`CategoryChannel`**
 * * **`NewsChannel`**
 * * **`StoreChannel`**
 * * **`StageChannel`**
 * * **`ThreadChannel`**
 * * **`GuildMember`**
 * * **`ThreadMember`**
 * * **`Guild`**
 * * **`Message`**
 * * **`MessageReaction`**
 * * **`Presence`**
 * * **`ClientPresence`**
 * * **`VoiceState`**
 * * **`Role`**
 * * **`User`**
 * * **`CommandInteraction`**
 * * **`ButtonInteraction`**
 * * **`StageInstance`**
 * * **`SelectMenuInteraction`**
 * @typedef {string} ExtendableStructure
 */

/**
 * Allows for the extension of built-in Discord.js structures that are instantiated by {@link BaseManager Managers}.
 */
class Structures extends null {
  /**
   * Retrieves a structure class.
   * @param {string} structure Name of the structure to retrieve
   * @returns {Function}
   */
  static get(structure) {
    if (typeof structure === "string") return structures[structure];
    throw new TypeError(
      `"structure" argument must be a string (received ${typeof structure})`
    );
  }

  /**
   * Extends a structure.
   * <warn> Make sure to extend all structures before instantiating your client.
   * Extending after doing so may not work as expected. </warn>
   * @param {ExtendableStructure} structure Name of the structure class to extend
   * @param {Function} extender Function that takes the base class to extend as its only parameter and returns the
   * extended class/prototype
   * @returns {Function} Extended class/prototype returned from the extender
   * @example
   * const { Structures } = require('discord.js');
   *
   * Structures.extend('Guild', Guild => {
   *   class CoolGuild extends Guild {
   *     constructor(client, data) {
   *       super(client, data);
   *       this.cool = true;
   *     }
   *   }
   *
   *   return CoolGuild;
   * });
   */
  static extend(structure, extender) {
    if (!structures[structure])
      throw new RangeError(
        `"${structure}" is not a valid extensible structure.`
      );
    if (typeof extender !== "function") {
      const received = `(received ${typeof extender})`;
      throw new TypeError(
        `"extender" argument must be a function that returns the extended structure class/prototype ${received}.`
      );
    }

    const extended = extender(structures[structure]);
    if (typeof extended !== "function") {
      const received = `(received ${typeof extended})`;
      throw new TypeError(
        `The extender function must return the extended structure class/prototype ${received}.`
      );
    }

    if (!(extended.prototype instanceof structures[structure])) {
      const prototype = Object.getPrototypeOf(extended);
      const received = `${extended.name ?? "unnamed"}${
        prototype.name ? ` extends ${prototype.name}` : ""
      }`;
      throw new Error(
        "The class/prototype returned from the extender function must extend the existing structure class/prototype" +
          ` (received function ${received}; expected extension of ${structures[structure].name}).`
      );
    }

    structures[structure] = extended;
    return extended;
  }
}

const structures = {
  GuildEmoji: require("../../node_modules/discord.js/src/structures/GuildEmoji"),
  DMChannel: require("../../node_modules/discord.js/src/structures/DMChannel"),
  TextChannel: require("../../node_modules/discord.js/src/structures/TextChannel"),
  VoiceChannel: require("../../node_modules/discord.js/src/structures/VoiceChannel"),
  CategoryChannel: require("../../node_modules/discord.js/src/structures/CategoryChannel"),
  NewsChannel: require("../../node_modules/discord.js/src/structures/NewsChannel"),
  StoreChannel: require("../../node_modules/discord.js/src/structures/StoreChannel"),
  StageChannel: require("../../node_modules/discord.js/src/structures/StageChannel"),
  ThreadChannel: require("../../node_modules/discord.js/src/structures/ThreadChannel"),
  GuildMember: require("../../node_modules/discord.js/src/structures/GuildMember"),
  ThreadMember: require("../../node_modules/discord.js/src/structures/ThreadMember"),
  Guild: require("../../node_modules/discord.js/src/structures/Guild"),
  Message: require("../../node_modules/discord.js/src/structures/Message"),
  MessageReaction: require("../../node_modules/discord.js/src/structures/MessageReaction"),
  Presence: require("../../node_modules/discord.js/src/structures/Presence")
    .Presence,
  ClientPresence: require("../../node_modules/discord.js/src/structures/ClientPresence"),
  VoiceState: require("../../node_modules/discord.js/src/structures/VoiceState"),
  Role: require("../../node_modules/discord.js/src/structures/Role"),
  User: require("../../node_modules/discord.js/src/structures/User"),
  CommandInteraction: require("../../node_modules/discord.js/src/structures/CommandInteraction"),
  ButtonInteraction: require("../../node_modules/discord.js/src/structures/ButtonInteraction"),
  SelectMenuInteraction: require("../../node_modules/discord.js/src/structures/SelectMenuInteraction"),
  StageInstance: require("../../node_modules/discord.js/src/structures/StageInstance"),
};

module.exports = Structures;
