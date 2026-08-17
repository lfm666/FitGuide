# FitGuide 后端收藏方案

> 状态：已实施  
> 版本：v0.1  
> 日期：2026-08-14  
> 适用范围：微信原生小程序 + 微信云托管 Spring Boot 服务 + MySQL 5.7

## 1. 方案结论

把收藏从小程序本地存储迁移为后端持久化，使用微信云托管随 `wx.cloud.callContainer` 请求注入的 `X-WX-OPENID` 识别用户。

首版只增加一张收藏关系表和三个接口：

| 接口 | 用途 |
| --- | --- |
| `GET /api/v1/favorites` | 获取当前用户收藏的动作 ID |
| `PUT /api/v1/favorites/{exerciseId}` | 收藏动作 |
| `DELETE /api/v1/favorites/{exerciseId}` | 取消收藏 |

主要决策：

- 不新增用户表、登录页或昵称头像等资料；OpenID 只作为收藏归属标识。
- 不引入 JWT、Redis、分布式锁、消息队列或新 Maven 依赖。
- 收藏列表仍复用现有动作目录：先获取收藏 ID，再从 `getCatalog()` 的缓存结果中过滤动作卡片。
- `PUT`、`DELETE` 均保持幂等，重复点击或请求重试不会产生重复数据或业务错误。
- 数据库唯一约束负责最终防重，前端只负责避免按钮连续提交。

## 2. 当前实现与改造目标

当前收藏链路：

```text
详情页
  └─ utils/favorites.js
       └─ wx.getStorageSync / wx.setStorageSync
            └─ favoriteExerciseIds

收藏页
  ├─ 读取本地 favoriteExerciseIds
  ├─ 调用 getCatalog()
  └─ 按 ID 过滤动作卡片
```

存在的限制：

- 收藏只存在当前微信客户端，换设备或清理缓存后丢失。
- 后端无法获得用户收藏数据，后续无法支持跨设备同步。
- 本地状态和服务端动作有效状态没有统一约束。

改造后的链路：

```text
微信小程序
  └─ wx.cloud.callContainer
       └─ 微信云托管注入 X-WX-OPENID
            └─ FavoriteController
                 └─ FavoriteService
                      ├─ FavoriteMapper ── fit_user_favorite
                      └─ CatalogService  ── 校验动作 ID 格式
```

## 3. 范围

### 3.1 本次实现

- 当前微信用户的收藏 ID 查询。
- 收藏和取消收藏。
- 跨设备同步。
- 缺失身份、非法动作 ID 的统一错误响应。
- 已上线本地收藏数据的一次性迁移策略。

### 3.2 本次不做

- 用户注册、手机号登录、用户资料和账号注销。
- 收藏分组、排序、备注、批量删除和收藏数量统计。
- Redis 缓存、离线写队列和多端实时推送。
- 单独的收藏详情 DTO；当前 60 条动作直接复用目录数据即可。
- 公网客户端或其他应用的统一账号体系。

当动作量达到约 1000 条、收藏页获取完整目录成为可测量瓶颈时，再让收藏列表接口直接返回动作卡片或增加分页。

## 4. 用户身份与安全边界

### 4.1 身份来源

小程序继续通过现有 `wx.cloud.callContainer` 调用后端。后端从请求头读取：

```http
X-WX-OPENID: <current-user-openid>
```

客户端不得在请求参数、请求体或自定义业务请求头中自行传入 OpenID，避免用户修改请求后读取或写入他人的收藏。

### 4.2 信任前提

收藏接口只信任经过微信云托管入口注入或覆盖的 `X-WX-OPENID`。如果未来允许通过自定义公网域名、App、H5 或第三方服务调用收藏接口，不能继续把普通 HTTP 请求头当作身份凭证，届时应接入真正的登录态或 JWT 资源服务器。

### 4.3 后端校验

- 请求头缺失、为空或长度超过 64：返回 HTTP `401`，业务码 `UNAUTHORIZED`。
- 不记录完整 OpenID 到普通业务日志。
- OpenID 不返回给小程序。
- 目录接口继续公开；只有 `/api/v1/favorites/**` 依赖用户身份。

本地开发可在 MockMvc 测试中直接设置请求头。不要在正式代码中提供可由公网调用的“调试 OpenID”参数。

## 5. 数据库设计

只增加收藏关系表，不增加用户表或自增主键：

```sql
CREATE TABLE fit_user_favorite (
    user_openid  VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL
                 COMMENT '微信小程序用户OpenID',
    exercise_id  VARCHAR(64) NOT NULL COMMENT '动作ID',
    created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                 COMMENT '收藏时间',
    PRIMARY KEY (user_openid, exercise_id),
    KEY idx_fit_user_favorite_list (user_openid, created_at, exercise_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci
  COMMENT = '用户动作收藏关系表';
```

设计说明：

- 复合主键天然保证同一用户不能重复收藏同一动作。
- `created_at` 用于按最近收藏排序。
- 动作数据由小程序本地维护，收藏表只保存动作 ID，不依赖动作表。
- OpenID 使用大小写敏感的 ASCII 排序规则。

已有收藏表需执行 `sql/migrate-favorites-without-exercise.sql` 删除原动作表外键。

## 6. 接口契约

接口继续复用现有统一响应：

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": []
}
```

### 6.1 获取收藏

```http
GET /api/v1/favorites
X-WX-OPENID: user-openid
```

成功响应：

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": [
    "seated-lat-pulldown",
    "machine-chest-press"
  ]
}
```

规则：

- 按收藏时间倒序返回。
- 没有收藏时返回空数组，不返回 `null`。
- 小程序使用本地动作数据过滤已不存在的动作。
- 首版不分页。

### 6.2 收藏动作

```http
PUT /api/v1/favorites/seated-lat-pulldown
X-WX-OPENID: user-openid
```

成功响应：

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": true
}
```

规则：

- 动作 ID 必须符合格式要求。
- 已收藏时仍返回成功和 `true`。
- 数据库使用唯一键防重；Mapper 可用 `INSERT IGNORE` 实现幂等写入。

### 6.3 取消收藏

```http
DELETE /api/v1/favorites/seated-lat-pulldown
X-WX-OPENID: user-openid
```

成功响应：

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": false
}
```

规则：

- 未收藏时仍返回成功和 `false`。
- 取消收藏不要求动作当前仍启用，以便清理历史关系。
- `exerciseId` 仍使用现有 kebab-case 和最大 64 字符校验。

### 6.4 错误响应

| HTTP 状态 | 业务码 | 场景 |
| ---: | --- | --- |
| `400` | `INVALID_EXERCISE_ID` | 动作 ID 格式非法 |
| `401` | `UNAUTHORIZED` | 缺少可信用户 OpenID |
| `500` | `INTERNAL_ERROR` | 未预期服务异常 |

数据库异常不向客户端暴露 SQL、表名或 OpenID。

## 7. 后端改造

建议新增：

```text
com.fitguide.favorite/
├── controller/FavoriteController.java
├── exception/FavoriteApiException.java
├── mapper/FavoriteMapper.java
└── service/FavoriteService.java
```

保持最短实现：

- `FavoriteController` 读取 `X-WX-OPENID`，暴露三个 REST 接口并包装 `Result`。
- `FavoriteService` 校验 OpenID 和动作 ID 格式，再完成查询、插入和删除。
- `FavoriteMapper` 直接使用三个注解 SQL，不创建无业务行为的 Repository、Service 接口或复合主键实体。
- 在现有异常处理器中增加收藏异常映射；请求头使用 `required = false`，由业务代码统一返回 `401`，避免 Spring 缺少请求头异常落到 `500`。
- 动作 ID 的格式校验收口在现有 `CatalogService`，收藏服务复用它，不复制正则规则。

收藏列表查询 SQL：

```sql
SELECT exercise_id
FROM fit_user_favorite
WHERE user_openid = #{openId}
ORDER BY created_at DESC, exercise_id
```

## 8. 小程序改造

### 8.1 `utils/api.js`

把现有只支持 `GET` 的 `request(path)` 扩展为 `request(path, method = 'GET')`，新增：

```js
function getFavoriteIds() {
  return request('/api/v1/favorites')
}

function addFavorite(id) {
  return request(`/api/v1/favorites/${encodeURIComponent(id)}`, 'PUT')
}

function removeFavorite(id) {
  return request(`/api/v1/favorites/${encodeURIComponent(id)}`, 'DELETE')
}
```

客户端不需要也不允许显式设置 `X-WX-OPENID`。

### 8.2 `utils/favorites.js`

保留这个文件作为页面使用的薄封装，但将本地同步方法改为远程异步方法：

- `getFavoriteIds()` 调用后端列表接口，并校验返回值为非空字符串数组。
- `toggleFavorite(id, isFavorite)` 根据当前状态调用 `removeFavorite` 或 `addFavorite`。
- 不维护第二份长期本地收藏状态，避免远端和本地双写冲突。

### 8.3 动作详情页

- 加载动作详情时同时查询收藏 ID，设置 `isFavorite`。
- 点击收藏按钮后等待远程接口成功，再更新页面状态和 Toast。
- 请求期间设置 `favoritePending`，阻止重复点击；无须实现复杂乐观更新和回滚。
- 请求失败保持原状态，提示“收藏失败，请重试”。

### 8.4 收藏页

现有流程基本不变，只把同步的 `getFavoriteIds()` 改为 `await getFavoriteIds()`：

```text
GET /favorites → 收藏 ID
GET /catalog   → 已有 catalogPromise 缓存的目录
过滤并渲染收藏动作
```

请求失败继续复用当前加载失败和重试界面。

## 9. 本地收藏迁移

如果当前版本已经有真实用户，不能直接删除 `favoriteExerciseIds`。推荐一次性合并迁移：

1. 首次进入新版时读取本地 `favoriteExerciseIds`。
2. 对每个合法 ID 调用现有 `PUT /favorites/{id}`；接口幂等，因此会与云端已有收藏取并集。
3. 全部成功后写入 `favoriteMigrationV1 = true`，并删除旧收藏键。
4. 任一请求失败则保留旧数据，下次启动重试。

迁移不新增批量接口；当前最多 60 个动作，且只执行一次。如果应用尚未发布、没有需要保留的真实本地收藏，可直接跳过迁移。

## 10. 一致性与异常策略

- 数据库复合主键是收藏防重的最终保障。
- `PUT` 与 `DELETE` 幂等，网络重试安全。
- 客户端成功后才更新按钮状态，避免维护回滚逻辑。
- 收藏列表以服务端为准，不做本地离线写入；弱网时明确提示失败。
- 动作被禁用后不再出现在收藏列表，但关系暂时保留；动作重新启用后自动恢复显示。
- 不使用事务包裹单条插入或删除；单条 SQL 已具备原子性。

## 11. 组件与依赖决策

### 11.1 推荐模块

本次不新增 `backend-components-*` 模块，继续使用项目已有的 Spring MVC、MyBatis-Plus 和本地 `Result`。

### 11.2 原因

- `backend-components-security` 面向 JWT 资源服务器，不能替代微信云托管可信 OpenID 的身份注入。
- `backend-components-foundation` 会与当前项目已有的轻量 `Result` 重复。
- `backend-components-database` 的主要能力当前已由已安装的 MyBatis-Plus 覆盖；收藏只有三条简单 SQL。

### 11.3 Maven 依赖

无需修改 `pom.xml`。

### 11.4 配置

无需新增 `application.yml` 配置。部署侧需要确认收藏接口只通过可信微信云托管入口访问。

### 11.5 组合建议

未来出现公网多客户端登录、JWT 鉴权和统一用户中心时，再组合 `backend-components-security + backend-components-web`；当前阶段不提前接入。

## 12. 测试与验收

### 12.1 后端最小测试

在现有 MockMvc 测试风格上增加一个收藏 API 测试类，覆盖：

1. 缺少 `X-WX-OPENID` 返回 `401 / UNAUTHORIZED`。
2. 空收藏返回 `data: []`。
3. 收藏成功返回 `true`。
4. 重复收藏仍成功，Mapper 不产生重复记录。
5. 取消已收藏和未收藏动作都返回 `false`。
6. 非法 ID 返回 `400 / INVALID_EXERCISE_ID`。
7. 收藏列表只返回当前用户的动作 ID，并按时间倒序。

### 12.2 小程序最小测试

改造现有 `scripts/test-favorites.js`，模拟 `callContainer` 的 `GET`、`PUT`、`DELETE` 响应，覆盖：

- 详情页能加载远程收藏状态。
- 收藏和取消收藏会调用正确 HTTP 方法与路径。
- 请求失败时页面收藏状态不变。
- 收藏页能按远程 ID 过滤目录。

### 12.3 验收标准

- 同一微信用户换设备后看到相同收藏。
- 不同微信用户的收藏互不影响。
- 快速重复点击不产生重复记录。
- 清理小程序本地缓存后收藏仍存在。
- 无网络时不误改收藏状态，恢复网络后可重试。
- 已有本地收藏在迁移成功后不丢失。
- 现有目录、筛选和详情接口行为不变。

## 13. 实施顺序

1. 在初始化 SQL 和目标数据库增加 `fit_user_favorite`。
2. 实现后端 Mapper、Service、Controller 和异常响应。
3. 完成后端自动化测试。
4. 扩展小程序 API 与收藏工具为异步远程调用。
5. 改造详情页、收藏页和现有脚本测试。
6. 视真实用户情况执行一次性本地收藏迁移。
7. 在开发者工具与两台真机验证用户隔离和跨设备同步。
