const { ArgumentMatches, ArgumentTypes } = require("../Constants"),
  Flag = require("../Flag"),
  { choice, intoCallable, isPromise } = require("../../Utils/Util");

class Argument {
  constructor(
    command,
    {
      match = ArgumentMatches.PHRASE,
      type = ArgumentTypes.STRING,
      flag = null,
      multipleFlags = false,
      index = null,
      unordered = false,
      limit = Infinity,
      prompt = null,
      default: defaultValue = null,
      otherwise = null,
      modifyOtherwise = null,
    } = {}
  ) {
    this.command = command;

    this.match = match;

    this.type = typeof type === "function" ? type.bind(this) : type;

    this.flag = flag;

    this.multipleFlags = multipleFlags;

    this.index = index;

    this.unordered = unordered;

    this.limit = limit;

    this.prompt = prompt;

    this.default =
      typeof defaultValue === "function"
        ? defaultValue.bind(this)
        : defaultValue;

    this.otherwise =
      typeof otherwise === "function" ? otherwise.bind(this) : otherwise;

    this.modifyOtherwise = modifyOtherwise;
  }

  get client() {
    return this.command.client;
  }

  async process(message, phrase) {
    const commandDefs = this.command.argumentDefaults;
    const optional = choice(
      this.prompt && this.prompt.optional,
      commandDefs.prompt && commandDefs.prompt.optional
    );

    const doOtherwise = async (failure) => {
      const otherwise = choice(this.otherwise, commandDefs.otherwise);

      const modifyOtherwise = choice(
        this.modifyOtherwise,
        commandDefs.modifyOtherwise
      );

      let text = await intoCallable(otherwise).call(this, message, {
        phrase,
        failure,
      });
      if (Array.isArray(text)) {
        text = text.join("\n");
      }

      if (modifyOtherwise) {
        text = await modifyOtherwise.call(this, message, text, {
          phrase,
          failure,
        });
        if (Array.isArray(text)) {
          text = text.join("\n");
        }
      }

      if (text) {
        const sent = await message.channel.send(text);
        if (message.util) message.util.addMessage(sent);
      }

      return Flag.cancel();
    };

    if (!phrase && optional) {
      if (this.otherwise != null) {
        return doOtherwise(null);
      }

      return intoCallable(this.default)(message, { phrase, failure: null });
    }

    const res = await this.cast(message, phrase);
    if (Argument.isFailure(res)) {
      if (this.otherwise != null) {
        return doOtherwise(res);
      }

      if (this.prompt != null) {
        return this.collect(message, phrase, res);
      }

      return this.default == null
        ? res
        : intoCallable(this.default)(message, { phrase, failure: res });
    }

    return res;
  }

  cast(message, phrase) {
    return Argument.cast(this.type, this.command.resolver, message, phrase);
  }

  async collect(message, commandInput = "", parsedInput = null) {
    const promptOptions = {};
    Object.assign(promptOptions, this.command.argumentDefaults.prompt);
    Object.assign(promptOptions, this.prompt || {});

    const isInfinite =
      promptOptions.infinite ||
      (this.match === ArgumentMatches.SEPARATE && !commandInput);
    const additionalRetry = Number(Boolean(commandInput));
    const values = isInfinite ? [] : null;

    const getText = async (
      promptType,
      prompter,
      retryCount,
      inputMessage,
      inputPhrase,
      inputParsed
    ) => {
      let text = await intoCallable(prompter).call(this, message, {
        retries: retryCount,
        infinite: isInfinite,
        message: inputMessage,
        phrase: inputPhrase,
        failure: inputParsed,
      });

      if (Array.isArray(text)) {
        text = text.join("\n");
      }

      const modifier = {
        start: promptOptions.modifyStart,
        retry: promptOptions.modifyRetry,
        timeout: promptOptions.modifyTimeout,
        ended: promptOptions.modifyEnded,
        cancel: promptOptions.modifyCancel,
      }[promptType];

      if (modifier) {
        text = await modifier.call(this, message, text, {
          retries: retryCount,
          infinite: isInfinite,
          message: inputMessage,
          phrase: inputPhrase,
          failure: inputParsed,
        });

        if (Array.isArray(text)) {
          text = text.join("\n");
        }
      }

      return text;
    };

    const promptOne = async (
      prevMessage,
      prevInput,
      prevParsed,
      retryCount
    ) => {
      let sentStart;

      if (retryCount !== 1 || !isInfinite || !values.length) {
        const promptType = retryCount === 1 ? "start" : "retry";
        const prompter =
          retryCount === 1 ? promptOptions.start : promptOptions.retry;
        const startText = await getText(
          promptType,
          prompter,
          retryCount,
          prevMessage,
          prevInput,
          prevParsed
        );

        if (startText) {
          sentStart = await (message.util || message.channel).send(startText);
          if (message.util) {
            message.util.setEditable(false);
            message.util.setLastResponse(sentStart);
            message.util.addMessage(sentStart);
          }
        }
      }

      let input;
      try {
        input = (
          await message.channel.awaitMessages({
            filter: (m) => m.author.id === message.author.id,
            max: 1,
            time: promptOptions.time,
            errors: ["time"],
          })
        ).first();

        if (message.util) message.util.addMessage(input);
      } catch (err) {
        const timeoutText = await getText(
          "timeout",
          promptOptions.timeout,
          retryCount,
          prevMessage,
          prevInput,
          ""
        );
        if (timeoutText) {
          const sentTimeout = await message.channel.send(timeoutText);
          if (message.util) message.util.addMessage(sentTimeout);
        }

        return Flag.cancel();
      }

      if (promptOptions.breakout) {
        const looksLike = await this.parseCommand(input);
        if (looksLike && looksLike.command) return Flag.retry(input);
      }

      if (
        input.content.toLowerCase() === promptOptions.cancelWord.toLowerCase()
      ) {
        const cancelText = await getText(
          "cancel",
          promptOptions.cancel,
          retryCount,
          input,
          input.content,
          "cancel"
        );
        if (cancelText) {
          const sentCancel = await message.channel.send(cancelText);
          if (message.util) message.util.addMessage(sentCancel);
        }

        return Flag.cancel();
      }

      if (
        isInfinite &&
        input.content.toLowerCase() === promptOptions.stopWord.toLowerCase()
      ) {
        if (!values.length)
          return promptOne(input, input.content, null, retryCount + 1);
        return values;
      }

      const parsedValue = await this.cast(input, input.content);
      if (Argument.isFailure(parsedValue)) {
        if (retryCount <= promptOptions.retries) {
          return promptOne(input, input.content, parsedValue, retryCount + 1);
        }

        const endedText = await getText(
          "ended",
          promptOptions.ended,
          retryCount,
          input,
          input.content,
          "stop"
        );
        if (endedText) {
          const sentEnded = await message.channel.send(endedText);
          if (message.util) message.util.addMessage(sentEnded);
        }

        return Flag.cancel();
      }

      if (isInfinite) {
        values.push(parsedValue);
        const limit = promptOptions.limit;
        if (values.length < limit)
          return promptOne(message, input.content, parsedValue, 1);

        return values;
      }

      return parsedValue;
    };

    this.handler.addPrompt(message.channel, message.author);
    const returnValue = await promptOne(
      message,
      commandInput,
      parsedInput,
      1 + additionalRetry
    );
    if (this.handler.commandUtil) {
      message.util.setEditable(false);
    }

    this.handler.removePrompt(message.channel, message.author);
    return returnValue;
  }

  static async cast(type, resolver, message, phrase) {
    if (Array.isArray(type)) {
      for (const entry of type) {
        if (Array.isArray(entry)) {
          if (entry.some((t) => t.toLowerCase() === phrase.toLowerCase())) {
            return entry[0];
          }
        } else if (entry.toLowerCase() === phrase.toLowerCase()) {
          return entry;
        }
      }

      return null;
    }

    if (typeof type === "function") {
      let res = type(message, phrase);
      if (isPromise(res)) res = await res;
      return res;
    }

    if (type instanceof RegExp) {
      const match = phrase.match(type);
      if (!match) return null;

      const matches = [];

      if (type.global) {
        let matched;

        while ((matched = type.exec(phrase)) != null) {
          matches.push(matched);
        }
      }

      return { match, matches };
    }

    if (resolver.type(type)) {
      let res = resolver.type(type).call(this, message, phrase);
      if (isPromise(res)) res = await res;
      return res;
    }

    return phrase || null;
  }

  static union(...types) {
    return async function typeFn(message, phrase) {
      for (let entry of types) {
        if (typeof entry === "function") entry = entry.bind(this);
        const res = await Argument.cast(
          entry,
          this.handler.resolver,
          message,
          phrase
        );
        if (!Argument.isFailure(res)) return res;
      }

      return null;
    };
  }

  static product(...types) {
    return async function typeFn(message, phrase) {
      const results = [];
      for (let entry of types) {
        if (typeof entry === "function") entry = entry.bind(this);
        const res = await Argument.cast(
          entry,
          this.handler.resolver,
          message,
          phrase
        );
        if (Argument.isFailure(res)) return res;
        results.push(res);
      }

      return results;
    };
  }

  static validate(type, predicate) {
    return async function typeFn(message, phrase) {
      if (typeof type === "function") type = type.bind(this);
      const res = await Argument.cast(
        type,
        this.handler.resolver,
        message,
        phrase
      );
      if (Argument.isFailure(res)) return res;
      if (!predicate.call(this, message, phrase, res)) return null;
      return res;
    };
  }

  static range(type, min, max, inclusive = false) {
    return Argument.validate(type, (msg, p, x) => {
      const o =
        typeof x === "number" || typeof x === "bigint"
          ? x
          : x.length != null
          ? x.length
          : x.size != null
          ? x.size
          : x;

      return o >= min && (inclusive ? o <= max : o < max);
    });
  }

  static compose(...types) {
    return async function typeFn(message, phrase) {
      let acc = phrase;
      for (let entry of types) {
        if (typeof entry === "function") entry = entry.bind(this);
        acc = await Argument.cast(entry, this.handler.resolver, message, acc);
        if (Argument.isFailure(acc)) return acc;
      }

      return acc;
    };
  }

  static composeWithFailure(...types) {
    return async function typeFn(message, phrase) {
      let acc = phrase;
      for (let entry of types) {
        if (typeof entry === "function") entry = entry.bind(this);
        acc = await Argument.cast(entry, this.handler.resolver, message, acc);
      }

      return acc;
    };
  }

  static withInput(type) {
    return async function typeFn(message, phrase) {
      if (typeof type === "function") type = type.bind(this);
      const res = await Argument.cast(
        type,
        this.handler.resolver,
        message,
        phrase
      );
      if (Argument.isFailure(res)) {
        return Flag.fail({ input: phrase, value: res });
      }

      return { input: phrase, value: res };
    };
  }

  static tagged(type, tag = type) {
    async function typeFn(message, phrase) {
      if (typeof type === "function") type = type.bind(this);
      const res = await Argument.cast(
        type,
        this.handler.resolver,
        message,
        phrase
      );
      if (Argument.isFailure(res)) {
        return Flag.fail({ tag, value: res });
      }

      return { tag, value: res };
    }

    return typeof this === "undefined" ? typeFn : typeFn.bind(this);
  }

  static taggedWithInput(type, tag = type) {
    return async function typeFn(message, phrase) {
      if (typeof type === "function") type = type.bind(this);
      const res = await Argument.cast(
        type,
        this.handler.resolver,
        message,
        phrase
      );
      if (Argument.isFailure(res)) {
        return Flag.fail({ tag, input: phrase, value: res });
      }

      return { tag, input: phrase, value: res };
    };
  }

  static taggedUnion(...types) {
    return async function typeFn(message, phrase) {
      for (let entry of types) {
        entry = Argument.tagged.bind(this)(entry);
        const res = await Argument.cast(
          entry,
          this.handler.resolver,
          message,
          phrase
        );
        if (!Argument.isFailure(res)) return res;
      }

      return null;
    };
  }

  static isFailure(value) {
    return value == null || Flag.is(value, "fail");
  }
}

module.exports = Argument;
