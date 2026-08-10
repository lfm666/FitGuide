# FitGuide

微信原生小程序版健身动作指南。

## 本地运行

1. 执行 `node scripts/sync-exercises.js`，从 `data/exercises.json` 生成小程序数据模块。
2. 使用微信开发者工具导入本目录。
3. 本地体验可使用当前测试 AppID；发布前请在 `project.config.json` 中换成正式 AppID。
4. 在微信公众平台把 `7072-prod-d4gi5hg2s057d6cfc-1466119943.tcb.qcloud.la` 配置为合法下载域名，并在发布检查时启用域名校验。

运行数据与筛选检查：

```powershell
node tests/exercises.test.js
node scripts/test-favorites.js
```

发布前检查全部远程图片和 GIF：

```powershell
node scripts/check-media.js
```

设计说明见 [`docs/design.md`](docs/design.md)。
