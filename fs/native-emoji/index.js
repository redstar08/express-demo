const fs = require("fs-extra")

const nativeJson = fs.readFileSync("src/native.json", { encoding: "utf8" })

const nativeMap = JSON.parse(nativeJson)

const pickCategoriesKeys = ["people"]

const _emojis = {}

const _categories = nativeMap.categories.filter((item) => {
  const { id, emojis } = item
  if (pickCategoriesKeys.includes(id)) {
    emojis.forEach((key) => {
      _emojis[key] = nativeMap.emojis[key]
    })
  }

  return pickCategoriesKeys.includes(id)
})

console.log(Object.keys(_emojis).length)

fs.writeFileSync(
  "src/data.json",
  JSON.stringify({
    ...nativeMap,
    categories: _categories,
    emojis: _emojis,
  }),
  { encoding: "utf8" }
)
