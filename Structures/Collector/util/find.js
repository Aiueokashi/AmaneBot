const { isArray } = require("util");

function findRecursively({
  obj,
  key,
  value = null,
  type = "array" | "value" | "object",
  result = []
}) {
  for (const k in obj) {
    if (obj[k] instanceof Object) {
      findRecursively({
        obj: obj[k],
        key,
        type,
        result,
        value
      });
    }
  }
  if (obj && obj[key]) {
    if (type === "array" && isArray(obj[key])) result.push(...obj[key]);
    else if (type === "object") {
      if (!value || obj[key] === value) result.push(obj);
    } else result.push(obj[key]);
  }
  return result;
}

module.exports = {
  findRecursively
};
