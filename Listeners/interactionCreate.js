class Interaction {
  constructor(client) {
    this.enable = true;
    this.client = client;
  }

  async run(interaction) {
    if (interaction.isCommand()) {
      const command = this.client.commands.get(interaction.commandName);
      if (!command) return;
      interaction.data = {};
      interaction.data.userData = await this.client.findOrCreateUser(
        { id: interaction.user.id },
        true
      );
      if (command.cmdCooldown.has(interaction.user.id))
        return interaction.reply(
          "`<<cmd>>`コマンドは`<<time>>`秒に1回だけ使えます。"
            .replace(
              /<<time>>/gm,
              command.cmdCooldown.get(interaction.user.id) / 1000
            )
            .replace(/<<cmd>>/gm, command.name)
        );
      if (
        command.ownerOnly &&
        !this.client.owners.includes(interaction.user.id)
      )
        return;

      if (command.guildOnly && !interaction.guild) return;

      if (command.nsfw && !interaction.channel.nsfw) return;
      if (
        interaction.guild &&
        !this.client.owners.includes(interaction.user.id)
      ) {
        const userPerms = interaction.channel
          .permissionsFor(interaction.member)
          .missing(command.userPerms);

        if (userPerms.length)
          return interaction.reply("このコマンドを実行する権限がありません。");

        const botPerms = interaction.channel
          .permissionsFor(this.client.user)
          .missing(command.botPerms);

        if (botPerms.length)
          return interaction.reply("botの権限設定を確認してください。");
      }
      const args = interaction.options.first(interaction.options.size);
      command.isSlash = true;
      command.setInteraction(interaction);
      command.slash.run(interaction, args);
    }
  }
}

module.exports = Interaction;
