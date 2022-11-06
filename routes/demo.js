// 引入 express 框架
const express = require("express")
// 创建 express 路由
const demo = express.Router()

demo.post("/ping", async (req, res) => {
  // 验证请求参数
  // 返回数据
  res.sendResult({ msg: "ok" }, 200, "ok")
})

module.exports = demo
