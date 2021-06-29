const AmaneError = require("../Extender/Error"),
  AmaneModule = require("./AmaneModule"),
  glob = require("glob"),
  fs = require("fs"),
  path = require("path"),
  { Collection } = require("discord.js"),
  { AmaneHandlerEvents } = require("./Constants"),
  Category = require("../Extender/category"),
  EventEmitter = require("events");

class AmaneHandler extends EventEmitter {
  constructor(
    client,
    {
      directory,
      classToHandle = AmaneModule,
      extensions = [".js", ".json"],
      automateCategories = false,
      loadFilter = () => true,
    }
  ) {
    super();
    this.client = client;
    this.directory = directory;
    this.classToHandle = classToHandle;
    this.extensions = new Set(extensions);
    this.automateCategories = Boolean(automateCategories);
    this.loadFilter = loadFilter;
    this.modules = new Collection();
    this.categorys = new Collection();
  }
  register(mod, filepath) {
    mod.filepath = filepath;
    mod.client = this.client;
    mod.handler = this;
    this.modules.set(mod.id, mod);
    if (mod.categoryID === "default" && this.automateCategories) {
      const dirs = path.dirname(filepath).split(path.sep);
      mod.categoryID = dirs[dirs.length - 1];
    }
    if (!this.categories.has(mod.categoryID)) {
      this.categories.set(mod.categoryID, new Category(mod.categoryID));
    }
    const category = this.categories.get(mod.categoryID);
    mod.category = category;
    category.set(mod.id, mod);
  }
  deregister(mod) {
    if (mod.filepath) delete require.cache[require.resolve(mod.filepath)];
    this.modules.delete(mod.id);
    mod.category.delete(mod.id);
  }
  load(thing, isReload = false) {
    const isClass = typeof thing === "function";
    if (!isClass && !this.extensions.has(path.extname(thing))) return undefined;

    let mod = isClass
      ? thing
      : function findExport(m) {
          if (!m) return null;
          if (m.prototype instanceof this.classToHandle) return m;
          return m.default ? findExport.call(this, m.default) : null;
        }.call(this, require(thing));

    if (mod && mod.prototype instanceof this.classToHandle) {
      mod = new mod(this);
    } else {
      if (!isClass) delete require.cache[require.resolve(thing)];
      return undefined;
    }

    if (this.modules.has(mod.id))
      throw new AmaneError("ALREADY_LOADED", this.classToHandle.name, mod.id);

    this.register(mod, isClass ? null : thing);
    this.emit(AmaneHandlerEvents.LOAD, mod, isReload);
    return mod;
  }
  loadAll(
    directory = this.directory,
    filter = this.loadFilter || (() => true)
  ) {
    const filepaths = this.constructor.readdirRecursive(directory);
    for (let filepath of filepaths) {
      filepath = path.resolve(filepath);
      if (filter(filepath)) this.load(filepath);
    }

    return this;
  }
  remove(id) {
    const mod = this.modules.get(id.toString());
    if (!mod)
      throw new AmaneError("MODULE_NOT_FOUND", this.classToHandle.name, id);

    this.deregister(mod);

    this.emit(AmaneHandlerEvents.REMOVE, mod);
    return mod;
  }
  removeAll() {
    for (const m of Array.from(this.modules.values())) {
      if (m.filepath) this.remove(m.id);
    }

    return this;
  }
  reload(id) {
    const mod = this.modules.get(id.toString());
    if (!mod)
      throw new AmaneError("MODULE_NOT_FOUND", this.classToHandle.name, id);
    if (!mod.filepath)
      throw new AmaneError("NOT_RELOADABLE", this.classToHandle.name, id);

    this.deregister(mod);

    const filepath = mod.filepath;
    const newMod = this.load(filepath, true);
    return newMod;
  }
  reloadAll() {
    for (const m of Array.from(this.modules.values())) {
      if (m.filepath) this.reload(m.id);
    }

    return this;
  }
  findCategory(name) {
    return this.categories.find((category) => {
      return category.id.toLowerCase() === name.toLowerCase();
    });
  }
  static readdirRecursive(directory) {
    const result = [];

    (function read(dir) {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filepath = path.join(dir, file);

        if (fs.statSync(filepath).isDirectory()) {
          read(filepath);
        } else {
          result.push(filepath);
        }
      }
    })(directory);

    return result;
  }
}

module.exports = AmaneHandler;
