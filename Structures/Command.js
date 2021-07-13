const { Permissions } = require("discord.js"),
  TypeResolver = require("./Command/Argument/TypeResolver"),
  EventEmitter = require("events"),
  AmaneError = require("./Extender/Error");

class Command {
  constructor(client, options = {}) {
    this.client = client;

    this.name = options.name || null;
    this.event = new EventEmitter();
    this.resolver = new TypeResolver(this);
    this.resolvedargs = new Array();
    this.aliases = options.aliases || [];
    this.description = options.description || "説明なし";
    this.example = options.example || [];
    this.category = options.category || "一般";
    this.args = options.args || false;
    this.types = options.types || null;
    this.nonparse = options.nonparse || false;
    this.usage = options.usage || null;
    this.cooldown = options.cooldown || 1000;
    this.disable = options.disable || false;
    this.userPerms = new Permissions(
      options.userPerms || "SEND_MESSAGES"
    ).freeze();
    this.userPermsNotBit = options.userPerms || ["SEND_MESSAGES"];
    this.botPerms = new Permissions(
      options.botPerms || "SEND_MESSAGES"
    ).freeze();
    this.botPermsNotBit = options.botPerms || ["SEND_MESSAGES"];
    this.guildOnly = options.guildOnly || false;
    this.ownerOnly = options.ownerOnly || false;
    this.nsfw = options.nsfw || false;
    this.cmdCooldown = new Map();
  }

  async run() {
    const err = new AmaneError("NOT_PROVIDE_RUN_METHOD", this.name);
    this.message.channel.send({
      embed: { title: err.code, description: err.message },
    });
    throw err;
  }
  
  resolve(){
    if(this.types === null || this.types === []){
      this.resolvedargs.push(null)
      return 
    }

    this.types.forEach((type,index) => {
      this.resolvedargs[type.id] = this.resolver.type(type.type)(this.message,this.nonparse ? this.message.args :this.message.args[index]);
      
      if(this.resolvedargs[type.id] === null){
        this.event.emit('TYPE_INVALID',this);
      }
    })
    return this.resolvedargs;
  }

  startCooldown(user) {
    this.cmdCooldown.set(user, this.cooldown);
    setTimeout(() => {
      this.cmdCooldown.delete(user);
    }, this.cooldown);
  }

  setMessage(message) {
    this.message = message;
  }

  respond(message) {
    return this.message.channel.send(message);
  }
}

module.exports = Command;
