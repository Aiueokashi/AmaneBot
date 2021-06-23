const {
  Client,
  Role,
  Message,
  Collection,
  GuildMember,
  Util,
  MessageReaction,
  User
} = require("discord.js");
const { EventEmitter } = require("events");
const fs = require("fs");
const AsyncLock = require("async-lock");
const Constants = require("../util/constants");
const { ReactionRole, IRequirementType } = require("./reactionRole");
const {
  ReactionRoleEvent,
  ReactionRoleType,
  RequirementType,
  ActionType,
  isValidReactionRoleType
} = require("./constants");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const locker = new AsyncLock();

class ReactionRoleManager extends EventEmitter {
  constructor(
    client,
    { storage, mongoDbLink, path, disabledProperty, hooks, keepReactions }
  ) {
    super();

    this.isReady = false;
    this.readyAt = null;
    this.client = client;
    this.storage = typeof storage === "boolean" ? storage : true;
    this.mongoDbLink = mongoDbLink || null;
    this.reactionRoles = new Collection();
    this.timeouts = new Collection();
    this.storageJsonPath = path || null;
    this.disabledProperty =
      typeof disabledProperty === "boolean" ? disabledProperty : true;
    this.hooks = {
      preRoleAddHook: (...args) => true,
      preRoleRemoveHook: (...args) => true,
      ...hooks
    };
    this.keepReactions =
      typeof keepReactions === "boolean" ? keepReactions : false;
    this.__withoutPermissionsWarned = new Set();

    if (
      this.hooks.preRoleAddHook &&
      typeof this.hooks.preRoleAddHook !== "function"
    )
      throw new Error("Hook 'preRoleAdd' must be a function.");
    else if (
      this.hooks.preRoleRemoveHook &&
      typeof this.hooks.preRoleRemoveHook !== "function"
    ) {
      throw new Error("Hook 'preRoleRemoveHook' must be a function.");
    }

    this.client.on("ready", () => this.__resfreshOnBoot());
    this.client.on("messageReactionAdd", (msgReaction, user) =>
      this.__onReactionAdd(msgReaction, user)
    );
    this.client.on("messageReactionRemove", (msgReaction, user) =>
      this.__onReactionRemove(msgReaction, user)
    );
    this.client.on("messageReactionRemoveAll", message =>
      this.__onRemoveAllReaction(message)
    );

    this.client.on("roleDelete", async role => {
      const reactionRole = this.reactionRoles.find(rr =>
        rr.roles.includes(role.id)
      );
      if (reactionRole) return this.__handleDeleted(reactionRole, role);
    });

    this.client.on("emojiDelete", async emoji => {
      const emojiIdentifier = this.__resolveReactionEmoji(emoji);
      const reactionRole = this.reactionRoles.find(
        rr => rr.emoji === emojiIdentifier
      );
      if (reactionRole) return this.__handleDeleted(reactionRole, emoji);
    });

    this.client.on("guildDelete", async guild => {
      const reactionRole = this.reactionRoles.find(rr => rr.guild === guild.id);
      if (reactionRole) return this.__handleDeleted(reactionRole, guild);
    });

    this.client.on("channelDelete", async channel => {
      const reactionRole = this.reactionRoles.find(
        rr => rr.channel === channel.id
      );
      if (reactionRole) return this.__handleDeleted(reactionRole, channel);
    });

    const messageDeleteHandler = async message => {
      const reactionRole = this.reactionRoles.find(
        rr => rr.message === message.id
      );
      if (reactionRole) return this.__handleDeleted(reactionRole, message);
    };

    this.client.on("messageDelete", msg => messageDeleteHandler(msg));

    this.client.on("messageDeleteBulk", messages => {
      const array = messages.array();
      for (let i = 0; i < array.length; i += 1) {
        messageDeleteHandler(array[i]);
      }
    });
  }

  async __handleDeleted(
    reactionRole,
    guildResolvable,
    callback = () => this.deleteReactionRole({ reactionRole }, true)
  ) {
    if (this.keepReactions) return callback();

    const guild = this.client.guilds.resolve(guildResolvable);
    if (!guild) return callback();

    const channel = guild.channels.cache.get(reactionRole.channel);
    if (!channel) return callback();

    try {
      const message = await channel.messages.fetch(reactionRole.message);
      if (!message) return callback();

      const reaction = message.reactions.cache.find(
        x =>
          reactionRole.id ===
          `${message.id}-${this.__resolveReactionEmoji(x.emoji)}`
      );
      if (!reaction) return callback();

      await reaction.remove();
    } catch {
      return callback();
    }
  }

  async __checkMongoose() {
    return new Promise(async (resolve, reject) => {
      if (!this.mongoDbLink) return resolve("Mongoose is disabled.");

      try {
        this.mongoose = require("mongoose");
        await this.mongoose.connect(
          this.mongoDbLink,
          {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
          }
        );

        this.mongoose.model(
          "ReactionRoles",
          new this.mongoose.Schema({
            id: String,
            message: String,
            channel: String,
            guild: String,
            role: String,
            emoji: String,
            winners: Array,
            max: {
              type: Number,
              default: 0
            },
            toggle: {
              type: Boolean
            },
            requirements: {
              boost: {
                type: Boolean,
                default: false
              },
              verifiedDeveloper: {
                type: Boolean,
                default: false
              }
            },
            disabled: {
              type: Boolean,
              default: false
            },
            type: {
              type: Number,
              default: 0
            },
            roles: {
              type: Array,
              default: []
            }
          })
        );
        return resolve(true);
      } catch (e) {
        return reject(e);
      }
    });
  }

  async __resfreshOnBoot() {
    if (!this.storage) return;

    await this.__checkMongoose();
    await this.__parseStorage();
    await sleep(1500);

    const reactionRoleArray = this.reactionRoles.array();
    for (let i = 0; i < reactionRoleArray.length; i += 1) {
      const reactionRole = reactionRoleArray[i];
      const guild = this.client.guilds.cache.get(reactionRole.guild);
      if (!guild) {
        this.__debug(
          "BOOT",
          `Role '${reactionRole.id}' failed at start, guild wasn't found.`
        );
        this.__handleDeleted(reactionRole, guild);
        continue;
      }

      const channel = guild.channels.cache.get(reactionRole.channel);
      if (!channel) {
        this.__debug(
          "BOOT",
          `Role '${reactionRole.id}' failed at start, channel wasn't found.`
        );
        this.__handleDeleted(reactionRole, guild);
        continue;
      }

      try {
        const message = await channel.messages.fetch(reactionRole.message);
        if (!message || !(message instanceof Message)) {
          this.__debug(
            "BOOT",
            `Role '${reactionRole.id}' failed at start, message wasn't found.`
          );
          this.__handleDeleted(reactionRole, guild);
          continue;
        }
        if (message.partial) await message.fetch();
        if (!message.reactions.cache.has(reactionRole.emoji))
          await message.react(reactionRole.emoji);

        const reaction = message.reactions.cache.find(
          x =>
            reactionRole.id ===
            `${message.id}-${this.__resolveReactionEmoji(x.emoji)}`
        );

        if (reaction.partial) await reaction.fetch();

        const users = await reaction.users.fetch();
        const usersArray = users.array();
        for (let j = 0; j < usersArray.length; j += 1) {
          const user = usersArray[j];
          if (user.partial) await user.fetch();
          if (user.bot) continue;

          const member = guild.members.cache.get(user.id);
          if (!member) {
            await reaction.users.remove(user.id);
            this.__debug(
              "BOOT",
              `Member '${
                user.id
              }' wasn't found, reaction of his was removed from message.`
            );
            continue;
          }

          await this.__handleReactionRoleAction(
            ActionType.GIVE,
            member,
            reactionRole,
            reaction
          );
        }

        for (let j = 0; j < reactionRole.winners.length; j += 1) {
          const winnerId = reactionRole.winners[j];
          const member = guild.members.cache.get(winnerId);
          if (!member) {
            reactionRole.winners.splice(j, 1);
            this.__debug(
              "BOOT",
              `Member '${winnerId}' wasn't found, his was removed from winner list.`
            );
            continue;
          }

          if (member.partial) await member.fetch();
          if (member.user.partial) await member.fetch();
          if (member.user.bot) continue;

          if (!users.has(winnerId))
            await this.__handleReactionRoleAction(
              ActionType.TAKE,
              member,
              reactionRole,
              reaction
            );
        }
      } catch (error) {
        if (error && error.code === 10008) {
          this.__debug(
            "BOOT",
            `Role '${reactionRole.id}' failed at start, message wasn't found.`
          );
          this.__handleDeleted(reactionRole, guild);
          continue;
        }
        throw error;
      }
      this.__readyTimeout();
    }
  }

  __debug(type, message, ...args) {
    this.emit(
      ReactionRoleEvent.DEBUG,
      `[${new Date().toLocaleString()}] [REACTION ROLE] [DEBUG] [${type.toUpperCase()}] - ${message} ${args}`
    );
  }

  async __checkRequirements(reactionRole, reaction, member) {
    return new Promise(async resolve => {
      if (reactionRole.requirements.permissionsNeed.length > 0) {
        const missingPermissions = member.permissions.missing(
          reactionRole.requirements.permissionsNeed
        );
        if (missingPermissions.length > 0) {
          this.emit(
            ReactionRoleEvent.MISSING_REQUIREMENTS,
            RequirementType.PERMISSION,
            member,
            reactionRole,
            missingPermissions
          );
          await reaction.users.remove(member.user);
          this.__debug(
            "BOOT",
            `Member '${
              member.id
            }' not have all permissions requirement, will not win this role.`
          );
          return resolve(false);
        }
      }

      if (
        reactionRole.requirements.roles.allowList.length > 0 ||
        reactionRole.requirements.roles.denyList.length > 0
      ) {
        const withoutAllowedRoles = reactionRole.requirements.roles.allowList.filter(
          roleId => !member.roles.cache.has(roleId)
        );
        const withDeniedRoles = reactionRole.requirements.roles.denyList.filter(
          roleId => member.roles.cache.has(roleId)
        );

        const roles = {
          withoutAllowedRoles: withoutAllowedRoles.map(roleId =>
            member.guild.roles.resolve(roleId)
          ),
          withDeniedRoles: withDeniedRoles.map(roleId =>
            member.guild.roles.resolve(roleId)
          )
        };

        if (withoutAllowedRoles.length > 0 || withDeniedRoles.length > 0) {
          this.emit(
            ReactionRoleEvent.MISSING_REQUIREMENTS,
            RequirementType.ROLES,
            member,
            reactionRole,
            roles
          );
          await reaction.users.remove(member.user);
          this.__debug(
            "BOOT",
            `Member '${
              member.id
            }' not have all allowed roles requirement or has some denied roles, will not win this role.`
          );
          return resolve(false);
        }
      }

      if (
        reactionRole.requirements.users.allowList.length > 0 ||
        reactionRole.requirements.users.denyList.length > 0
      ) {
        const allowedUsers = reactionRole.requirements.users.allowList.map(
          userId => member.guild.members.resolve(userId)
        );
        const deniedUsers = reactionRole.requirements.users.denyList.map(
          userId => member.guild.members.resolve(userId)
        );

        const users = { allowedUsers, deniedUsers };
        if (
          (allowedUsers.length > 0 &&
            !allowedUsers.find(member => member.id)) ||
          (deniedUsers.length > 0 && deniedUsers.find(member => member.id))
        ) {
          this.emit(
            ReactionRoleEvent.MISSING_REQUIREMENTS,
            RequirementType.USERS,
            member,
            reactionRole,
            users
          );
          await reaction.users.remove(member.user);
          this.__debug(
            "BOOT",
            `Member '${
              member.id
            }' not have all allowed users requirement or has included in some denied users list, will not win this role.`
          );
          return resolve(false);
        }
      }

      if (!reactionRole.checkBoostRequirement(member)) {
        this.emit(
          ReactionRoleEvent.MISSING_REQUIREMENTS,
          RequirementType.BOOST,
          member,
          reactionRole
        );
        await reaction.users.remove(member.user);
        this.__debug(
          "BOOT",
          `Member '${
            member.id
          }' not have boost requirement, will not win this role.`
        );
        return resolve(false);
      }

      if (!(await reactionRole.checkDeveloperRequirement(member))) {
        this.emit(
          ReactionRoleEvent.MISSING_REQUIREMENTS,
          RequirementType.VERIFIED_DEVELOPER,
          member,
          reactionRole
        );
        await reaction.users.remove(member.user);
        this.__debug(
          "BOOT",
          `Member '${
            member.user.id
          }' not have verified developer requirement, will not win this role.`
        );
        return resolve(false);
      }
      return resolve(true);
    });
  }

  createReactionRole(
    { message, roles, emoji, type, max, requirements } = {
      requirements: { boost: false, verifiedDeveloper: false }
    }
  ) {
    return new Promise(async (resolve, reject) => {
      if (message instanceof Message) {
        if (!message.guild) {
          return reject(
            new Error(
              "Bad input: message must be a guild message, cannot create reaction role in DM channels."
            )
          );
        }

        if (type && !isValidReactionRoleType(type))
          return reject(
            new Error(`Bad input: Invalid reaction role type: '${type}'.`)
          );
        if (!type) type = ReactionRoleType.NORMAL;
        if (!max || max > Number.MAX_SAFE_INTEGER || max < 0)
          max = Number.MAX_SAFE_INTEGER;
        roles = roles
          .map(role => message.guild.roles.resolveID(role))
          .filter(role => role);
        if (!roles || roles.length === 0)
          return reject(
            new Error(`Bad input: I canno't resolve the roles ${roles}`)
          );

        const emojiParsed = Util.parseEmoji(emoji);
        emoji = this.__resolveReactionEmoji(emojiParsed);
        if (!emoji)
          return reject(
            new Error(`Bad input: I canno't resolve emoji ${emoji}`)
          );

        if (
          emojiParsed &&
          emojiParsed.id &&
          !this.client.emojis.resolve(emojiParsed.id)
        )
          return reject(new Error(`Bad input: I canno't find emoji ${emoji}`));

        await message.react(emoji);
        const reactionRole = new ReactionRole({
          message,
          roles,
          emoji,
          type,
          max,
          requirements
        });
        this.reactionRoles.set(reactionRole.id, reactionRole);
        await this.store(reactionRole);
        this.__debug(
          "ROLE",
          `Roles '[${roles}]' added in reactionRoleManager!`
        );
        return resolve(reactionRole);
      }
      return reject(
        new Error("Bad input: addRole({...}) message must be a Message Object.")
      );
    });
  }

  async deleteReactionRole({ reactionRole, message, emoji }, deleted = false) {
    return new Promise(async (resolve, reject) => {
      if (message && emoji) {
        const resolvedEmojiID = this.__resolveReactionEmoji(
          Util.parseEmoji(emoji)
        );
        const messageID = message && message.id ? message.id : message;
        if (!messageID)
          return reject(
            new Error(
              "Bad input: invalid message param type, must be instance of Message."
            )
          );
        reactionRole = this.reactionRoles.find(
          rr => rr.message === messageID && rr.emoji === resolvedEmojiID
        );
        if (!(reactionRole instanceof ReactionRole)) {
          return reject(
            new Error(
              `Bad input: I cannot find any reaction role with message ID '${messageID}' and emoji '${emoji}'`
            )
          );
        }
      }

      if (reactionRole instanceof ReactionRole) {
        if (!this.keepReactions)
          await this.__handleDeleted(
            reactionRole,
            reactionRole.guild,
            () => {}
          );

        reactionRole.disabled = true;
        if (this.disabledProperty && this.mongoose) {
          await this.mongoose
            .model("ReactionRoles")
            .updateOne({ id: reactionRole.id }, reactionRole)
            .exec();
        } else {
          if (this.mongoose) {
            await this.mongoose
              .model("ReactionRoles")
              .deleteOne({ id: reactionRole.id })
              .exec();
          }
          this.reactionRoles.delete(reactionRole.id);
        }
        await this.store(reactionRole);

        if (deleted) {
          this.__debug(
            "ROLE",
            `Role '${
              reactionRole.id
            }' deleted, so it was removed from reactionRoleManager!`
          );
        } else {
          this.__debug(
            "ROLE",
            `Role '${reactionRole.id}' removed from reactionRoleManager!`
          );
        }
        return resolve(
          reactionRole && reactionRole.disabled ? reactionRole : null
        );
      }
      return reject(
        new Error(
          "Bad input: deleteReactionRole(role) must be a ReactionRole Object."
        )
      );
    });
  }

  async store(...roles) {
    return new Promise(async resolve => {
      if (this.storage) {
        if (this.mongoose) {
          for (let i = 0; i < roles.length; i += 1) {
            const role = roles[i];
            await this.mongoose
              .model("ReactionRoles")
              .findOneAndUpdate({ id: role.id }, role, {
                new: true,
                upsert: true
              })
              .exec();
          }
          this.__debug("STORE", `Stored ${roles.length} updated roles.`);
        }

        if (this.storageJsonPath) {
          fs.writeFileSync(
            this.storageJsonPath,
            JSON.stringify(this.reactionRoles.map(role => role.toJSON()))
          );
          this.__debug(
            "STORE",
            `Stored roles saved, contains '${this.reactionRoles.size}' roles.`
          );
        }
      }
      return resolve();
    });
  }

  async __parseStorage() {
    return new Promise(async resolve => {
      if (this.storage) {
        const roles = [];
        if (fs.existsSync(this.storageJsonPath)) {
          const json = JSON.parse(
            fs.readFileSync(this.storageJsonPath).toString()
          );
          roles.push(...json);
        }

        if (this.mongoose) {
          roles.push(
            ...(await this.mongoose
              .model("ReactionRoles")
              .find({ disabled: false }))
          );
        }

        for (let i = 0; i < roles.length; i += 1) {
          const role = roles[i];
          if (!role || !role.message || role.disabled) continue;

          this.reactionRoles.set(role.id, ReactionRole.fromJSON(role));
        }
      }
      this.__debug(
        "STORE",
        `Stored roles parsed, contains '${this.reactionRoles.size}' roles.`
      );
      return resolve();
    });
  }

  async __onReactionAdd(msgReaction, user) {
    if (user.bot) return;

    if (msgReaction.partial) await msgReaction.fetch();
    if (user.partial) await user.fetch();

    const emoji = this.__resolveReactionEmoji(msgReaction.emoji);
    const { message } = msgReaction;
    if (message.partial) await message.fetch();

    const { guild } = message;
    const id = `${message.id}-${emoji}`;

    const member = guild.members.cache.get(user.id);
    if (!member) return;

    if (member.partial) await member.fetch();

    const reactionRole = this.reactionRoles.get(id);
    if (!(reactionRole instanceof ReactionRole)) return;

    this.__handleReactionRoleAction(
      ActionType.GIVE,
      member,
      reactionRole,
      msgReaction
    );
  }

  async __timeoutToggledRoles(member, message, skippedRole = null, tries = 0) {
    if (++tries > 3)
      return this.__debug(
        "TOGGLE",
        `Toggled roles timeout expired tries, member '${
          member.id
        }' will not be processed.`
      );
    if (locker.isBusy(member.id)) {
      this.__debug("TOGGLE", `Member '${member.id}' is holding timeout queue.`);
      await sleep(Constants.DEFAULT_TIMEOUT_TOGGLED_ROLES);
      return this.__timeoutToggledRoles(member, message, skippedRole, tries);
    }

    const timeout = this.timeouts.get(member.id);
    if (timeout) this.client.clearTimeout(timeout);

    this.timeouts.set(
      member.id,
      setTimeout(
        async () =>
          locker.acquire(member.id, async () => {
            const toggledRoles = this.reactionRoles.filter(
              rr => rr.message === message.id && rr.isToggle
            );
            const toggledRolesArray = toggledRoles.array();
            for (let i = 0; i < toggledRolesArray.length; i += 1) {
              const toggledRole = toggledRolesArray[i];
              if (toggledRole.disabled) continue;

              const reaction = message.reactions.cache.find(
                r => this.__resolveReactionEmoji(r.emoji) === toggledRole.emoji
              );

              if (member.partial) await member.fetch();
              if (reaction.partial) await reaction.fetch();

              const users = await reaction.users.fetch();
              if (
                users.has(member.id) &&
                (!skippedRole || skippedRole.id === toggledRole.id)
              ) {
                skippedRole = toggledRole;
                continue;
              }

              const roleID = toggledRole.roles[0];
              const role = member.guild.roles.cache.get(roleID);

              this.__checkRolesPermissions(
                ActionType.TAKE,
                toggledRole,
                member
              );

              if (
                role.editable &&
                (await this.hooks.preRoleRemoveHook(member, role, toggledRole))
              ) {
                const index = toggledRole.winners.indexOf(member.id);
                if (index >= 0) toggledRole.winners.splice(index, 1);

                if (member.roles.cache.has(toggledRole.id)) {
                  await member.roles.remove(roleID);
                  this.emit(
                    ReactionRoleEvent.REACTION_ROLE_REMOVE,
                    member,
                    role
                  );
                  this.__debug(
                    "TOGGLE",
                    `Take off role '${roleID}' from user '${
                      member.id
                    }', it's a toggled role.`
                  );
                }

                if (users.has(member.id))
                  await reaction.users.remove(member.user);
              } else await reaction.users.remove(member.id);
            }

            if (skippedRole instanceof ReactionRole) {
              const reaction = message.reactions.cache.find(
                r => this.__resolveReactionEmoji(r.emoji) === skippedRole.emoji
              );

              const roleID = skippedRole.roles[0];
              const role = message.guild.roles.cache.get(roleID);

              this.__checkRolesPermissions(
                ActionType.GIVE,
                skippedRole,
                member
              );

              if (
                role.editable &&
                (await this.__checkRequirements(
                  skippedRole,
                  reaction,
                  member
                )) &&
                (await this.hooks.preRoleAddHook(member, role, skippedRole))
              ) {
                if (skippedRole.winners.indexOf(member.id) <= -1)
                  skippedRole.winners.push(member.id);

                if (!member.roles.cache.has(roleID)) {
                  await member.roles.add(roleID);

                  this.emit(ReactionRoleEvent.REACTION_ROLE_ADD, member, role);
                  if (this.isReady) {
                    this.__debug(
                      "TOGGLE",
                      `Role '${roleID}' was given to '${
                        member.id
                      }' after check toggle roles.`
                    );
                  } else {
                    this.__debug(
                      "BOOT",
                      // eslint-disable-next-line max-len
                      `Role '${roleID}' was given to '${
                        member.id
                      }' after check toggle roles, it reacted when bot wasn't online.`
                    );
                  }
                } else {
                  this.__debug(
                    "BOOT",
                    // eslint-disable-next-line max-len
                    `Keeping role '${roleID}' after check toggle roles. The member '${
                      member.id
                    }' reacted and already have the role.`
                  );
                }
              } else await reaction.users.remove(member.id);
            }

            await this.store(...toggledRoles);
          }),
        Constants.DEFAULT_TIMEOUT_TOGGLED_ROLES
      )
    );
  }

  __readyTimeout() {
    const readyTimeout = this.timeouts.get("ready_timeout");
    if (readyTimeout) this.client.clearTimeout(readyTimeout);
    if (this.isReady) return;

    this.timeouts.set(
      "ready_timeout",
      setTimeout(() => {
        this.isReady = true;
        this.readyAt = new Date();
        this.emit(ReactionRoleEvent.READY);
        this.__debug("READY", "Reaction role manager is ready.");
      }, 5000)
    );
  }
  async __onReactionRemove(msgReaction, user) {
    if (user.bot) return;

    if (msgReaction.partial) await msgReaction.fetch();
    if (user.partial) await user.fetch();

    const emoji = this.__resolveReactionEmoji(msgReaction.emoji);
    const { message } = msgReaction;
    if (message.partial) await message.fetch();

    const { guild } = message;
    const id = `${message.id}-${emoji}`;

    const member = guild.members.cache.get(user.id);
    if (!member) return;

    if (member.partial) await member.fetch();

    const reactionRole = this.reactionRoles.get(id);
    if (!(reactionRole instanceof ReactionRole)) return;

    this.__handleReactionRoleAction(
      ActionType.TAKE,
      member,
      reactionRole,
      msgReaction
    );
  }

  async __onRemoveAllReaction(message) {
    const messageReactionsRoles = this.reactionRoles
      .filter(r => r.message === message.id)
      .array();
    const membersAffected = [];
    const rolesAffected = new Collection();
    let reactionsTaken = 0;

    if (messageReactionsRoles.length <= 0) return;
    for (let i = 0; i < messageReactionsRoles.length; i += 1) {
      const reactionRole = messageReactionsRoles[i];
      for (let j = 0; j < reactionRole.winners.length; j += 1) {
        const winnerId = reactionRole.winners[j];

        const member = message.guild.members.cache.get(winnerId);
        if (!member) continue;
        if (member.partial) await member.fetch();

        const rolesWithPermission = this.__checkRolesPermissions(
          ActionType.TAKE,
          reactionRole,
          member
        );
        for (let k = 0; k < rolesWithPermission.length; k++) {
          const role = rolesWithPermission[k];
          if (await this.hooks.preRoleRemoveHook(member, role, reactionRole)) {
            await member.roles.remove(role.id);
            if (!membersAffected.includes(member)) membersAffected.push(member);
          }

          if (!rolesAffected.has(role.id)) rolesAffected.set(role.id, role);
        }
        reactionsTaken += 1;
      }
      await this.deleteReactionRole({ reactionRole }, true);
      this.__debug(
        "ROLE",
        `Reaction role '${
          reactionRole.id
        }' was deleted, by someone take off all reactions from message.`
      );
    }

    this.emit(
      ReactionRoleEvent.ALL_REACTIONS_REMOVE,
      message,
      rolesAffected,
      membersAffected,
      reactionsTaken
    );
  }

  async __handleReactionRoleAction(action, member, reactionRole, msgReaction) {
    if (reactionRole.disabled) return;
    if (reactionRole.isReversed)
      action = action === ActionType.GIVE ? ActionType.TAKE : ActionType.GIVE;
    if (member.partial) await member.fetch();
    if (msgReaction.partial) await msgReaction.fetch();

    await msgReaction.users.fetch();
    if (reactionRole.isJustLose && action === ActionType.GIVE) {
      await msgReaction.users.remove(member.id);
      return this.__debug(
        "ACTION",
        `Member '${member.id}' will not win the reaction role '${
          reactionRole.id
        }' because this reaction role is just for lose, not for win.`
      );
    }

    if (reactionRole.isJustWin && action === ActionType.TAKE) {
      return this.__debug(
        "ACTION",
        `Member '${member.id}' will not lose the reaction role '${
          reactionRole.id
        }' because this reaction role is just for win, not for lose.`
      );
    }

    const rolesWithPermission = this.__checkRolesPermissions(
      action,
      reactionRole,
      member
    );
    switch (action) {
      case ActionType.GIVE: {
        if (
          reactionRole.winners.length >= reactionRole.max &&
          reactionRole.max > 0
        ) {
          await msgReaction.users.remove(member.id);
          this.__debug(
            "ROLE",
            `Member will not win the reaction role '${
              reactionRole.id
            }' because the maximum number of roles to give has been reached`
          );
          break;
        }

        if (
          !(await this.__checkRequirements(reactionRole, msgReaction, member))
        )
          break;
        if (reactionRole.isToggle) {
          this.__timeoutToggledRoles(member, msgReaction.message, reactionRole);
          break;
        }

        for (let i = 0; i < rolesWithPermission.length; i++) {
          const role = rolesWithPermission[i];
          if (
            (await this.hooks.preRoleAddHook(member, role, reactionRole)) &&
            !member.roles.cache.has(role.id)
          ) {
            await member.roles.add(role);
            this.emit(ReactionRoleEvent.REACTION_ROLE_ADD, member, role);
            this.__debug(
              "ROLE",
              `User '${member.displayName}' won the role '${role.name}'.`
            );

            if (reactionRole.winners.indexOf(member.id) <= -1) {
              reactionRole.winners.push(member.id);
              this.store(reactionRole);
            }
          }
        }
        break;
      }

      case ActionType.TAKE: {
        for (let i = 0; i < rolesWithPermission.length; i++) {
          const role = rolesWithPermission[i];
          if (
            (await this.hooks.preRoleRemoveHook(member, role, reactionRole)) &&
            member.roles.cache.has(role.id)
          ) {
            await member.roles.remove(role);
            this.emit(ReactionRoleEvent.REACTION_ROLE_REMOVE, member, role);
            this.__debug(
              "ROLE",
              `User '${member.displayName}' lost the role '${role.name}'.`
            );
          }
        }

        const index = reactionRole.winners.indexOf(member.id);
        if (index >= 0) {
          reactionRole.winners.splice(index, 1);
          this.store(reactionRole);
        }
        break;
      }
      default: {
        throw new Error(`Unknow action type: ${action}`);
      }
    }
  }

  __checkRolesPermissions(action, reactionRole, member) {
    const roles = reactionRole.roles
      .map(role => member.guild.roles.resolve(role))
      .filter(role => role);
    const rolesWithoutPermission = roles.filter(
      role =>
        !role.editable &&
        !this.__withoutPermissionsWarned.has(`${role.id}-${member.id}`)
    );
    const rolesWithPermission = roles.filter(role => role.editable);
    if (rolesWithoutPermission.length > 0) {
      for (let i = 0; i < rolesWithoutPermission.length; i++) {
        const role = rolesWithoutPermission[i];
        this.__withoutPermissionsWarned.add(`${role.id}-${member.id}`);
      }
      this.emit(
        ReactionRoleEvent.MISSING_PERMISSIONS,
        action,
        member,
        rolesWithoutPermission,
        reactionRole
      );
    }

    return rolesWithPermission;
  }

  __resolveReactionEmoji(emoji) {
    return emoji.id || this.client.emojis.resolveIdentifier(emoji.name);
  }
}

module.exports = {
  ReactionRoleManager,
  ReactionRole,
  REQUIREMENT_TYPE: RequirementType,
  REACTIONROLE_EVENT: ReactionRoleEvent
};