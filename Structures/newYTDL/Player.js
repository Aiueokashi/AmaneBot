const AmaneError = require("../Extender/Error") 

class YTDLPlayer {
  constructor(guild){
    super(guild);
    this.guild = guild;
    this.client = guild.client;
    this.player = guild.client.player;
  }
  
  function createQueue(message){
    if(this.queue !== null){
      throw new AmaneError("ALREADY_CREATED_QUEUE",guild)
    }
    this.queue = this.player.createQueue(this.guild.id);
    return this.queue;
  }
  
  async function join(message){
    if(this.queue === null){
      throw new AmaneError("CANNOT_FIND_QUEUE",guild);
    }
    await this.queue.join(message.member.voice.channel);
  }
  
  async function leave(){
    if(this.queue === null){
      throw new AmaneError("CANNOT_FIND_QUEUE",guild);
    }
    this.queue.connection.leave();
  }
  
}