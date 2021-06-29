const { Collection } = require('discord.js');

class Category extends Collection{
  constructor(id,iterable){
    super(iterable);
    this.id = id;
  }
  reloadAll() {
        for (const m of Array.from(this.values())) {
            if (m.filepath) m.reload();
        }

        return this;
    }
  removeAll() {
        for (const m of Array.from(this.values())) {
            if (m.filepath) m.remove();
        }

        return this;
    }
  toString() {
        return this.id;
    }
}

module.exports = Category;