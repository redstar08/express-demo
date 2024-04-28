import { fileTypeFromFile } from "file-type"

console.log(await fileTypeFromFile("/Users/redstar/Downloads/we文件.webp"))
console.log(await fileTypeFromFile("/Users/redstar/Downloads/webp图片.webp"))
console.log(await fileTypeFromFile("/Users/redstar/Downloads/local-lotus-flower.jpg"))
