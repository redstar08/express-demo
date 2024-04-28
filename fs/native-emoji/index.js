const path = require("path")
const fs = require("fs-extra")

const nativeJson = fs.readFileSync(path.join(__dirname, "./native.json"), { encoding: "utf8" })

const nativeMap = JSON.parse(nativeJson)

const pickCategoriesKeys = ["people"]

const _emojis = {}

const emojiArray = []

const _categories = nativeMap.categories.filter((item) => {
  const { id, emojis } = item
  if (pickCategoriesKeys.includes(id)) {
    emojis.forEach((key) => {
      const { name, skins } = nativeMap.emojis[key]
      emojiArray.push({ key, name, ...skins[0] }) 
    })
  }

  return pickCategoriesKeys.includes(id)
})

console.log(Object.keys(_emojis).length)

fs.writeFileSync(
  path.join(__dirname, "./emoji-data.json"),
  JSON.stringify({
    emojis: emojiArray,
  }),
  { encoding: "utf8" }
)
