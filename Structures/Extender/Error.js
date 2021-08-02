const chalk = require("chalk");
chalk.err = chalk.bold.red;
const ErrMsg = {
  ALIAS_CONFLICT: (alias, id, conflict) =>
    `'${chalk.err(id)}'コマンドの'${chalk.err(alias)}'は'${chalk.err(
      conflict
    )}'で既に使用されています。`,
  INVALID_COMMAND_TYPE: (filename) =>
    `${chalk.err(filename)}を正常に読み込めません。`,
  COMMAND_CONFLICT: (command, conflict) =>
    `'${chalk.err(command)}' コマンド名が被っています。`,
  NOT_PROVIDE_RUN_METHOD: (name) =>
    `${name}コマンドにrunメソッドがありません。`,
  COLOR_CONVERT: (color) => `カラーコードに変換できません :${color}`,
  COLOR_RANGE: (color) => `カラーコードの範囲外です :${color}`,
  ALREADY_LOADED: (name, id) =>
    `${chalk.err(name)}: '${chalk.err(id)}'は既にロードされています。`,
  MODULE_NOT_FOUND: (name, id) =>
    `${chalk.err(name)}: '${chalk.err(id)}'は存在しません。`,
  NOT_RELOADABLE: (name, id) =>
    `${chalk.err(name)}: '${chalk.err(id)}'は再読み込みできません。`,
  UNKNOWN_MATCH_TYPE: (match) =>
    `${chalk.err(match)} 一致するマッチタイプが存在しません`,
  BUTTONMENU_VALIDATION_FAILED: (type) =>
    `引数"message"は${chalk.err(
      "Object"
    )}である必要があります。渡された型:${chalk.err(type)}`,
  INVALID_SLASHCOMMAND_TYPE: (filename) =>
    `${chalk.err(filename)}を正常に読み込めません。`,
};
//Errorを拡張
class AmaneError extends Error {
  constructor(key, ...args) {
    if (ErrMsg[key] == null) throw new TypeError(`key '${key}' は存在しません`);
    const message =
      typeof ErrMsg[key] === "function" ? ErrMsg[key](...args) : ErrMsg[key];

    super(message);
    this.code = key;
  }

  get name() {
    return chalk.bold.bgRed(`AmaneError [${this.code}]`);
  }
}

module.exports = AmaneError;
