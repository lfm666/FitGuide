<div align="center">

# FitGuide

**面向健身新手的微信动作指南：查动作、看演示、存收藏。**

<p>
  <img src="https://img.shields.io/badge/WeChat-Mini_Program-07C160?logo=wechat&logoColor=white" alt="WeChat Mini Program">
  <img src="https://img.shields.io/badge/Exercises-1324-C7F24A" alt="1324 exercises">
  <img src="https://img.shields.io/badge/Data-Local-123B31" alt="Local exercise data">
  <img src="https://img.shields.io/badge/Backend-Spring_Boot_3.5-6DB33F?logo=springboot&logoColor=white" alt="Spring Boot 3.5">
</p>

</div>

## 项目简介

FitGuide 包含微信原生小程序和 Spring Boot 后端。小程序内置 **1324 条中文动作数据**，覆盖 **10 个训练部位**和 **28 种器械**，支持搜索、组合筛选、动作详情、静态图与 GIF 演示；后端通过微信云托管提供跨设备收藏。

动作目录已由远程 API 改为本地静态数据，列表、筛选和详情无需请求后端；只有收藏功能依赖云托管服务。动作数据位于 `fit-guide-miniprogram/data/exercises.json`，运行时直接加载生成的 `exercises.js`。

> [!IMPORTANT]
> 小程序中的动作数据与媒体来源于开源项目 [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)。来源项目的代码与数据采用 MIT License；图片、GIF 等媒体资源版权归 [GymVisual](https://gymvisual.com/) 所有，不属于 MIT 授权范围。

## 应用截图

<table>
  <tr>
    <th align="center">动作库</th>
    <th align="center">我的收藏</th>
  </tr>
  <tr>
    <td><img src="screenshots/action-library.jpg" alt="FitGuide 动作库页面" width="420"></td>
    <td><img src="screenshots/favorites.jpg" alt="FitGuide 收藏页面" width="420"></td>
  </tr>
</table>

## 主要功能

- 按动作名称、器械和肌群搜索。
- 按训练部位与器械组合筛选。
- 查看主要肌群、次要肌群、动作步骤、静态图和 GIF 演示。
- GIF 加载失败时保留静态图，并支持重试。
- 动作目录随小程序本地加载，不依赖目录 API。
- 使用微信 OpenID 将收藏保存到 MySQL，并迁移旧版本地收藏。
- 处理无结果、无效动作、媒体失败和服务异常状态。

## 技术栈

| 模块 | 技术与职责 |
| --- | --- |
| 小程序 | 微信原生小程序、WXML、WXSS、JavaScript（CommonJS） |
| 动作目录 | 本地 JSON / CommonJS，共 1324 条动作 |
| 动作媒体 | 对象存储 HTTPS 地址；同时兼容 CloudBase `cloud://` fileID |
| 收藏服务 | 微信云托管、OpenID、Spring Boot、MyBatis-Plus、MySQL |
| 后端环境 | JDK 21、Spring Boot 3.5、MySQL 5.7 |
| 接口文档 | SpringDoc OpenAPI / Swagger UI |

## 快速开始

### 运行小程序

环境要求：

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 一个可用的小程序 AppID

```bash
git clone https://github.com/lfm666/FitGuide.git
cd FitGuide
```

在微信开发者工具中导入 `fit-guide-miniprogram` 目录并编译即可。项目没有 npm 依赖，不需要执行 `npm install`。

如需使用云端收藏，还需：

1. 在 `fit-guide-miniprogram/utils/api.js` 中填写自己的 CloudBase 环境 ID 和云托管服务名。
2. 部署后端并初始化 MySQL。
3. 确保请求由 `wx.cloud.callContainer` 发出，以便云托管注入 `X-WX-OPENID`。
4. 在微信公众平台配置动作媒体所在的合法下载域名。

### 运行后端

创建 `fit_guide` 数据库，在空库中执行 `fit-guide-backend/sql/init.sql`，然后启动服务：

```powershell
cd fit-guide-backend
$env:MYSQL_ADDRESS='localhost:3306'
$env:MYSQL_USERNAME='root'
$env:MYSQL_PASSWORD='your-password'
mvn spring-boot:run
```

服务默认监听 `http://localhost:19000`，Swagger UI 位于 `http://localhost:19000/swagger-ui.html`。小程序当前使用以下收藏接口：

| 接口 | 说明 |
| --- | --- |
| `GET /api/v1/favorites` | 获取当前用户收藏的动作 ID |
| `PUT /api/v1/favorites/{id}` | 收藏动作 |
| `DELETE /api/v1/favorites/{id}` | 取消收藏 |

已有数据库若仍保留收藏与动作表的外键，请执行 `fit-guide-backend/sql/migrate-favorites-without-exercise.sql`。更多说明见 [`fit-guide-backend/README.md`](fit-guide-backend/README.md)。

## 动作数据

### 数据流

```text
assets/exercises-dataset/data/exercises.json
                │ 中文字段构建
                ▼
assets/exercises-dataset/data/exercises-zh.json
                │ 复制为小程序数据源
                ▼
fit-guide-miniprogram/data/exercises.json
                │ sync-exercises.js 校验并生成
                ▼
fit-guide-miniprogram/data/exercises.js
```

当前数据规模：

| 内容 | 数量 |
| --- | ---: |
| 动作 | 1324 |
| 训练部位 | 10 |
| 器械 | 28 |
| JPG 图片 | 1324 |
| GIF 演示 | 1324 |

更新源数据后的构建命令：

```powershell
node assets/exercises-dataset/scripts/build-exercises-zh.mjs
Copy-Item assets/exercises-dataset/data/exercises-zh.json fit-guide-miniprogram/data/exercises.json
Set-Location fit-guide-miniprogram
node scripts/sync-exercises.js
```

`build-exercises-zh.mjs` 会映射部位、器械和肌群，并补全中文动作名；首次翻译缺失名称时需要访问在线翻译服务。不要直接编辑生成文件 `fit-guide-miniprogram/data/exercises.js`。

每条小程序动作数据包含：

| 字段 | 说明 |
| --- | --- |
| `id` | 动作唯一 ID |
| `name` | 中文动作名称 |
| `category` | 训练部位 |
| `equipment` | 使用器械 |
| `primaryMuscles` | 主要肌群 |
| `secondaryMuscles` | 次要肌群 |
| `image` | JPG 静态图地址 |
| `gif` | GIF 演示地址 |
| `steps` | 中文动作步骤 |

## 项目检查

```powershell
cd fit-guide-miniprogram
node scripts/check-media.js
node scripts/test-api.js
node scripts/test-favorites.js

cd ../fit-guide-backend
mvn test
```

媒体检查只校验地址与文件后缀，不会访问远程资源；发布前仍需在真机验证图片、GIF、搜索、筛选和收藏。

## 目录结构

```text
FitGuide/
├── assets/exercises-dataset/  # 上游原始数据、中文构建脚本及 1324 组媒体
├── fit-guide-miniprogram/     # 微信原生小程序
│   ├── data/                  # 小程序动作数据源与生成文件
│   ├── pages/                 # 动作库、详情、收藏
│   ├── scripts/               # 数据同步与检查脚本
│   └── utils/                 # 数据筛选、媒体、接口与收藏逻辑
├── fit-guide-backend/         # Spring Boot 收藏服务及历史目录接口
├── screenshots/               # README 截图
└── README.md
```

## 数据来源与版权

- 数据集来源：[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
- 来源项目代码与数据：MIT License
- 媒体资源：© [GymVisual](https://gymvisual.com/)，保留所有权利

请在使用、分发或部署媒体资源前确认 GymVisual 的授权要求。训练内容仅供一般健身参考；如有伤病、疼痛或其他身体不适，请先咨询医生或专业教练。
