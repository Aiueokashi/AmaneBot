const ReactionRoleEvent = Object.freeze({
  REACTION_ROLE_ADD: "reactionRoleAdd",
  REACTION_ROLE_REMOVE: "reactionRoleRemove",
  ALL_REACTIONS_REMOVE: "allReactionsRemove",
  MISSING_REQUIREMENTS: "missingRequirements",
  MISSING_PERMISSIONS: "missingPermissions",
  DEBUG: "debug",
  READY: "ready"
});

const RequirementType = Object.freeze({
  UNKNOWN: 0,
  BOOST: 1,
  VERIFIED_DEVELOPER: 2,
  PERMISSION: 3,
  ROLES: 4,
  USERS: 5
});

const ReactionRoleType = Object.freeze({
  UNKNOWN: 0,
  NORMAL: 1,
  TOGGLE: 2,
  JUST_WIN: 3,
  JUST_LOSE: 4,
  REVERSED: 5
});

const ActionType = Object.freeze({
  UNKNOWN: 0,
  GIVE: 1,
  TAKE: 2
});

const isValidReactionRoleType = number =>
  !isNaN(number) &&
  (number >= ReactionRoleType.NORMAL && number <= ReactionRoleType.REVERSED);

module.exports = {
  RequirementType,
  ReactionRoleEvent,
  ReactionRoleType,
  ActionType,
  isValidReactionRoleType
};
