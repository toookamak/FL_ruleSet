## 🤖 Assistant

# Clash策略组和规则集添加指南

## 目录
1. [概述](#1-概述)
2. [准备工作](#2-准备工作)
3. [添加新策略组](#3-添加新策略组)
4. [添加新规则集](#4-添加新规则集)
5. [配置规则引用](#5-配置规则引用)
6. [测试验证](#6-测试验证)
7. [常见问题](#7-常见问题)

## 1. 概述

本文档详细说明如何在FL_ClashRuleDIY配置中添加新的策略组和规则集。通过本指南，即使是没有编程经验的新手也能顺利完成配置修改。

## 2. 准备工作

### 2.1 文件定位
首先找到需要修改的配置文件：
```
FL_ClashRuleDIY_Full_0806.js
```

### 2.2 编辑器准备
建议使用支持语法高亮的文本编辑器：
- Visual Studio Code
- Sublime Text
- Atom
- Notepad++（Windows）

### 2.3 备份原文件
在修改前，请务必备份原文件：
```
复制 FL_ClashRuleDIY_Full_0806.js 为 FL_ClashRuleDIY_Full_0806.js.bak
```

## 3. 添加新策略组

### 3.1 第一步：添加策略组常量（第53-73行）

#### 3.1.1 找到策略组命名常量区域
```javascript
// ===================== 策略组命名常量 =====================
/**
 * 所有策略组名称定义，便于统一管理和维护
 */
const GLOBAL_ROUTING = "代理模式";                    // 核心代理模式入口
const MANUAL_REGION_SELECT = "手动选择 (地区)";       // 手动选择地区入口
// ... 其他常量定义
```

#### 3.1.2 添加新的策略组常量
在现有常量后添加新行：
```javascript
const GAME_SERVICE = "游戏服务";                     // 游戏服务专用策略组
```

**修改说明**：
- `GAME_SERVICE`：JavaScript变量名，用于代码内部引用
- `"游戏服务"`：策略组显示名称，用户可见

### 3.2 第二步：添加策略组图标（第87-132行）

#### 3.2.1 找到图标配置区域
```javascript
const ICONS = {
    // 核心路由图标
    GLOBAL_ROUTING: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Proxy.png",
    // ... 其他图标定义
};
```

#### 3.2.2 添加新的策略组图标
在相应分类下添加图标定义：
```javascript
const ICONS = {
    // ... 其他图标定义
    
    // 服务专用图标（在这个区域添加）
    OFFICE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Notion.png",
    GAME: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Game.png",        // 新添加的游戏图标
    TELEGRAM: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Telegram.png",
    
    // ... 其他图标定义
};
```

**注意**：确保图标文件存在，或使用已有的图标文件名。

### 3.3 第三步：创建策略组创建函数（第500-510行附近）

#### 3.3.1 找到相应的策略组创建函数
根据策略组类型找到对应函数：
- `createServiceGroups`（服务专用策略组）
- `createTrafficGroups`（流量管理策略组）
- `createCustomRuleGroups`（自定义规则策略组）

#### 3.3.2 在服务策略组中添加新策略组
找到`createServiceGroups`函数：
```javascript
function createServiceGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies) {
    // 创建完整选项
    const serviceOptions = [
        GLOBAL_ROUTING,
        "延迟优选",
        // ... 其他选项
    ];
    
    return [
        // 网络办公服务
        createProxyGroup(OFFICE_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: ICONS.OFFICE
        }),
        
        // 在这里添加新的策略组
        
        // 广告拦截
        createProxyGroup(AD_BLOCKING, "select", {
            // ... 其他配置
        }),
    ];
}
```

#### 3.3.3 添加新策略组配置
在相应位置插入新的策略组：
```javascript
function createServiceGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies) {
    // 创建完整选项
    const serviceOptions = [
        GLOBAL_ROUTING,
        "延迟优选",
        "故障转移",
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 自动选择`),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []),
        ...(hasLowRate ? [LOW_RATE_NODE] : []),
        MANUAL_REGION_SELECT,
        ...(hasOtherProxies ? ["其他地区 · 手动选择"] : []),
        "DIRECT",
        "REJECT"
    ];
    
    return [
        // 网络办公服务
        createProxyGroup(OFFICE_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: ICONS.OFFICE
        }),
        
        // 游戏服务 - 新添加的策略组
        createProxyGroup(GAME_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,     // 策略组分类
            proxies: serviceOptions,                             // 可选的代理节点
            icon: ICONS.GAME                                     // 对应图标
        }),
        
        // 即时通讯
        createProxyGroup(INSTANT_MESSAGING, "select", {
            // ... 其他配置
        }),
    ];
}
```

### 3.4 第四步：保存并测试
保存文件后，下一步将进行测试验证。

## 4. 添加新规则集

### 4.1 第一步：准备规则集文件

#### 4.1.1 确定规则集内容格式
规则集有三种格式：
1. **Domain格式**：域名列表（每行一个域名）
2. **Classical格式**：完整的Clash规则格式
3. **IP CIDR格式**：IP地址段列表

**示例 - Domain格式**：
```
game1.com
game2.net
gameservice.org
```

**示例 - Classical格式**：
```
DOMAIN-SUFFIX,game1.com,游戏代练
IP-CIDR,192.168.1.0/24,DIRECT
PROCESS-NAME,game.exe,游戏代练
```

#### 4.1.2 上传规则集文件
将规则集文件上传到可以公开访问的URL，如：
- GitHub Gist
- GitHub仓库
- 自建服务器
- 云存储服务

**推荐做法**：使用GitHub仓库托管规则集。

### 4.2 第二步：在规则提供器中添加规则集定义（第626-905行）

#### 4.2.1 找到规则提供器配置函数
```javascript
function createRuleProviders() {
    // 检查缓存
    if (CACHE.ruleProviders) {
        return CACHE.ruleProviders;
    }
    
    // ... 现有规则提供器定义
}
```

#### 4.2.2 添加新的规则提供器
在函数末尾添加新的规则集配置：
```javascript
const providers = {
    // ... 其他规则提供器
    
    // === 新增游戏服务规则集 ===
    GameRules: {
        type: "http",                           // HTTP类型规则集
        behavior: "classical",                  // 规则行为类型（根据文件格式选择）
        format: "text",                         // 文件格式
        interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,  // 更新间隔
        url: "https://raw.githubusercontent.com/你的用户名/仓库名/main/rules/game.txt",  // 你的规则集URL
        path: "./ruleset/game-rules.yaml"       // 本地存储路径
    },
    
    // === 新增游戏域名规则集 ===
    GameDomains: {
        type: "http",                           // HTTP类型规则集
        behavior: "domain",                     // 域名规则行为
        format: "text",                         // 文件格式
        interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,  // 更新间隔
        url: "https://raw.githubusercontent.com/你的用户名/仓库名/main/rules/gamedomains.txt",  // 你的规则集URL
        path: "./ruleset/game-domains.yaml"     // 本地存储路径
    }
};
```

#### 4.2.3 行为类型说明
根据规则集文件格式选择正确的behavior：
- **classical**：经典Clash规则格式
- **domain**：纯域名列表
- **ipcidr**：IP地址段列表

### 4.3 第三步：保存配置
保存文件修改。

## 5. 配置规则引用

### 5.1 第一步：添加规则引用到规则列表（第537-623行）

#### 5.1.1 找到规则配置函数
```javascript
function overwriteRules(params) {
    // 自定义规则添加区域
    const customRules = [
        // 用户自定义规则示例
    ]; 
    
    // 构建规则数组
    const rules = [
        // === 广告拦截规则 ===
        // ... 现有规则
        
        // $$$$ 用户自定义规则区域 $$$$
        ...customRules,
        
        // === 服务专用规则 ===
        // ... 现有服务规则
    ];
}
```

#### 5.1.2 在适当位置插入新规则
在服务专用规则区域添加：
```javascript
// === 服务专用规则 ===
// OneDrive服务规则
`GEOSITE,onedrive,${OFFICE_SERVICE}`,
// GitHub服务规则
`GEOSITE,github,${OFFICE_SERVICE}`,
// 游戏服务规则
`RULE-SET,GameRules,${GAME_SERVICE}`,          // 新添加的游戏规则集
`RULE-SET,GameDomains,${GAME_SERVICE}`,        // 新添加的游戏域名规则集
// Grazie AI服务规则
"DOMAIN-SUFFIX,grazie.ai,AI服务",
// ... 其他规则
```

**规则格式说明**：
- `RULE-SET,规则集名称,策略组名称`：引用外部规则集
- `DOMAIN-SUFFIX,域名,策略组名称`：匹配特定域名后缀
- `DOMAIN,完整域名,策略组名称`：匹配完整域名
- `IP-CIDR,IP段,策略组名称`：匹配IP地址段

### 5.2 第二步：保存配置
保存所有修改的文件。

## 6. 测试验证

### 6.1 测试策略组添加

#### 6.1.1 生成配置文件
使用修改后的脚本生成YAML配置文件。

#### 6.1.2 检查策略组是否显示
在Clash客户端中查看代理组界面，确认：
- 新添加的"游戏服务"策略组显示正常
- 策略组图标正确显示
- 策略组包含正确的选项列表

### 6.2 测试规则集添加

#### 6.2.1 检查规则集下载
查看Clash日志或文件系统，确认：
- 规则集文件已成功下载到指定路径
- 没有下载错误或HTTP错误

#### 6.2.2 测试规则匹配
使用新添加的域名或IP进行测试：
1. 访问游戏相关网站
2. 检查流量是否正确路由到"游戏服务"策略组
3. 查看Clash日志确认规则匹配情况

### 6.3 验证完整流程
1. 启动Clash客户端
2. 查看所有新增配置是否正常加载
3. 测试流量是否会按预期路由
4. 检查是否有任何错误日志

## 7. 常见问题

### 7.1 策略组不显示

**问题现象**：新增的策略组在Clash客户端中不显示

**解决步骤**：
1. **检查JavaScript语法**
```javascript
   // 确保语法正确，注意逗号分隔
   return [
       createProxyGroup(OFFICE_SERVICE, "select", {
           // ... 配置
       }),
       createProxyGroup(GAME_SERVICE, "select", {     // 确保逗号分隔正确
           category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
           proxies: serviceOptions,
           icon: ICONS.GAME
       }),                                            // 注意这里不要多逗号
   ];
   ```

2. **检查策略组常量定义**
   ```javascript
   // 确保常量在函数作用域内可见
   const GAME_SERVICE = "游戏服务";  // 应该在全局作用域定义
   ```

3. **检查函数返回值**
   确保策略组数组被正确返回并添加到主配置中

### 7.2 规则集下载失败

**问题现象**：规则集无法下载或显示404错误

**解决步骤**：
1. **检查URL有效性**
   ```bash
   # 在浏览器中访问URL或使用curl测试
   curl -I "https://raw.githubusercontent.com/你的用户名/仓库名/main/rules/game.txt"
   ```

2. **检查文件格式**
   确保文件格式与behavior设置匹配：
   - domain行为需要纯域名列表
   - classical行为需要Clash规则格式
   - ipcidr行为需要IP地址段

3. **检查路径权限**
   确保Clash有权限写入指定的本地路径

### 7.3 规则不匹配

**问题现象**：流量没有按预期路由到新策略组

**解决步骤**：
1. **检查规则顺序**
   ```javascript
   // 规则匹配按顺序进行，确保规则位置正确
   const rules = [
       // 优先级高的规则放在前面
       `RULE-SET,GameRules,${GAME_SERVICE}`,      // 游戏规则放前面
       `GEOSITE,onedrive,${OFFICE_SERVICE}`,      // 其他规则
   ];
   ```

2. **检查策略组引用**
   确保规则中引用的策略组名称与定义的常量完全一致

3. **查看日志调试**
   启用Clash详细日志，查看规则匹配过程

### 7.4 图标不显示

**问题现象**：策略组图标显示为默认图标或占位符

**解决步骤**：
1. **检查图标URL**
   确保图标文件在指定CDN源中存在

2. **检查图标常量定义**
   ```javascript
   GAME: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Game.png"
   // 确保Game.png文件在图标库中存在
   ```

3. **检查图标格式**
   确保图标为PNG格式且大小适中（推荐32x32像素）

### 7.5 性能问题

**问题现象**：配置加载缓慢或内存占用过高

**解决步骤**：
1. **优化规则集数量**
   避免添加过多规则集，合理合并非必要的规则集

2. **调整更新间隔**
   ```javascript
   interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,  // 24小时
   // 可以调整为更长的间隔减少更新频率
   ```

3. **检查规则冗余**
   避免重复规则或相互冲突的规则

## 附录：完整示例代码

以下是一个添加"游戏服务"策略组的完整示例：

```javascript
// 1. 在策略组常量区域添加（第53行后）
const GAME_SERVICE = "游戏服务";

// 2. 在图标配置区域添加（第87行后）
const ICONS = {
 // ... 其他图标

 // 服务专用图标
 GAME: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Game.png",

 // ... 其他图标
};

// 3. 在createServiceGroups函数中添加策略组（第423行附近）
function createServiceGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies) {
 // ... 现有代码

 return [
 // ... 现有策略组

 // 游戏服务
 createProxyGroup(GAME_SERVICE, "select", {
 category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
 proxies: serviceOptions,
 icon: ICONS.GAME
 }),

 // ... 现有策略组
 ];
}

// 4. 在createRuleProviders函数中添加规则集（第626行后）
GameService: {
 type: "http",
 behavior: "classical",
 format: "text",
 interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
 url: "https://raw.githubusercontent.com/用户名/仓库/main/rules/gameservice.txt",
 path: "./ruleset/game-service.yaml"
}

// 5. 在overwriteRules函数中添加规则引用（第550行后）
`RULE-SET,GameService,${GAME_SERVICE}`
```

通过以上步骤，您就可以成功添加新的策略组和规则集到您的Clash配置中。建议每次只添加一个功能进行测试，确保每个步骤都正确无误后再进行下一步。
