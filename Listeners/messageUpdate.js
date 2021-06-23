class MessageUpdate {
  constructor(client) {
    this.enable = true;
    this.client = client;
  }

  async run(oldMessage, newMessage) {
    this.client.events.get("message").run(newMessage);
  }
}

module.exports = MessageUpdate;
