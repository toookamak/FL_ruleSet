## 🤖 Assistant

# FL_ClashRuleDIY 配置文档

## 1. 结构说明

### 1.1 分流规则逻辑说明

本配置采用层级化分流架构，按照以下优先级顺序进行流量处理：

1. **安全防护层**：广告拦截、跟踪器拦截等安全规则优先处理
2. **应用专用层**：针对特定应用和服务的优化路由（如AI服务、视频服务等）
3. **流量管理层**：大流量传输、下载等特殊流量处理
4. **自定义规则层**：用户自定义的代理和直连规则
5. **基础路由层**：国内直连、国际代理的基础路由
6. **默认路由层**：未匹配流量的最终处理

### 1.2 分流规则结构

配置采用模块化设计，主要包含以下组件：

```
配置管理中心 (全局参数设置)
├── 策略组命名常量 (统一命名管理)
├── 缓存管理 (性能优化)
├── 图标配置 (可视化界面)
├── 主入口函数 (配置处理流程)
├── 基础设置模块 (核心运行参数)
├── 流量嗅探设置 (加密流量识别)
├── 代理组配置模块 (策略组生成)
│   ├── 地区配置
│   ├── 节点分类处理
│   ├── 核心策略组
│   ├── 地区入口策略组
│   ├── 地区策略组
│   ├── 线路特性策略组
│   ├── 服务策略组
│   ├── 流量管理策略组
│   ├── 自定义规则策略组
│   └── 默认路由策略组
├── 规则配置模块 (规则匹配顺序)
├── 规则提供器配置 (外部规则源)
├── 辅助函数 (工具方法)
├── DNS配置模块 (域名解析)
└── TUN配置模块 (隧道功能)
```

### 1.3 主要设置参数说明

#### 1.3.1 核心运行参数

| 参数名 | 默认值 | 说明 | 推荐值 |
|--------|--------|------|--------|
| mixed-port | 7890 | HTTP/SOCKS混合端口 | 7890-7899 |
| allow-lan | true | 允许局域网访问 | true/false |
| tcp-concurrent | true | TCP并发连接 | true/false |
| ipv6 | true | IPv6支持 | true/false |

#### 1.3.2 DNS配置参数

| 参数名 | 默认值 | 说明 | 推荐值 |
|--------|--------|------|--------|
| enhanced-mode | fake-ip | DNS增强模式 | fake-ip/dns-mapping |
| fake-ip-range | 198.18.0.1/16 | 虚假IP范围 | 保持默认 |
| nameserver | 多个DNS服务器 | 主要DNS解析服务器 | 根据网络环境选择 |

#### 1.3.3 策略组类型参数

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| select | 手动选择 | 用户交互选择 |
| url-test | 延迟测试 | 自动选择最优节点 |
| fallback | 故障转移 | 主备切换 |
| load-balance | 负载均衡 | 多节点负载分担 |

#### 1.3.4 更新间隔参数

| 类型 | 默认值(秒) | 说明 | 推荐范围 |
|------|------------|------|----------|
| DEFAULT | 86400 | 一般规则更新 | 3600-172800 |
| CRITICAL | 86400 | 关键规则更新 | 1800-86400 |
| STATIC | 86400 | 静态规则更新 | 86400-604800 |

### 1.4 策略组分类说明

#### 1.4.1 按功能分类

1. **核心路由组**：提供主要的代理模式选择
2. **地区选择组**：按地理位置分类的节点组
3. **线路特性组**：特殊线路类型（家宽、低倍率等）
4. **服务专用组**：针对特定服务优化的路由组
5. **流量管理组**：大流量和特殊流量处理
6. **自定义规则组**：用户自定义规则
7. **默认路由组**：兜底的流量处理

#### 1.4.2 按可见性分类

1. **用户可见组**：提供给用户选择的策略组
2. **后台运行组**：自动运行的策略组（hidden=true）

## 2. 使用说明

### 2.1 模块分类

#### 2.1.1 配置管理中心（第17-50行）

**功能说明**：集中管理系统所有可配置参数。

**主要参数修改方法**：
- **TEST_URL**（第21行）：修改延迟测试URL
```javascript
  // 原配置
  TEST_URL: "http://www.gstatic.com/generate_204"
  // 修改为Cloudflare测试点
  TEST_URL: "http://cp.cloudflare.com/generate_204"
  ```

- **UPDATE_INTERVALS**（第30-34行）：调整规则更新频率
  ```javascript
  // 更频繁更新（每小时）
  DEFAULT: 3600
  // 更节省流量（每周）
  DEFAULT: 604800
  ```

#### 2.1.2 策略组命名（第53-73行）

**功能说明**：统一管理所有策略组名称，便于维护。

**添加新策略组**：
```javascript
// 在第53行后添加
const GAME_SERVICE = "游戏服务"; // 新增游戏服务策略组
```

#### 2.1.3 图标配置（第87-132行）

**功能说明**：管理策略组图标，支持多CDN源。

**修改图标源**：
```javascript
// 在第41行修改CDN源
CDN_SOURCES: {
 PRIMARY: "https://your-cdn.com/icons/", // 使用自定义CDN
 BACKUP: "https://backup-cdn.com/icons/",
 LOCAL: "./custom-icons/"
}
```

#### 2.1.4 基础设置模块（第183-207行）

**功能说明**：配置Clash核心运行参数。

**常见修改**：
- **端口号修改**（第185行）：
  ```javascript
  "mixed-port": 8888  // 改为8888端口
  ```

- **地理数据源**（第190-193行）：
  ```javascript
  "geox-url": {
      "geoip": "你的geoip数据源",
      "geosite": "你的geosite数据源"
  }
  ```

#### 2.1.5 代理组配置模块（第264-534行）

**功能说明**：动态生成策略组，是配置的核心部分。

**添加新地区支持**（第290-312行）：
```javascript
// 在createRegionalConfig函数中添加
{
 code: "KR",
 name: "韩国",
 icon: ICONS.KR, // 需要在图标配置中添加
 regex: /(韩国|KR|Korea|🇰🇷)/i
}
```

**添加新服务策略组**（第423-494行）：
```javascript
// 在createServiceGroups函数中添加返回数组
createProxyGroup("游戏服务", "select", {
 category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
 proxies: serviceOptions, // 复用现有选项
 icon: ICONS.GAME // 需要预先定义图标
})
```

#### 2.1.6 规则配置模块（第537-623行）

**功能说明**：配置规则匹配顺序和对应策略组。

**添加自定义规则**（第542-545行）：
```javascript
// 在customRules数组中添加
const customRules = [
 "DOMAIN-SUFFIX,example.com,平台服务", // 特定域名走平台服务
 "IP-CIDR,192.168.1.0/24,DIRECT" // 特定IP段直连
];
```

#### 2.1.7 规则提供器配置（第626-905行）

**功能说明**：配置外部规则集的来源和更新设置。

**添加新规则集**：
```javascript
// 在createRuleProviders函数中添加
NewRuleSet: createRuleProviderConfig(
 "规则集URL",
 "./ruleset/本地路径.yaml",
 CONFIG_MANAGER.UPDATE_INTERVALS.DEFAULT
)
```

### 2.2 修改现有配置

#### 2.2.1 修改地区匹配规则

**修改位置**：第290-312行 `createRegionalConfig` 函数

```javascript
// 原配置（仅匹配香港）
regex: /(香港|HK|Hong Kong|🇭🇰)/i
// 扩展匹配（包括更多变体）
regex: /(香港|HK|Hong Kong|🇭🇰|港服)/i
```

#### 2.2.2 调整策略组优先级

**修改位置**：第344-356行 `createBaseOptions` 函数

```javascript
// 原配置顺序
const baseOptions = [
 ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 自动选择`),
 "延迟优选",
 "故障转移",
 // ...
];

// 调整为故障转移优先
const baseOptions = [
 "故障转移", // 提前
 "延迟优选",
 ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 自动选择`),
 // ...
];
```

### 2.3 添加新功能

#### 2.3.1 添加新的策略组类型

1. **定义常量**（第53行后）：
   ```javascript
   const SOCIAL_MEDIA = "社交媒体";
   ```

2. **添加图标**（第87行后）：
   ```javascript
   SOCIAL: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Social.png"
   ```

3. **创建策略组函数**（第500行后）：
   ```javascript
   function createSocialMediaGroups() {
       return createProxyGroup(SOCIAL_MEDIA, "select", {
           category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
           proxies: serviceOptions,
           icon: ICONS.SOCIAL
       });
   }
   ```

4. **集成到主流程**（第335行附近）：
   ```javascript
   const socialGroups = createSocialMediaGroups();
   const allGroups = [
       // ...
       socialGroups,  // 添加到合适位置
       // ...
   ];
   ```

#### 2.3.2 添加新的规则集

1. **在规则提供器中添加**（第626行后）：
   ```javascript
   SocialRules: {
       type: "http",
       behavior: "classical",
       format: "text",
       interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
       url: "社交规则集URL",
       path: "./ruleset/social.yaml"
   }
   ```

2. **在规则配置中使用**（第550行后）：
   ```javascript
   `RULE-SET,SocialRules,${SOCIAL_MEDIA}`
   ```

## 3. 精简核心框架

```javascript
// FL_ClashRuleDIY_Core.js - 核心框架模板
// 版本：v1.0.0
// 说明：仅包含核心框架和模块结构

// ===================== 配置管理中心 =====================
/**
 * 全局配置管理器 - 集中管理可配置参数
*/
const CONFIG_MANAGER = {
 // 基础配置常量
 TEST_URL: "http://www.gstatic.com/generate_204", // 延迟测试URL
 REGION_TEST_URLS: { // 地区测试URL
 HK: "http://www.gstatic.com/generate_204",
 SG: "http://www.gstatic.com/generate_204",
 JP: "http://www.gstatic.com/generate_204",
 US: "http://www.gstatic.com/generate_204"
 },

 // 更新间隔配置
 UPDATE_INTERVALS: {
 DEFAULT: 86400, // 24小时更新间隔
 CRITICAL: 86400, // 关键规则更新间隔
 STATIC: 86400 // 静态规则更新间隔
 },

 // 策略组分类配置
 GROUP_CATEGORY: {
 CORE: "核心路由", // 核心路由策略组
 REGION_ENTRY: "地区选择", // 地区选择入口策略组
 REGION: "具体地区", // 具体地区策略组
 LINE_TYPE: "线路特性", // 线路特性策略组
 SERVICE: "服务专用", // 服务专用策略组
 TRAFFIC: "流量管理", // 流量管理策略组
 CUSTOM: "自定义规则", // 自定义规则策略组
 DEFAULT_ROUTE: "默认路由" // 默认路由策略组
 }
};

// ===================== 策略组命名常量 =====================
/**
 * 策略组名称定义 - 便于统一管理和维护
*/
const GLOBAL_ROUTING = "代理模式"; // 核心代理模式入口
const MANUAL_REGION_SELECT = "手动选择 (地区)"; // 手动选择地区入口
const RESIDENTIAL_LINE = "家宽/原生线路"; // 家宽/原生IP线路
const LOW_RATE_NODE = "低倍率节点"; // 低倍率优惠节点
const CUSTOM_PROXY_RULE = "自定义代理规则"; // 用户自定义代理规则
const CUSTOM_DIRECT_RULE = "自定义直连规则"; // 用户自定义直连规则
const DOMESTIC_TRAFFIC = "国内流量"; // 国内网络流量
const GLOBAL_TRAFFIC = "国际流量"; // 国际网络流量

// ===================== 缓存管理 =====================
/**
 * 全局缓存对象 - 提高性能，避免重复计算
*/
const CACHE = {
 proxyGroups: null,
 availableRegions: null,
 residentialProxies: null,
 lowRateProxies: null,
 ruleProviders: null
};

// ===================== 主入口函数 =====================
/**
 * 主入口函数 - 处理Clash配置文件
 * @param {Object} params - Clash配置参数对象
 * @return {Object} 处理后的配置参数对象
*/
const main = (params) => {
 // 检查配置中是否包含代理信息，如果没有则直接返回原配置
 if (!params.proxies) return params;

 // 依次应用各项配置覆盖（处理顺序很重要）
 overwriteBasicOptions(params); // 覆盖基础配置
 overwriteSniffer(params); // 覆盖流量嗅探配置
 overwriteProxyGroups(params); // 覆盖代理组配置
 overwriteRules(params); // 覆盖规则配置
 overwriteDns(params); // 覆盖DNS配置
 overwriteTunnel(params); // 覆盖TUN配置

 // 清理缓存，释放内存
 clearCache();

 // 返回处理完成的配置对象
 return params;
};

// ===================== 缓存管理函数 =====================
/**
 * 清理缓存函数 - 防止内存泄漏
*/
function clearCache() {
 CACHE.proxyGroups = null;
 CACHE.availableRegions = null;
 CACHE.residentialProxies = null;
 CACHE.lowRateProxies = null;
 CACHE.ruleProviders = null;
}

// ===================== 基础设置模块 =====================
/**
 * 覆盖基础配置选项 - 设置Clash核心运行参数
 * @param {Object} params - 配置参数对象
*/
function overwriteBasicOptions(params) {
 Object.assign(params, {
 "mixed-port": 7890, // 混合端口
 "allow-lan": true, // 允许局域网访问
 "unified-delay": true, // 启用统一延迟计算
 "tcp-concurrent": true, // 启用TCP并发连接
 "geodata-mode": true, // 启用地理数据模式
 "geox-url": { // 地理数据文件下载URL
 "geoip": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat",
 "geosite": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat"
 },
 "fakeind-process-mode": "strict", // 严格模式处理虚假指标
 "global-client-fingerprint": "chrome", // 全局客户端指纹
 profile: { // 配置文件相关设置
 "store-selected": true, // 存储用户选择的策略组
 "store-fake-ip": true // 存储虚假IP映射
 },
 ipv6: true, // 启用IPv6支持
 mode: "rule", // 运行模式为规则模式
 "skip-auth-prefixes": ["127.0.0.1/32"], // 跳过认证的IP前缀
 "lan-allowed-ips": ["0.0.0.0/0", "::/0"] // 允许访问的局域网IP范围
 });
}

// ===================== 流量嗅探设置 =====================
/**
 * 覆盖流量嗅探配置 - 自动识别和处理加密流量
 * @param {Object} params - 配置参数对象
*/
function overwriteSniffer(params) {
 params.sniffer = {
 enable: true, // 启用流量嗅探
 "force-dns-mapping": true, // 强制DNS映射
 "parse-pure-ip": true, // 解析纯IP流量
 "override-destination": false, // 不覆盖目标地址
 sniff: { // 嗅探协议配置
 HTTP: { // HTTP协议嗅探
 ports: ["80", "443"], // 监听80和443端口
 "override-destination": false // 不覆盖HTTP目标
 },
 TLS: { // TLS协议嗅探
 ports: ["443"] // 监听443端口
 }
 },
 "skip-domain": ["+.push.apple.com"], // 跳过嗅探的域名
 "skip-dst-address": [ // 跳过嗅探的目标IP地址段
 // 常见的跳过地址段
 ]
 };
}

// ===================== 代理组配置模块 =====================
/**
 * 覆盖代理组配置 - 核心策略组配置函数
 * @param {Object} params - 配置参数对象
*/
function overwriteProxyGroups(params) {
 // 检查缓存
 if (CACHE.proxyGroups) {
 params["proxy-groups"] = CACHE.proxyGroups;
 params.__hasResidential = CACHE.residentialProxies && CACHE.residentialProxies.length > 0;
 params.__hasLowRate = CACHE.lowRateProxies && CACHE.lowRateProxies.length > 0;
 return;
 }

 // 地区分组配置
 const COUNTRY_REGIONS = createRegionalConfig();

 // 获取有效代理和节点分类
 const { allProxies, availableRegions, residentialProxies, lowRateProxies,
 hasResidential, hasLowRate, hasOtherProxies } = processProxyNodes(params, COUNTRY_REGIONS);

 // 存储到缓存
 CACHE.residentialProxies = residentialProxies;
 CACHE.lowRateProxies = lowRateProxies;

 // 创建各类策略组
 const coreGroups = createCoreGroups(allProxies, COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate);
 const regionEntryGroups = createRegionEntryGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate);
 const { autoSelectGroups, manualSelectGroups, otherAutoGroup, otherManualGroup } =
 createRegionalGroups(params, COUNTRY_REGIONS, availableRegions);
 const lineTypeGroups = createLineTypeGroups(hasResidential, residentialProxies, hasLowRate, lowRateProxies);
 const customRuleGroups = createCustomRuleGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies);
 const defaultRouteGroups = createDefaultRouteGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies);

 // 合并所有代理组
 const allGroups = [
 ...coreGroups,
 ...lineTypeGroups,
 ...customRuleGroups,
 ...defaultRouteGroups,
 ...regionEntryGroups,
 ...manualSelectGroups,
 ...autoSelectGroups,
 ...(otherManualGroup ? [otherManualGroup] : []),
 ...(otherAutoGroup ? [otherAutoGroup] : [])
 ];

 // 存储到缓存和参数
 CACHE.proxyGroups = allGroups;
 params["proxy-groups"] = allGroups;
 params.__hasResidential = hasResidential;
 params.__hasLowRate = hasLowRate;
}

/**
 * 创建地区配置 - 定义支持的地区及其匹配规则
*/
function createRegionalConfig() {
 return [
 {
 code: "HK", // 地区代码
 name: "香港", // 地区名称
 regex: /(香港|HK|Hong Kong|🇭🇰)/i // 匹配正则表达式
 },
 {
 code: "SG",
 name: "新加坡",
 regex: /(新加坡|狮城|SG|Singapore|🇸🇬)/i
 },
 {
 code: "JP",
 name: "日本",
 regex: /(日本|JP|Japan|🇯🇵)/i
 },
 {
 code: "US",
 name: "美国",
 regex: /(美国|US|USA|United States|America|🇺🇸)/i
 }
 ];
}

/**
 * 处理代理节点分类 - 对代理节点进行分类和筛选
*/
function processProxyNodes(params, COUNTRY_REGIONS) {
 const PROXY_REGEX = /^(?!.*(?:自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire)).*$/;
 const allProxies = getProxiesByRegex(params, PROXY_REGEX);
 const availableRegions = new Set();
 const RESIDENTIAL_REGEX = /(家宽|原生|residential|home)/i;
 const LOW_RATE_REGEX = /(低倍率|lowrate|低-rate|倍率)/i;

 // 识别归属地区
 params.proxies.forEach(proxy => {
 const region = COUNTRY_REGIONS.find(r => r.regex.test(proxy.name));
 region ? availableRegions.add(region.name) : null;
 });

 // 获取特殊节点类型
 const residentialProxies = getProxiesByRegex(params, RESIDENTIAL_REGEX);
 const lowRateProxies = getProxiesByRegex(params, LOW_RATE_REGEX);
 const hasResidential = residentialProxies.length > 0;
 const hasLowRate = lowRateProxies.length > 0;

 // 检查其他地区节点
 const otherProxies = params.proxies
 .filter(proxy =>
 !COUNTRY_REGIONS.some(region => region.regex.test(proxy.name)) &&
 !RESIDENTIAL_REGEX.test(proxy.name) &&
 !LOW_RATE_REGEX.test(proxy.name)
 )
 .map(proxy => proxy.name);
 const hasOtherProxies = otherProxies.length > 0;

 return {
 allProxies,
 availableRegions,
 residentialProxies,
 lowRateProxies,
 hasResidential,
 hasLowRate,
 hasOtherProxies
 };
}

/**
 * 创建基础选项数组 - 避免策略组间的循环引用
*/
function createBaseOptions(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies = false) {
 const baseOptions = [
 ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 自动选择`),
 "延迟优选",
 "故障转移",
 ...(hasResidential ? [RESIDENTIAL_LINE] : []),
 ...(hasLowRate ? [LOW_RATE_NODE] : []),
 "DIRECT",
 "REJECT"
 ];

 if (hasOtherProxies) {
 baseOptions.splice(COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).length + 2, 0, "其他地区 · 手动选择");
 }

 return baseOptions;
}

// ===================== 策略组创建函数 =====================
// 注意：以下为框架示例，实际使用时需要实现具体逻辑

/**
 * 创建核心策略组 - 配置的核心入口
*/
function createCoreGroups(allProxies, COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate) {
 // TODO: 实现核心策略组创建逻辑
 return [];
}

/**
 * 创建地区入口策略组 - 提供用户选择地区的统一入口
*/
function createRegionEntryGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate) {
 // TODO: 实现地区入口策略组创建逻辑
 return [];
}

/**
 * 创建地区策略组 - 创建具体地区的策略组
*/
function createRegionalGroups(params, COUNTRY_REGIONS, availableRegions) {
 // TODO: 实现地区策略组创建逻辑
 return { autoSelectGroups: [], manualSelectGroups: [], otherAutoGroup: null, otherManualGroup: null };
}

/**
 * 创建线路特性策略组 - 特殊线路类型策略组
*/
function createLineTypeGroups(hasResidential, residentialProxies, hasLowRate, lowRateProxies) {
 // TODO: 实现线路特性策略组创建逻辑
 return [];
}

/**
 * 创建自定义规则策略组 - 用户自定义规则的策略组
*/
function createCustomRuleGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies) {
 // TODO: 实现自定义规则策略组创建逻辑
 return [];
}

/**
 * 创建默认路由策略组 - 最终默认路由策略组
*/
function createDefaultRouteGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies) {
 // TODO: 实现默认路由策略组创建逻辑
 return [];
}

// ===================== 规则配置模块 =====================
/**
 * 覆盖规则配置 - 配置规则匹配顺序
 * @param {Object} params - 配置参数对象
*/
function overwriteRules(params) {
 // 自定义规则添加区域
 const customRules = [
 // "DOMAIN-SUFFIX,example.com,代理模式" // 用户自定义规则示例
 ];

 // 获取策略组状态
 const hasResidential = params.__hasResidential || false;
 const hasLowRate = params.__hasLowRate || false;

 // 构建规则数组
 const rules = [
 // 用户自定义规则
 ...customRules,

 // 基础路由规则
 "GEOSITE,private,DIRECT",
 "GEOIP,private,DIRECT,no-resolve",
 "GEOSITE,cn,DIRECT",
 "GEOIP,cn,DIRECT,no-resolve",

 // 最终匹配规则
 `GEOIP,CN,${DOMESTIC_TRAFFIC}`,
 `MATCH,${GLOBAL_TRAFFIC}`
 ];

 // 应用规则数组
 params.rules = rules;
 // 配置规则提供器
 params["rule-providers"] = createRuleProviders();
}

/**
 * 创建规则提供器配置 - 配置外部规则集
 * @return {Object} 规则提供器配置对象
*/
function createRuleProviders() {
 // 检查缓存
 if (CACHE.ruleProviders) {
 return CACHE.ruleProviders;
 }

 /**
 * 创建规则提供器配置的辅助函数
 * @param {string} url - 规则集URL
 * @param {string} path - 本地存储路径
 * @param {number} interval - 更新间隔（秒）
 * @return {Object} 规则提供器配置
 */
 function createRuleProviderConfig(url, path, interval = CONFIG_MANAGER.UPDATE_INTERVALS.DEFAULT) {
 return {
 type: "http", // HTTP类型规则集
 behavior: "classical", // 经典规则行为
 format: "yaml", // YAML格式
 interval: interval, // 更新间隔
 url: url, // 规则URL
 path: path // 本地存储路径
 };
 }

 const providers = {
 // 自定义规则集示例
 CustomProxyRules: {
 type: "http",
 behavior: "classical",
 format: "text",
 interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
 url: "你的自定义规则URL",
 path: "./ruleset/custom-proxy.yaml"
 }
 };

 // 存储到缓存
 CACHE.ruleProviders = providers;
 return providers;
}

// ===================== 辅助函数 =====================
/**
 * 创建代理组 - 策略组工厂方法
 * @param {string} name - 策略组名称
 * @param {string} type - 策略组类型
 * @param {Object} options - 策略组选项
 * @return {Object} 策略组对象
*/
function createProxyGroup(name, type, options = {}) {
 const base = {
 name, // 策略组名称
 type, // 策略组类型
 category: options.category || "未分类", // 策略组分类
 url: type !== "select" ? CONFIG_MANAGER.TEST_URL : undefined,
 interval: type !== "select" ? 600 : undefined
 };

 // 负载均衡特殊处理
 if (type === "load-balance") {
 Object.assign(options, {
 "max-failed-times": 3,
 lazy: true
 });
 }

 return Object.assign(base, options);
}

/**
 * 根据正则表达式获取代理节点
 * @param {Object} params - 配置参数对象
 * @param {RegExp} regex - 匹配正则表达式
 * @param {Array} fallback - 备选节点数组
 * @return {Array} 匹配的代理节点名称数组
*/
function getProxiesByRegex(params, regex, fallback = ["DIRECT"]) {
 const matched = params.proxies
 .filter(e => regex.test(e.name))
 .map(e => e.name);
 return matched.length ? matched : fallback;
}

// ===================== DNS配置模块 =====================
/**
 * 覆盖DNS配置 - DNS解析相关参数
 * @param {Object} params - 配置参数对象
*/
function overwriteDns(params) {
 params.dns = {
 enable: true, // 启用DNS功能
 listen: "0.0.0.0:1053", // 监听地址和端口
 "enhanced-mode": "fake-ip", // 增强模式为虚假IP
 "fake-ip-range": "198.18.0.1/16", // 虚假IP范围
 "use-hosts": false, // 不使用hosts文件
 "use-system-hosts": false, // 不使用系统hosts文件
 ipv6: false, // 禁用IPv6 DNS解析
 "fake-ip-filter": [ // 虚假IP过滤列表
 "*.lan", "*.local", // 局域网域名
 "time.*.com", "ntp.*.com" // 时间同步域名
 ],
 "default-nameserver": ["tls://223.5.5.5"], // 默认DNS服务器
 nameserver: [ // 主要DNS服务器
 "https://dns.alidns.com/dns-query", // 阿里DNS
 "https://doh.pub/dns-query" // DNSPod DNS
 ],
 "proxy-server-nameserver": [ // 代理服务器DNS
 'https://1.1.1.1/dns-query', // Cloudflare DNS
 'https://223.5.5.5/dns-query' // 阿里DNS
 ],
 "nameserver-policy": { // DNS策略
 'geosite:private': 'system', // 私有域名使用系统DNS
 'geosite:cn': ['119.29.29.29', '223.5.5.5'] // 国内域名使用国内DNS
 }
 };
}

// ===================== TUN配置模块 =====================
/**
 * 覆盖TUN配置 - TUN隧道相关参数
 * @param {Object} params - 配置参数对象
*/
function overwriteTunnel(params) {
 params.tun = {
 enable: true, // 启用TUN功能
 stack: "mixed", // 混合协议栈
 device: "Mihomo", // TUN设备名称
 "dns-hijack": ["any:53"], // DNS劫持配置
 "auto-route": true, // 自动路由
 "auto-redirect": false, // 不自动重定向
 "auto-detect-interface": true, // 自动检测网络接口
 "strict-route": false, // 不使用严格路由
 "route-exclude-address": [], // 路由排除地址列表
 mtu: 1500 // 最大传输单元
 };
}
```

### 3.1 核心框架使用说明

#### 3.1.1 框架特点

1. **模块化设计**：每个功能模块独立，便于维护和扩展
2. **配置中心化**：所有可配置参数集中在CONFIG_MANAGER中
3. **缓存机制**：避免重复计算，提高性能
4. **扩展友好**：提供清晰的扩展点和示例

#### 3.1.2 使用方法

1. **复制核心框架**到新的配置文件
2. **根据需求实现TODO部分**的策略组创建函数
3. **修改CONFIG_MANAGER中的参数**以适应具体环境
4. **添加自定义规则和策略组**到相应位置

#### 3.1.3 扩展示例

添加新的地区支持的完整流程：

```javascript
// 1. 在createRegionalConfig中添加
{
 code: "KR",
 name: "韩国",
 regex: /(韩国|KR|Korea|🇰🇷)/i
}

// 2. 添加相关常量和配置（如果需要）
const KOREA_SERVICE = "韩国服务";

// 3. 在相应策略组创建函数中添加处理逻辑
// 4. 在规则配置中添加相关规则
```

这个精简的核心框架为用户提供了清晰的结构和扩展指导，便于快速构建符合需求的Clash配置。
