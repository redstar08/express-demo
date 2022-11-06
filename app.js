// 引入express框架
const express = require("express")
const path = require("path")

// 创建web服务器
const app = express()

// post 请求体解析
const bodyParser = require("body-parser")
// 配置bodyParser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.get("/", async (req, res, next) => {
  if (req.query.localMock) {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>QA</title>
      </head>
      <body>
        <script >
          function demo() {
            fetch('${req.query.localMock}').then((res) => {
              res.text().then((text)=>{
                document.open()
                document.write(text)
                document.close()
              })
        
            })
          }
          demo()
    
        </script>
      </body>
    </html>
    
    `
    res.type("html")
    res.send(html)
    return
  }
  next()
})
// 配置静态托管
app.use(express.static(path.join(__dirname, "/public")))

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

// --------------------路由模块开始--------------------
// demo模块
const demo = require("./routes/demo")
app.use("/demo", demo)

// 处理无效路由 Not Found
app.use((req, res) => {
  res.sendResult(null, 404, "Not Found")
})

// 监听端口
app.listen(3001)
// 控制台提示输出
console.log("server is runing at localhost:" + 3001)
