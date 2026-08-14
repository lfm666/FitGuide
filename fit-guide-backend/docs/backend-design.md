# FitGuide 后端服务设计文档

> 状态：v0.1（后端首版设计）  
> 技术约束：Spring Boot 3、JDK 21、MySQL 5.7.18  
> 数据依据：`fit-guide-miniprogram/data/exercises.json`（version 1，共 60 条动作）

> [!NOTE]
> 本文保留目录服务首版基线；后续云端收藏扩展见 [`favorites-api-design.md`](favorites-api-design.md)。

## 1. 设计结论

首版建设一个只读的单体 REST 服务，负责从 MySQL 读取动作目录和动作详情。小程序现有的搜索、筛选、收藏和 CloudBase 媒体解析逻辑暂不迁移，避免一次改动多个边界。

| 项目 | 首版决策 |
| --- | --- |
| 工程目录 | `fit-guide-backend`，与 `fit-guide-miniprogram` 同级 |
| 架构 | 单体应用：Controller → Service → MyBatis-Plus Mapper → MySQL |
| Java / Spring | JDK 21 / Spring Boot 3.x，实施时固定一个受支持的补丁版本 |
| 数据库 | MySQL 5.7.18，字符集 `utf8mb4`，排序规则 `utf8mb4_general_ci`，时区统一为 Asia/Shanghai |
| 数据模型 | 2 张表：目录元数据、动作数据；数组字段使用 MySQL JSON |
| 对外能力 | 获取及筛选动作目录、查询部位与器械、按 ID 获取动作详情 |
| 数据初始化 | 将现有 `exercises.json` 转换为 `sql/init.sql`，首次部署时手动执行 |
| 媒体 | 原样返回 `cloud://` 或 HTTP(S) 地址，不代理文件、不换取临时 URL |
| 收藏 | 继续使用小程序本地存储，不进入后端 |
| 鉴权 | 首版接口只读且公开，不引入登录与 JWT |

## 2. 目标与边界

### 2.1 目标

1. 建立可独立运行和部署的 Spring Boot 后端工程。
2. 将动作目录的运行时数据源从本地 JSON 转为 MySQL。
3. 保持接口字段与 `exercises.json` 一致，降低后续小程序改造成本。
4. 通过初始化 SQL 创建表结构并导入初始 60 条数据。
5. 为后续扩展后台管理、账户收藏预留清晰边界，但首版不提前实现。

### 2.2 首版不做

- 不修改 `fit-guide-miniprogram` 中的任何文件。
- 不实现用户、登录、远程收藏、训练计划或后台管理 CRUD。
- 不引入 Redis、消息队列、分布式锁、微服务、对象存储 SDK。
- 不实现分页和服务端全文搜索；60 条数据一次返回即可。
- 不代理图片/GIF，也不在服务端保存 CloudBase 密钥。
- 不建立分类、器械、肌群字典表；当前均为展示与筛选文本。

当动作数量达到约 1000 条、完整目录响应明显影响首屏，或出现独立运营后台时，再增加分页、搜索索引和字典表。

## 3. 现有数据分析

`exercises.json` 顶层结构：

| 字段 | 当前值/类型 | 用途 |
| --- | --- | --- |
| `version` | `1` | 动作目录数据版本 |
| `disclaimer` | `string` | 健身安全免责声明 |
| `exercises` | `Exercise[]` | 60 条动作 |

每条动作包含：

| JSON 字段 | 类型 | 数据库字段 | 约束 |
| --- | --- | --- | --- |
| `id` | `string` | `id` | 主键，稳定 kebab-case 标识 |
| `name` | `string` | `name` | 非空 |
| `category` | `string` | `category` | 非空，当前 10 类 |
| `equipment` | `string` | `equipment` | 非空，当前 48 种 |
| `level` | `string` | `level` | 当前为“初级”或“中级” |
| `primaryMuscles` | `string[]` | `primary_muscles` | 非空 JSON 数组 |
| `secondaryMuscles` | `string[]` | `secondary_muscles` | JSON 数组，可为空数组 |
| `image` | `string` | `image_url` | `cloud://` 或 HTTP(S) 地址 |
| `gif` | `string` | `gif_url` | `cloud://` 或 HTTP(S) 地址 |
| `steps` | `string[]` | `steps` | 有序、非空 JSON 数组 |
| `cautions` | `string[]` | `cautions` | 有序、非空 JSON 数组 |

JSON 数组直接存为 MySQL JSON，可以保持源数据结构和顺序，也省去 3～4 张关联表。当前规模无需针对肌群建立倒排或关联索引。

## 4. 系统结构

```text
未来的小程序请求
       │ HTTPS
       ▼
CatalogController
       │
       ▼
CatalogService
       │
       ├── CatalogMapper  ── fit_catalog
       └── ExerciseMapper ── fit_exercise
                              │
                              ▼
                           MySQL 5.7.18
```

职责边界：

- `Controller`：路由、路径参数校验、返回统一结果。
- `Service`：组合目录元数据与动作列表，处理不存在的动作。
- `Mapper`：只负责 SQL/MyBatis-Plus 数据访问。
- `DTO`：保持对外 camelCase 字段，不直接暴露数据库实体。
- `init.sql`：创建表和写入初始数据，应用运行时不再读取小程序 JSON。

首版 Service 只有一个实现，因此不创建 Service 接口；Mapper 直接使用 MyBatis-Plus `BaseMapper`，不再增加 Repository 包装层。

## 5. 工程与包结构

```text
fit-guide-backend/
├── docs/
│   └── backend-design.md
├── pom.xml
├── sql/
│   └── init.sql
└── src/
    ├── main/
    │   ├── java/com/fitguide/
    │   │   ├── FitGuideApplication.java
    │   │   └── catalog/
    │   │       ├── controller/
    │   │       ├── entity/
    │   │       ├── exception/
    │   │       ├── mapper/
    │   │       ├── service/
    │   │       └── dto/
    │   │           ├── CatalogResponse.java
    │   │           ├── ExerciseDetailResponse.java
    │   │           └── ExerciseResponse.java
    │   └── resources/
    │       ├── application.yml
    │       └── application-local.yml
    └── test/java/com/fitguide/catalog/
        └── CatalogApiTest.java
```

响应 DTO 优先使用 JDK 21 `record`；实体使用 Lombok `@Data`。JSON 列使用 MyBatis-Plus 自带的 `JacksonTypeHandler`，不编写自定义类型处理器，也不引入 MapStruct。

## 6. 公开依赖设计

### 6.1 推荐依赖

| 模块 | 作用 | 首版使用方式 |
| --- | --- | --- |
| `spring-boot-starter-web` | Spring MVC、Jackson | HTTP 与 JSON 基础能力 |
| `mybatis-plus-spring-boot3-starter` | MyBatis-Plus | 数据库访问 |
| `springdoc-openapi-starter-webmvc-ui` | SpringDoc/OpenAPI | local/dev 接口文档 |

统一返回体和异常处理保持为项目内的两个小类，不依赖私有仓库。首版没有登录态，因此不引入 security、cache、lock 等额外组件。

### 6.2 Maven 依赖范围

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  </dependency>

  <dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>
</dependencies>
```

Spring Boot 依赖版本由官方父 POM 管理；MyBatis-Plus 与 SpringDoc 在 `properties` 中各固定一个公开版本。

### 6.3 关键配置

```yaml
spring:
  application:
    name: fit-guide-backend
  datasource:
    url: jdbc:mysql://${MYSQL_ADDRESS}/fit_guide
    username: ${MYSQL_USERNAME}
    password: ${MYSQL_PASSWORD}
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    banner: false

springdoc:
  packages-to-scan: com.fitguide.catalog
  paths-to-match: /api/**
```

数据库凭据只通过环境变量或部署平台密钥注入，不提交到 Git。正式环境通过 `springdoc.*.enabled=false` 关闭 OpenAPI。首版只有 GET 接口，不增加 XSS 请求体过滤。

## 7. 数据库设计

### 7.1 `fit_catalog`：目录元数据

该表固定只有一行（`id = 1`），保存 JSON 顶层的版本和免责声明。

```sql
CREATE TABLE fit_catalog (
    id          TINYINT UNSIGNED NOT NULL COMMENT '目录主键，固定为1',
    version     BIGINT UNSIGNED NOT NULL COMMENT '动作目录数据版本',
    disclaimer  VARCHAR(500) NOT NULL COMMENT '健身安全免责声明',
    created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci
  COMMENT = 'FitGuide动作目录元数据表';
```

### 7.2 `fit_exercise`：动作数据

```sql
CREATE TABLE fit_exercise (
    id                 VARCHAR(64) NOT NULL COMMENT '动作唯一标识，使用kebab-case英文名称',
    name               VARCHAR(100) NOT NULL COMMENT '动作中文名称',
    category           VARCHAR(32) NOT NULL COMMENT '训练部位分类',
    equipment          VARCHAR(100) NOT NULL COMMENT '动作所需器械名称',
    level              VARCHAR(16) NOT NULL COMMENT '动作难度，当前为初级或中级',
    primary_muscles    JSON NOT NULL COMMENT '主要刺激肌群JSON数组',
    secondary_muscles  JSON NOT NULL COMMENT '辅助刺激肌群JSON数组，无数据时为空数组',
    image_url          VARCHAR(512) NOT NULL COMMENT '动作封面地址，支持cloud或HTTP(S)地址',
    gif_url            VARCHAR(512) NOT NULL COMMENT '动作演示地址，支持cloud或HTTP(S)地址',
    steps              JSON NOT NULL COMMENT '按执行顺序保存的动作步骤JSON数组',
    cautions           JSON NOT NULL COMMENT '安全注意事项JSON数组',
    sort_order         INT UNSIGNED NOT NULL COMMENT '展示顺序，对应源JSON数组顺序',
    enabled            BOOLEAN NOT NULL DEFAULT TRUE COMMENT '启用状态：1启用，0停用',
    created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                       ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_fit_exercise_sort_order (sort_order),
    KEY idx_fit_exercise_list (enabled, sort_order)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci
  COMMENT = 'FitGuide健身动作表';
```

设计说明：

- `id` 沿用 JSON 中的 kebab-case 标识，不再增加无业务价值的自增 ID。
- `sort_order` 保存 JSON 中的原始顺序，接口固定按其升序返回。
- `enabled` 支持下架动作，不做逻辑删除字段和删除时间。
- JSON 类型由 MySQL 保证语法合法；MySQL 5.7 不执行 `CHECK` 约束，因此目录固定 ID、难度枚举、数组类型和非空校验由种子生成脚本负责。
- 后续增加写接口时，必须在请求 DTO 和 Service 边界执行相同校验。
- 当前数据量只有 60 条，暂不为 category/equipment 增加索引；数据增长后根据慢查询决定。

## 8. 数据初始化与后续维护

### 8.1 首次导入

1. 只读解析现有 `fit-guide-miniprogram/data/exercises.json`。
2. 校验顶层字段、60 个唯一 ID、必填字段、数组类型、媒体地址格式。
3. 按 JSON 顺序生成 `sql/init.sql`：建表语句、一条目录记录、60 条动作记录。
4. 首次部署时手动执行 `sql/init.sql`；应用运行时只查询数据库。
5. 导入后校验目录版本为 1、启用动作数为 60，首尾 ID 与源文件一致。

生成脚本只用于生成初始化 SQL，不作为应用启动逻辑，避免每次启动都覆盖数据库。

### 8.2 后续内容变更

在没有后台管理系统之前，内容变更通过手动执行 SQL 完成，并同步递增 `fit_catalog.version`。需要保留变更记录时，将 SQL 保存为 `sql/update-YYYYMMDD.sql`。

如果以后引入运营后台，再改为受鉴权保护的写接口和审计记录；届时 JSON 不再承担维护入口。

## 9. API 设计

统一前缀：`/api/v1`。Controller 返回项目内的 `Result<T>`；下面示例只展示 `Result.data` 的业务负载，外层字段由 OpenAPI 固化。

### 9.1 获取动作目录

```http
GET /api/v1/catalog?category=背部&equipment=高位下拉器
```

`category` 和 `equipment` 均为可选参数，可单独或组合使用；空白参数按未传处理。

成功：HTTP 200。

```json
{
  "version": 1,
  "disclaimer": "内容仅供一般健身动作参考；首次使用器械时请让教练确认座椅、限位和重量设置。",
  "exercises": [
    {
      "id": "seated-lat-pulldown",
      "name": "坐姿高位下拉",
      "category": "背部",
      "equipment": "高位下拉器",
      "level": "初级",
      "primaryMuscles": ["背阔肌"],
      "secondaryMuscles": ["肱二头肌", "后三角肌"],
      "image": "cloud://.../seated-lat-pulldown.jpg",
      "gif": "cloud://.../seated-lat-pulldown.gif",
      "steps": ["..."],
      "cautions": ["..."]
    }
  ]
}
```

约束：

- 仅返回 `enabled = true` 的动作。
- 固定按 `sort_order ASC` 排序。
- 字段名与当前 JSON 保持一致，方便小程序把本地 `require` 替换为一次网络请求。
- 暂不分页；支持按部位和器械精确筛选。

### 9.2 获取动作详情

```http
GET /api/v1/exercises/{id}
```

成功：HTTP 200。

```json
{
  "version": 1,
  "disclaimer": "内容仅供一般健身动作参考；首次使用器械时请让教练确认座椅、限位和重量设置。",
  "exercise": {
    "id": "seated-lat-pulldown",
    "name": "坐姿高位下拉",
    "category": "背部",
    "equipment": "高位下拉器",
    "level": "初级",
    "primaryMuscles": ["背阔肌"],
    "secondaryMuscles": ["肱二头肌", "后三角肌"],
    "image": "cloud://.../seated-lat-pulldown.jpg",
    "gif": "cloud://.../seated-lat-pulldown.gif",
    "steps": ["..."],
    "cautions": ["..."]
  }
}
```

错误：

| 场景 | HTTP 状态 | 业务错误码 |
| --- | --- | --- |
| ID 格式不合法 | 400 | `INVALID_EXERCISE_ID` |
| ID 不存在或动作已下架 | 404 | `EXERCISE_NOT_FOUND` |
| 未处理异常 | 500 | `INTERNAL_ERROR` |

路径 ID 最大 64 字符，并符合 `^[a-z0-9]+(?:-[a-z0-9]+)*$`。业务错误由全局异常处理器统一转为 `Result.fail(...)`，Controller 不重复写 `try/catch`。

### 9.3 获取动作部位

```http
GET /api/v1/catalog/categories
```

返回启用动作包含的去重部位列表，按各部位第一条动作的 `sort_order` 排序。

### 9.4 获取器械

```http
GET /api/v1/catalog/equipments
```

返回启用动作包含的去重器械列表，按各器械第一条动作的 `sort_order` 排序。

## 10. 媒体地址策略

数据库保存并原样返回现有稳定地址：

- `cloud://`：仍由小程序的 `wx.cloud.getTempFileURL` 换取临时 HTTPS 地址。
- `https://` / `http://`：仍由小程序直接加载；正式环境应使用 HTTPS 并配置微信合法下载域名。

后端不换取临时链接，原因是临时地址会过期且会让后端承担不必要的 CloudBase 凭据和刷新逻辑。后续若素材迁移到标准对象存储，可只更新数据库地址，不改变 API 字段。

## 11. 实施顺序

1. 创建 Maven 工程，验证公开依赖与 Spring Boot 3/JDK 21、MySQL 5.7.18 的兼容性。
2. 创建 `sql/init.sql`，并从现有 JSON 生成 60 条种子数据。
3. 实现 Entity、Mapper、Service、DTO 和只读 Controller 路由。
4. 增加最小 API 测试，使用本地 MySQL 验证初始化 SQL。
5. 提供本地启动说明和 curl 示例。
6. 后端验收完成后，再单独设计并实施小程序网络请求改造。

## 12. 主要风险与处理

| 风险 | 处理 |
| --- | --- |
| 公开依赖版本不兼容 Spring Boot 3 | 实施第一步验证；不在代码写完后才发现 |
| MyBatis JSON 映射结果不正确 | 使用 MyBatis-Plus `JacksonTypeHandler`，API 测试覆盖数组序列化 |
| 初始化 SQL 中中文或引号转义错误 | 生成脚本统一转义，并在空 MySQL 上完整执行一次 |
| 动作顺序与小程序当前顺序不同 | 使用唯一 `sort_order`，导入时按 JSON 数组索引生成 |
| CloudBase 地址由后端误处理 | 数据库原样存储、API 原样返回，临时 URL 仍由小程序解析 |
