const moment = require("moment");
require("moment-timezone");
const chalk = require("chalk");

//console.logの先頭にtimestampをつける。
var oldConsole = console.log;
console.log = function () {
  var timestamp =
    "[" + moment().tz("Asia/Tokyo").format("YYYY/MM/DD HH:mm:ss") + "] ";
  Array.prototype.unshift.call(arguments, chalk.bold(timestamp));
  oldConsole.apply(this, arguments);
};
