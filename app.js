// 引入express框架
const express = require("express")
const { createServer } = require("http")
const { Server: SocketServer } = require("socket.io")
const path = require("path")
// const { expressMiddleware } = require("local-mock-middleware")
// 创建web服务器
const app = express()

//#region
// post 请求体解析
const bodyParser = require("body-parser")
// 配置bodyParser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// app.use(expressMiddleware())
// 配置静态托管
app.use(express.static(path.join(__dirname, "/public")))
app.use("/assets", express.static(path.join(__dirname, "/upload")))

// ------------配置统一返回的json数据格式---------------
app.use((req, res, next) => {
  res.sendResult = (data, status, msg) => {
    res.json({ data: data, meta: { status: status, msg: msg } })
  }
  next()
})
// ------------配置统一的无效请求---------------
app.use((req, res, next) => {
  res.badRequest = (msg) => {
    res.json({ data: null, meta: { status: 401, msg: msg } })
  }
  next()
})
// ------------配置跨域和响应的数据格式------------------
app.all("/*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length,Authorization,Origin,Accept,X-Requested-With")
  res.setHeader("Content-Type", "application/json;charset=utf-8")
  // 让options请求快速返回
  if (req.method == "OPTIONS") res.sendResult(null, 200, "ok")
  else next()
})
//#endregion

// --------------------路由模块开始--------------------
// demo模块
const demo = require("./routes/demo")
app.use("/demo", demo)

// demo模块
const api = require("./routes/api")
app.use("/api", api)

// 处理无效路由 Not Found
app.use((req, res) => {
  res.sendResult(null, 404, "Not Found")
})

// 控制台提示输出

const httpServer = createServer(app)

const io = new SocketServer(httpServer, {
  /* options */
})

io.on("connection", (socket) => {
  // ...
  console.log("connection -> ok: ", socket.id)
})

// 监听端口
httpServer.listen(3000)

console.log("server is runing at localhost:" + 3000)
