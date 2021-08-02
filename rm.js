const fs = require("fs");
const path = "./Structures/Command/CommandUtil.js";
const str = fs.readFileSync(path, "UTF-8");

fs.writeFileSync(
  "out.js",
  str.replace(/(\/\*)[^\/]*(\*\/)/gm, "").replace(/\/\/[^\n]*/gm, "")
);
