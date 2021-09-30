const AmaneError = require("../Extender/Error") 

class YTDLPlayer {
  constructor(guild){
    this.guild = guild;
    this.client = guild.client;
    this.player = guild.client.player;
    this.queue = null;
  }
  
  createQueue(){
    if(this.queue !== null){
      throw new AmaneError("ALREADY_CREATED_QUEUE",guild)
    }
    
    this.queue = this.player.createQueue(this.guild.id);
    return this.queue;
  }
  
  async join(message){
    if(this.queue === null){
      throw new AmaneError("CANNOT_FIND_QUEUE",guild);
    }
    await this.queue.join(message.member.voice.channel);
    return this.queue;
  }
  
  async leave(){
    if(this.queue === null){
      throw new AmaneError("CANNOT_FIND_QUEUE",guild);
    }
    this.queue.connection.leave();
    this.queue = null;
  }
  
}

module.exports = YTDLPlayer;