class Flag {
  constructor(type, data = {}) {
    this.type = type;
    Object.assign(this, data);
  }
  static cancel() {
    return new Flag("cancel");
  }

  static retry(message) {
    return new Flag("retry", { message });
  }

  static fail(value) {
    return new Flag("fail", { value });
  }

  static continue(command, ignore = false, rest = null) {
    return new Flag("continue", { command, ignore, rest });
  }

  static is(value, type) {
    return value instanceof Flag && value.type === type;
  }
}

module.exports = Flag;
