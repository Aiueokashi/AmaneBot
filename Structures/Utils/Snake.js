const Discord = require("discord.js");
const WIDTH = 15;
const HEIGHT = 10;
const gameBoard = [];
const apple = { x: 1, y: 1 };
function split(array, count) {
  const groups = [];
  for (let i = 0; i < array.length; i += count)
    groups.push(array.slice(i, i + count));

  return groups;
}

class SnakeGame {
  constructor(message) {
    this.message = message;
    this.snake = [{ x: 5, y: 5 }];
    this.snakeLength = 1;
    this.score = 0;
    this.gameEmbed = null;
    this.inGame = false;
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        gameBoard[y * WIDTH + x] = "π¦";
      }
    }
  }

  gameBoardToString() {
    let str = "";
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (x == apple.x && y == apple.y) {
          str += "π";
          continue;
        }

        let flag = true;
        for (let s = 0; s < this.snake.length; s++) {
          if (x == this.snake[s].x && y == this.snake[s].y) {
            str += "π©";
            flag = false;
          }
        }

        if (flag) str += gameBoard[y * WIDTH + x];
      }
      str += "\n";
    }
    return str;
  }

  isLocInSnake(pos) {
    const d = this.snake.find((sPos) => sPos.x == pos.x && sPos.y == pos.y);
    return d;
  }

  newAppleLoc() {
    let newApplePos = { x: 0, y: 0 };
    do {
      newApplePos = {
        x: parseInt(Math.random() * WIDTH),
        y: parseInt(Math.random() * HEIGHT),
      };
    } while (this.isLocInSnake(newApplePos));

    apple.x = newApplePos.x;
    apple.y = newApplePos.y;
  }

  newGame() {
    if (this.inGame) return;

    this.inGame = true;
    this.score = 0;
    this.snakeLength = 1;
    this.snake = [{ x: 5, y: 5 }];
    this.newAppleLoc();
    const embed = new Discord.MessageEmbed()
      .setColor("#03ad03")
      .setTitle("γγγ²γΌγ ")
      .setDescription(this.gameBoardToString())
      .setTimestamp();

    let array = [];
    const disabledButt = ["β¬", "disabled"];
    [
      disabledButt,
      ["β¬οΈ", "up"],
      disabledButt,
      ["β¬οΈ", "left"],
      ["β", "stop"],
      ["β‘οΈ", "right"],
      disabledButt,
      ["β¬οΈ", "down"],
      disabledButt,
    ].forEach((em) => {
      let button;
      if (em[0] == "β¬") {
        button = new Discord.MessageButton()
          .setStyle("SECONDARY")
          .setCustomID("noneRequired")
          .setEmoji("β¬")
          .setDisabled(true);
      } else if (em[0] == "β") {
        button = new Discord.MessageButton()
          .setStyle("DANGER")
          .setCustomID("stop")
          .setLabel("Stop.");
      } else {
        button = new Discord.MessageButton()
          .setStyle("PRIMARY")
          .setCustomID(em[1])
          .setEmoji(em[0]);
      }
      array.push(button);
    });
    array = split(array, 3);
    this.message.channel
      .send({ embeds: [embed], components: array })
      .then((emsg) => {
        this.gameEmbed = emsg;

        this.waitForReaction();
      });
  }

  step() {
    if (apple.x == this.snake[0].x && apple.y == this.snake[0].y) {
      this.score += 1;
      this.snakeLength++;
      this.newAppleLoc();
    }

    const editEmbed = new Discord.MessageEmbed()
      .setColor("#03ad03")
      .setTitle("γγγ²γΌγ ")
      .setDescription(this.gameBoardToString())
      .setTimestamp();
    this.gameEmbed.edit({ embeds: [editEmbed] });

    this.waitForReaction();
  }

  gameOver() {
    this.inGame = false;
    const embed = new Discord.MessageEmbed({
      title: "GAME OVER!",
      description: `γΉγ³γ’: \`${this.score}\``,
      footer: {
        name: this.message.member.displayName,
        iconURL: this.message.author.displayAvatarURL(),
      },
    });
    this.gameEmbed.edit({ embeds: [embed] });
  }

  waitForReaction() {
    const collector = this.gameEmbed.createMessageComponentInteractionCollector(
      {
        max: 1,
        idle: 60000,
        errors: ["time"],
      }
    );
    collector.on("collect", (collected) => {
      if (collected.user.id !== this.message.author.id)
        return collected.reply({
          content: "γγͺγγ―γγ?γγΌγγδ½Ώγγγ¨γ―γ§γγΎγγγ",
          ephemeral: true,
        });
      const snakeHead = this.snake[0];
      const nextPos = { x: snakeHead.x, y: snakeHead.y };
      if (collected.customID === "left") {
        let nextX = snakeHead.x - 1;
        if (nextX < 0) {
          collected.deferUpdate();
          return this.gameOver();
        }
        nextPos.x = nextX;
      } else if (collected.customID === "up") {
        let nextY = snakeHead.y - 1;
        if (nextY < 0) {
          collected.deferUpdate();
          return this.gameOver();
        }
        nextPos.y = nextY;
      } else if (collected.customID === "down") {
        let nextY = snakeHead.y + 1;
        if (nextY >= HEIGHT) {
          collected.deferUpdate();
          return this.gameOver();
        }
        nextPos.y = nextY;
      } else if (collected.customID === "right") {
        let nextX = snakeHead.x + 1;
        if (nextX >= WIDTH) {
          collected.deferUpdate();
          return this.gameOver();
        }
        nextPos.x = nextX;
      } else if (collected.customID === "stop") {
        collected.deferUpdate();
        return this.gameOver();
      }
      if (this.isLocInSnake(nextPos)) {
        this.gameOver();
        collected.deferUpdate();
      } else {
        collected.deferUpdate();
        this.snake.unshift(nextPos);
        if (this.snake.length > this.snakeLength) this.snake.pop();

        this.step();
      }
    });
    collector.on("end", (x) => {
      if (x.size && x.size == 0) {
        this.message.channel.send("γ¨γ©γΌγηΊηγγΎγγγ");
        this.gameOver();
      }
    });
  }
}

module.exports = SnakeGame;
