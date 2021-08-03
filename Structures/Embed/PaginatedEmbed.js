const {
  MessageActionRow,
  Message,
  MessageEmbed,
  MessageButton,
} = require("okashidjs");

const PaginatedEmbed = async (msg, pages, buttonList, timeout = 120000) => {
  if (!msg && !msg.channel) throw new Error("チャンネルがありません");
  if (!pages) throw new Error("1ページ以上指定してください");
  if (!buttonList) throw new Error("ボタンを指定してください");
  if (buttonList[0].style === "LINK" || buttonList[1].style === "LINK")
    throw new Error("リンクボタンは使用できません");
  if (buttonList.length !== 2) throw new Error("指定できるボタンは2つまでです");

  let page = 0;

  const row = new MessageActionRow().addComponents(buttonList);
  if (!msg instanceof MessageEmbed) {
    msg.reply(msg.client.getEmoji("atlanta_loading"));
  }
  if(msg.commandName){
    return msg.reply(
      {embeds:pages,
    ephemeral: true})
  }
  const curPage = msg.reply({
      embeds: [pages[page].setFooter(`Page ${page + 1} / ${pages.length}`)],
      components: [row],
    })
    .then((curPage) => {
      async function edit() {
        curPage.edit({
          embeds: [pages[page].setFooter(`Page ${page + 1} / ${pages.length}`)],
          components: [row],
        })
      }

      const filter = (m) => (m.user.id === msg.author?.id ?? msg.user.id) && (buttonList[0].customID === m.customID || buttonList[1].customID === m.customID)

      const collector = msg.channel.createMessageComponentCollector({
        filter,
        time: timeout,
      });

      collector.on("collect", async (i) => {
        i.deferUpdate();
        switch (i.customID) {
          case buttonList[0].customID:
            page = page > 0 ? --page : pages.length - 1;
            edit();
            break;
          case buttonList[1].customID:
            page = page + 1 < pages.length ? ++page : 0;
            edit();
            break;
          default:
            break;
        }
      });

      collector.on("end", () => {
        try{
          const disabledRow = new MessageActionRow().addComponents(
            buttonList[0].setDisabled(true),
            buttonList[1].setDisabled(true)
          );
          curPage.edit({
            embeds: [
              pages[page].setFooter(`Page ${page + 1} / ${pages.length}`),
            ],
            components: [disabledRow],
          });
        }catch(e){
          console.log(e);
        }
      });

      return curPage;
    });
};
module.exports = PaginatedEmbed;
