const Command = require("../../Structures/Command"); //コマンドクラス
const { MessageEmbed } = require("discord.js"); //MessageEmbed

class Template extends Command {
  //Commandクラスを拡張してTemplateクラスをつくる(nameの先頭を大文字にしたクラス名にするとわかりやすい)
  constructor(client) {
    //コマンドハンドラで読み込むための処理
    super(client, {
      //上に同じく
      name: "template", //コマンドの名前、
      aliases: ["temp"], //上の名前の代わりにこれを使ってもコマンドが実行される
      description: "argsに入っている文字列を送信します", //説明、helpコマンドに出てくる
      usage: "template [message]", //使い方(prefixを除いて書く)
      example: ["aaaaa", "ああああ"], //下の、argsがtrueになっているのに、コマンドに引数がないとコマンドが実行されず、ここに書いてある具体例が送信される
      args: true, //trueにするとコマンドに引数がなかった場合、実行されず代わりに上のusageとexampleが送信される。
      disable: false, //このコマンドが使用可能か(trueにすると実行されず、helpでメンテナンス中と表示される)
      category: "テンプレート", //特に意味はない、できればフォルダの日本語訳で
      cooldown: 10000, //再使用できるようになるまでのクールダウン単位はms
      permLevel: 0, //特に意味はない、コマンド実行に必要な権限を1~10で可視化したもの(後々内部処理も実装する予定)
      userPerms: ["ADMINISTRATOR"], //ここにこのコマンドを実行するのに必要な権限を入れる(必要ない場合は書かなくていい)
      botPerms: [], //botに必要な権限を入れる(デフォルトでSEND_MESSAGESが入っているのでそれ以外にいらない場合は書かなくていい)
      ownerOnly: false, //tureにするとbotオーナーしか使えなくなり、helpコマンドから消える(オーナーID配列は./config.jsのMaster。自分で追加してね！)
      guildOnly: true, //trueにするとDMだと反応しない
      nsfw: false //trueにするとnsfwのみでしか使えなくなる。
    });
  }

  async run(message, [...args]) {
    //ここに実行する処理(ここから先はふつうにコマンド作るときと同じ)
    const client = this.client; //clientを使いたい場合
    super.respond(args.join(" ")); //super.respond(送信したい内容)で送信できる。
  }
}

module.exports = Template; //!!!!!!!!!これ絶対must忘れないように!!!!