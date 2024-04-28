const multiparty = require("multiparty")
const fse = require("fs-extra")
const path = require("path")
const UPLOAD_DIR = path.resolve(__dirname, "..", "upload")

// 引入 express 框架
const express = require("express")
// 创建 express 路由
const api = express.Router()

const execExtName = (fileName) => {
  return /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gim.exec(fileName)[0]
}

const pipeStream = (path, writeStream) => {
  return new Promise((resolve) => {
    // 创建可读流
    const readStream = fse.createReadStream(path)
    readStream.on("end", async () => {
      await fse.unlinkSync(path)
      resolve(path)
    })
    readStream.pipe(writeStream)
  })
}

const mergeFileChunk = async (filePath, fileHash, chunkSize) => {
  try {
    const chunkDir = path.resolve(UPLOAD_DIR, fileHash)
    // 读取目录下的临时文件
    const chunkPaths = fse.readdirSync(chunkDir)
    chunkPaths.sort((a, b) => a.split("-")[1] - b.split("-")[1])
    // console.log("chunkPaths -> ", chunkPaths)
    const res = chunkPaths.map((chunkName, index) => {
      const chunkPath = path.resolve(chunkDir, chunkName)
      const writeStream = fse.createWriteStream(filePath, {
        start: index * chunkSize,
        end: (index + 1) * chunkSize,
      })
      return pipeStream(chunkPath, writeStream)
    })

    await Promise.all(res)
    // 文件合并后删除保存切片的目录
    fse.rmdirSync(chunkDir)
  } catch (error) {
    console.log(error)
  }
}

api.post("/verifyUpload", async (req, res) => {
  const { name, size, type, hash, chunkSize } = req.body
  const chunkDir = path.resolve(UPLOAD_DIR, hash)
  const filePath = path.resolve(UPLOAD_DIR, `${hash}${execExtName(name)}`)
  const isExistFile = fse.existsSync(filePath)
  const isExistFileDir = fse.existsSync(chunkDir)
  let existChunks = []

  if (!isExistFile && isExistFileDir) {
    // 读取目录下的临时文件
    existChunks = fse.readdirSync(chunkDir)
  }

  // console.log("verifyUpload -> ", { filePath, isExistFile, isExistFileDir, existChunks })

  const data = {
    shouldUpload: !isExistFile,
    name,
    size,
    type,
    hash,
    chunkSize,
    percents: 100,
    url: isExistFile ? "http://localhost:3000/assets/" + `${hash}${execExtName(name)}` : null,
    existChunks,
  }

  res.status(200).json({
    ok: true,
    data,
    msg: "ok",
  })
})

// 所有上传的文件存放到该目录下
api.post("/upload", async (req, res) => {
  const form = new multiparty.Form()

  form.parse(req, function (err, fields, files) {
    try {
      // console.log("fields, files", fields, files)
      const fileName = fields["fileName"][0]
      const fileSize = fields["fileSize"][0]
      const fileHash = fields["fileHash"][0]
      const chunkSize = fields["chunkSize"][0]
      const chunkHash = fields["chunkHash"][0]

      // // 存储切片的临时文件夹
      const chunkDir = path.resolve(UPLOAD_DIR, fileHash)

      // // 切片目录不存在，则创建切片目录
      if (!fse.existsSync(chunkDir)) {
        fse.mkdirsSync(chunkDir)
      }

      const existChunks = fse.readdirSync(chunkDir)
      const percents = existChunks.length / Math.ceil(fileSize / chunkSize)

      const tempPath = files.chunk[0].path
      const uploadPath = path.resolve(chunkDir, chunkHash)
      // // 把文件切片移动到我们的切片文件夹中
      if (!fse.existsSync(uploadPath)) {
        fse.moveSync(tempPath, uploadPath)
      }

      res.status(200).json({
        ok: true,
        data: {
          fileName,
          fileHash,
          chunkHash,
          percents: percents.toFixed(2) * 100,
        },
        msg: "received file chunk",
      })
    } catch (error) {
      res.status(401).json({
        ok: false,
        msg: "上传失败",
      })
    }
  })
})

api.post("/merge", async (req, res) => {
  const { name, size, type, hash, chunkSize } = req.body

  const chunkDir = path.resolve(UPLOAD_DIR, hash)
  const filePath = path.resolve(UPLOAD_DIR, `${hash}${execExtName(name)}`)
  console.log("merge -> ", { name, size, type, hash, chunkSize, chunkDir, filePath })
  // 不存在文件 开始合并
  if (!fse.existsSync(filePath)) {
    // 如果不存在目录报错
    if (!fse.existsSync(chunkDir)) {
      res.status(200).json({
        ok: false,
        msg: "合并失败，请重新上传",
      })
      return
    }
    await mergeFileChunk(filePath, hash, chunkSize)
  }

  res.status(200).json({
    ok: true,
    data: {
      name,
      size,
      type,
      hash,
      chunkSize,
      percents: 100,
      url: "http://localhost:3000/assets/" + `${hash}${execExtName(name)}`,
    },
    msg: "merge file ok",
  })
})

module.exports = api
