const {
  GuildMember,
  PermissionResolvable,
  RoleResolvable,
  UserResolvable,
} = require("discord.js");
const { ReactionRoleType, isValidReactionRoleType } = require("./constants");

class ReactionRole {
  constructor({
    message,
    channel,
    guild,
    role,
    emoji,
    winners,
    max,
    toggle,
    requirements,
    disabled,
    type,
    roles,
  }) {
    this.guild = message.guild ? message.guild.id : guild;

    this.channel = message.channel ? message.channel.id : channel;

    this.message = message.id ? message.id : message;

    this.role = role && role.id ? role.id : role;

    this.emoji = emoji.id || emoji.name ? emoji.id : emoji.name || emoji;

    this.winners = winners || [];

    this.max = isNaN(max) ? 0 : Number(max);

    this.toggle = Boolean(toggle);

    this.requirements = {
      boost: false,
      verifiedDeveloper: false,
      roles: {
        allowList: [],
        denyList: [],
      },
      users: {
        allowList: [],
        denyList: [],
      },
      permissionsNeed: [],
      ...requirements,
    };

    this.disabled = Boolean(disabled);

    this.type = Number(type);

    this.roles = Array.isArray(roles) ? roles : [];

    this.__check();
    this.__handleDeprecation();
    if (!isValidReactionRoleType(this.type))
      throw new Error(
        `Unexpected Reaction Role Type: '${this.type}' is not a valid type.`
      );
  }

  get id() {
    return `${this.message}-${this.emoji}`;
  }

  get isToggle() {
    return this.type === ReactionRoleType.TOGGLE;
  }

  get isNormal() {
    return this.type === ReactionRoleType.NORMAL;
  }

  get isJustWin() {
    return this.type === ReactionRoleType.JUST_WIN;
  }

  get isJustLose() {
    return this.type === ReactionRoleType.JUST_LOSE;
  }

  get isReversed() {
    return this.type === ReactionRoleType.REVERSED;
  }

  toJSON() {
    return {
      id: this.id,
      message: this.message,
      channel: this.channel,
      guild: this.guild,
      emoji: this.emoji,
      winners: this.winners,
      max: this.max,
      requirements: this.requirements,
      disabled: this.disabled,
      type: this.type,
      roles: this.roles,
    };
  }

  async checkDeveloperRequirement(member) {
    return new Promise(async (resolve) => {
      if (!this.requirements.verifiedDeveloper) return resolve(true);
      const flags = await member.user.fetchFlags();
      const isVerifiedDeveloper = flags.has("VERIFIED_DEVELOPER");
      return resolve(isVerifiedDeveloper);
    });
  }

  checkBoostRequirement(member) {
    const isBoost =
      member.premiumSinceTimestamp != null && member.premiumSince != null;
    if (this.requirements.boost) return isBoost;
    return true;
  }

  static fromJSON(json) {
    return new ReactionRole({
      message: json.message,
      channel: json.channel,
      guild: json.guild,
      role: json.role,
      emoji: json.emoji,
      winners: json.winners,
      max: json.max,
      toggle: json.toggle,
      requirements: json.requirements,
      disabled: json.disabled,
      type: json.type,
      roles: json.roles,
    });
  }

  __handleDeprecation() {
    if (this.max > 10e9 || this.max < 0) this.max = 0; // 1B is max, 0 is inifity.

    if (this.toggle && this.type !== ReactionRoleType.TOGGLE)
      this.type = ReactionRoleType.TOGGLE;
    else if (this.type === ReactionRoleType.UNKNOWN)
      this.type = ReactionRoleType.NORMAL;

    if (this.role && !this.roles.includes(this.role))
      this.roles.push(this.role);
  }

  __check() {
    this.requirements.boost = Boolean(this.requirements.boost);
    this.requirements.verifiedDeveloper = Boolean(
      this.requirements.verifiedDeveloper
    );
    if (typeof this.requirements.boost !== "boolean")
      throw new Error(
        "Invalid property: requirements.boost must be a boolean."
      );
    if (typeof this.requirements.verifiedDeveloper !== "boolean")
      throw new Error(
        "Invalid property: requirements.verifiedDeveloper must be a boolean."
      );
    if (!Array.isArray(this.requirements.roles.allowList))
      throw new Error(
        "Invalid property: requirements.roles.allowList must be a array."
      );
    if (!Array.isArray(this.requirements.roles.denyList))
      throw new Error(
        "Invalid property: requirements.roles.denyList must be a array."
      );
    if (!Array.isArray(this.requirements.permissionsNeed))
      throw new Error(
        "Invalid property: requirements.permissionsNeed must be a array."
      );
  }
}

module.exports = {
  ReactionRole,
};
