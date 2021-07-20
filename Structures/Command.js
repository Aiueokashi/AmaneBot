const { Permissions, MessageAttachment, MessageEmbed } = require('discord.js'),
	TypeResolver = require('./Command/Argument/TypeResolver'),
	EventEmitter = require('events'),
  axios = require("axios"),
	AmaneError = require('./Extender/Error');

class Command {
	constructor(client, options = {}) {
		this.client = client;

		this.name = options.name || null;
		this.event = new EventEmitter();
		this.resolver = new TypeResolver(this);
		this.resolvedargs = new Array();
		this.aliases = options.aliases || [];
		this.description = options.description || '説明なし';
		this.example = options.example || [];
		this.category = options.category || '一般';
		this.args = options.args || false;
		this.types = options.types || null;
		this.nonparse = options.nonparse || false;
		this.usage = options.usage || null;
		this.cooldown = options.cooldown || 1000;
		this.disable = options.disable || false;
		this.userPerms = new Permissions(
			options.userPerms || 'SEND_MESSAGES'
		).freeze();
		this.userPermsNotBit = options.userPerms || ['SEND_MESSAGES'];
		this.botPerms = new Permissions(
			options.botPerms || 'SEND_MESSAGES'
		).freeze();
		this.botPermsNotBit = options.botPerms || ['SEND_MESSAGES'];
		this.guildOnly = options.guildOnly || false;
		this.ownerOnly = options.ownerOnly || false;
		this.nsfw = options.nsfw || false;
		this.cmdCooldown = new Map();
	}

	async run() {
		const err = new AmaneError('NOT_PROVIDE_RUN_METHOD', this.name);
		this.message.channel.send({
			embed: { title: err.code, description: err.message }
		});
		throw err;
	}

	async resolve() {
		if (this.types === null || this.types.length === 0) {
			return null;
		}
		let flag = false;
		let i = 0;
		for await (const type of this.types) {
			this.resolvedargs[type.id] = await this.resolver.type(type.type)(
				this.message,
				this.nonparse ? this.message.args : this.message.args[i]
			);
			if (this.resolvedargs[type.id] === null || this.resolvedargs[type.id] === undefined) {
				if (type.subtype) {
						this.resolvedargs[type.id] = await this.resolver.type(type.subtype)(
							this.message,
							this.nonparse ? this.message.args : this.message.args[i]
						);
				} else if (type.default) {
					typeof type.default === 'function'
						? (this.resolvedargs[type.id] = type.default())
						: (this.resolvedargs[type.id] = type.default);
				} else {
					flag = true;
					this.message.channel.embed(
						`第${i + 1}引数の型が間違っています。\ntype: ${type.type}`,
						`${this.client.getEmoji('atlanta_warn')}ARGUMENT_TYPE_INVALID`,
						'RED'
					);
				}
			}
			i++;
		}
		const message = this.message;
		flag
			? message.channel.send(
					!message.command.usage || ''
						? `${message.author}`
						: {
								embed: {
									title: `${message.command.name.replace(/\b\w/g, l =>
										l.toUpperCase()
									)}`,
									color: message.data.userData.color,
									description: `> ${message.command.description}`,
									fields: [
										{
											name: '構文',
											value: `\`\`\`${message.command.usage}\`\`\``
										},
										{
											name: '使用例',
											value: `\`\`\`${(message.command.example &&
												message.command.example
													.map(
														x =>
															`${message.guild.prefix ||
																this.client.config.prefix}${
																message.command.name
															} ${x}`
													)
													.join('\n')) ||
												'使用例なし'}\`\`\``
										}
									]
								}
						  }
			  )
			: null;
		return flag ? undefined : this.resolvedargs;
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

	async respond(content) {
    if(content instanceof MessageAttachment){
      this.message.channel.send(content)
    }else if(typeof content === "string"){
      try{
		  const res = await axios.post(`${this.client.baseURL}/channels/${this.message.channel.id}/messages`,
        {content:content,
        message_reference:{
          message_id:this.message.id
        }
        },
        {headers:{"Authorization": "Bot " + this.client.token,"Content-Type":"application/json"}})
      this.client.debug(res)
      }catch(e){
        this.client.debug(e)
      }
    }else if (content instanceof MessageEmbed){
      try{
      const res = await axios.post(`${this.client.baseURL}/channels/${this.message.channel.id}/messages`,
        {embed:content,
        message_reference:{
          message_id:this.message.id
        }
        },
        {headers:{"Authorization": "Bot " + this.client.token,"Content-Type":"application/json"}})
      this.client.debug(res)
      }catch(e){
        this.client.debug(e)
      }
    }
  }
}

module.exports = Command;
