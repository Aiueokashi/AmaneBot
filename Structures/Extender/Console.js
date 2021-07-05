const moment = require("moment");
require("moment-timezone");
const chalk = require("chalk");
const config = require("../../config.js");

//console.logの先頭にtimestampをつける。
let oldConsole = console.log;
console.log = function () {
  let timestamp =
    "[" + moment().tz("Asia/Tokyo").format("YYYY/MM/DD HH:mm:ss") + "] ";
  Array.prototype.unshift.call(arguments, chalk.bold(timestamp));
  oldConsole.apply(this, arguments);
};
if (config.debug) {
  console.debug = console.log;
  console.log = function () {};
}
