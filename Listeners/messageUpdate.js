class MessageUpdate {
  constructor(client) {
    this.enable = true;
    this.client = client;
  }

  async run(oldMessage, newMessage) {
    this.client.events.get("messageCreate").run(newMessage);
    this.client.debug(
      this.client.chalk.bold.green(
        `MessageUpdate: (${oldMessage.id})\n[content]:${newMessage.content}`
      )
    );
  }
}

module.exports = MessageUpdate;
