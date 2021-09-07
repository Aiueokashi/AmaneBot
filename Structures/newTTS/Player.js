

class TTSPlayer {
  constructor(guild){
    super(guild);
    this.guild = guild;
    this.client = guild.client;
    this.player = guild.client.player;
  }
  
  
}