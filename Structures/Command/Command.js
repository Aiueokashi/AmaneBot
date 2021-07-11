const AmaneError = require('../Extender/Error');
const AmaneModule = require('../AmaneModule');
const Argument = require('./Argument/Argument');
const ArgumentRunner = require('./Argument/ArgumentRunner');
const ContentParser = require('./ContentParser');

class Command extends AmaneModule {
    constructor(id, options = {}) {
        super(id, { category: options.category });

        const {
            aliases = [],
            args = this.args || [],
            quoted = true,
            separator,
            channel = null,
            ownerOnly = false,
            editable = true,
            typing = false,
            cooldown = null,
            ratelimit = 1,
            argumentDefaults = {},
            description = '',
            prefix = this.prefix,
            clientPermissions = this.clientPermissions,
            userPermissions = this.userPermissions,
            regex = this.regex,
            condition = this.condition || (() => false),
            before = this.before || (() => undefined),
            lock,
            ignoreCooldown,
            ignorePermissions,
            flags = [],
            optionFlags = []
        } = options;

        
        this.aliases = aliases;

        const { flagWords, optionFlagWords } = Array.isArray(args)
            ? ContentParser.getFlags(args)
            : { flagWords: flags, optionFlagWords: optionFlags };

        this.contentParser = new ContentParser({
            flagWords,
            optionFlagWords,
            quoted,
            separator
        });

        this.argumentRunner = new ArgumentRunner(this);
        this.argumentGenerator = Array.isArray(args)
            ? ArgumentRunner.fromArguments(args.map(arg => [arg.id, new Argument(this, arg)]))
            : args.bind(this);

        
        this.channel = channel;

        
        this.ownerOnly = Boolean(ownerOnly);

        
        this.editable = Boolean(editable);

        
        this.typing = Boolean(typing);

        
        this.cooldown = cooldown;

        
        this.ratelimit = ratelimit;

        
        this.argumentDefaults = argumentDefaults;

        
        this.description = Array.isArray(description) ? description.join('\n') : description;

        
        this.prefix = typeof prefix === 'function' ? prefix.bind(this) : prefix;

        
        this.clientPermissions = typeof clientPermissions === 'function' ? clientPermissions.bind(this) : clientPermissions;

        
        this.userPermissions = typeof userPermissions === 'function' ? userPermissions.bind(this) : userPermissions;

        
        this.regex = typeof regex === 'function' ? regex.bind(this) : regex;

        
        this.condition = condition.bind(this);

        
        this.before = before.bind(this);

        
        this.lock = lock;

        if (typeof lock === 'string') {
            this.lock = {
                guild: message => message.guild && message.guild.id,
                channel: message => message.channel.id,
                user: message => message.author.id
            }[lock];
        }

        if (this.lock) {
            
            this.locker = new Set();
        }

        
        this.ignoreCooldown = typeof ignoreCooldown === 'function' ? ignoreCooldown.bind(this) : ignoreCooldown;

        
        this.ignorePermissions = typeof ignorePermissions === 'function' ? ignorePermissions.bind(this) : ignorePermissions;

        

        
    }

    
    exec() {
        throw new AmaneError('NOT_IMPLEMENTED', this.constructor.name, 'exec');
    }

    
    parse(message, content) {
        const parsed = this.contentParser.parse(content);
        return this.argumentRunner.run(message, parsed, this.argumentGenerator);
    }

    

    
}

module.exports = Command;