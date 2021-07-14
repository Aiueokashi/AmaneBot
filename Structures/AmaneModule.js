class AmaneModule {
  constructor(id, { category = "default" } = {}) {
    this.id = id;

    this.categoryID = category;

    this.category = null;

    this.filepath = null;

    this.client = null;

    this.handler = null;
  }

  reload() {
    return this.handler.reload(this.id);
  }

  remove() {
    return this.handler.remove(this.id);
  }

  toString() {
    return this.id;
  }
}

module.exports = AmaneModule;
