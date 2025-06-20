// =====================================================
// FL_ClashRuleDIY_Full.js - Clash/Mihomo高级规则配置脚本
// 版本：v8.0.1 完整修复版
// 特点：完整注释 + 逻辑修复 + 性能优化
// 最后更新：2023-12-20
// =====================================================

// ===================== 全局配置常量 =====================
const PROXY_NAME = "代理模式";        // 主代理组名称
const TEST_URL = "http://www.gstatic.com/generate_204"; // 延迟测试URL
const RESIDENTIAL_GROUP = "家宽/原生"; // 住宅IP节点组名称
const LOW_RATE_GROUP = "低倍率";       // 低倍率节点组名称
const CUSTOM_PROXY_GROUP = "自定义代理规则"; // 用户代理规则组
const CUSTOM_DIRECT_GROUP = "自定义直连规则"; // 用户直连规则组

// 图标CDN基准路径
const ICON_BASE = "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io/main/docs/assets/icons";

// 地区配置常量（全局作用域）
const COUNTRY_REGIONS = [
  { 
    code: "HK", name: "🇭🇰 香港", 
    regex: /(香港|HK|Hong Kong|🇭🇰)/i,
    icon: `${ICON_BASE}/flags/hk.svg`
  },
  {
    code: "TW", name: "🇹🇼 台湾",
    regex: /(台湾|TW|Taiwan|🇹🇼)/i,
    icon: `${ICON_BASE}/flags/tw.svg`
  },
  {
    code: "SG", name: "🇸🇬 新加坡",
    regex: /(新加坡|狮城|SG|Singapore|🇸🇬)/i,
    icon: `${ICON_BASE}/flags/sg.svg`
  },
  {
    code: "JP", name: "🇯🇵 日本",
    regex: /(日本|JP|Japan|🇯🇵)/i,
    icon: `${ICON_BASE}/flags/jp.svg`
  },
  {
    code: "US", name: "🇺🇸 美国",
    regex: /(美国|US|USA|United States|America|🇺🇸)/i,
    icon: `${ICON_BASE}/flags/us.svg`
  },
  {
    name: "其它",
    regex: /(?!.*(?: 剩余 | 到期 | 主页 | 官网 | 游戏 | 关注))(.*)/,
    icon: `${ICON_BASE}/flags/global.svg`
  }
];

// ===================== 主入口函数 =====================
/**
 * 主入口函数
 * @param {Object} params - Clash/Mihomo配置对象
 * @returns {Object} 修改后的配置对象
 * 
 * 执行流程：
 * 1. 检查代理节点是否存在
 * 2. 按顺序执行各模块配置覆盖
 * 3. 返回完整配置对象
 */
const main = (params) => {
  // 空节点检查
  if (!params || !params.proxies || !Array.isArray(params.proxies)) {
    console.error("代理节点列表为空或格式错误");
    return params || {};
  }
  
  // 模块执行顺序
  overwriteBasicOptions(params);   // 基础网络配置
  overwriteSniffer(params);        // 流量分析配置
  overwriteProxyGroups(params);    // 代理组架构
  overwriteRules(params);          // 规则链系统
  overwriteDns(params);            // DNS解析优化
  overwriteTunnel(params);         // TUN虚拟网卡
  
  return params;
};

// ===================== 规则提供器工厂函数 =====================
/**
 * 创建标准规则提供器
 * @param {string} behavior - 规则行为类型 (ipcidr|domain|classical)
 * @param {string} url - 远程规则URL（完整路径）
 * @param {string} path - 本地缓存路径（完整路径）
 * @returns {Object} 规则提供器配置
 * 
 * 参数说明：
 * - behavior: 
 *   • ipcidr: IP段规则 
 *   • domain: 域名集规则
 *   • classical: 经典规则
 * - format: 固定为yaml（最佳兼容性）
 * - interval: 1800秒(30分钟)更新（平衡实时性和性能）
 * 
 * 最佳实践：
 * 1. 使用raw.githubusercontent保证规则源稳定性
 * 2. 本地路径保持与远程路径对应关系
 */
function createRuleProvider(behavior, url, path) {
  return {
    type: "http",
    behavior: behavior,
    format: "yaml",
    interval: 1800, // 30分钟更新一次
    url: url,
    path: path
  };
}

/**
 * 创建自定义规则提供器
 * @param {string} url - 远程规则URL
 * @param {string} path - 本地缓存路径
 * @returns {Object} 自定义规则提供器
 */
function createCustomRuleProvider(url, path) {
  return {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400, // 24小时更新一次
    url: url,
    path: path
  };
}

// ===================== 基础设置模块 =====================
/**
 * 覆盖基础网络配置
 * @param {Object} params 配置对象
 * 
 * 关键配置说明：
 * - mixed-port: 7890（Clash标准混合端口）
 * - allow-lan: 允许局域网连接（共享代理必备）
 * - unified-delay: 统一延迟测量（确保节点选择准确性）
 * - tcp-concurrent: TCP并发检测（提升测速准确性）
 * - geodata-mode: 启用Geodata（地理规则必需）
 * - fakeind-process-mode: strict（严格Fake-IP处理）
 * - global-client-fingerprint: chrome（伪装浏览器指纹）
 * - ipv6: 启用IPv6（未来兼容性）
 * - mode: rule（规则模式）
 * 
 * 优化建议：
 * 1. 保持mixed-port默认值确保兼容
 * 2. 生产环境建议开启unified-delay和tcp-concurrent
 */
function overwriteBasicOptions(params) {
  Object.assign(params, {
    "mixed-port": 7890,
    "allow-lan": true,
    "unified-delay": true,
    "tcp-concurrent": true,
    "geodata-mode": true,
    "fakeind-process-mode": "strict",
    "global-client-fingerprint": "chrome",
    profile: { 
      "store-selected": true,
      "store-fake-ip": true
    },
    ipv6: true,
    mode: "rule",
    "skip-auth-prefixes": ["127.0.0.1/32"],
    "lan-allowed-ips": ["0.0.0.0/0", "::/0"]
  });
}

// ===================== 流量嗅探设置 =====================
/**
 * 配置流量嗅探参数
 * @param {Object} params 配置对象
 * 
 * 功能说明：
 * 1. 自动识别HTTP/TLS流量真实目标
 * 2. 绕过特定域名和IP的嗅探
 * 
 * 关键参数：
 * - enable: 开启嗅探（必需）
 * - force-dns-mapping: 强制DNS映射（提升准确性）
 * - parse-pure-ip: 解析纯IP流量（增强兼容性）
 * - ports: 限定嗅探端口（80/443）
 * - skip-domain: 跳过Apple推送服务（避免干扰）
 * - skip-dst-address: 跳过Telegram等服务的IP段
 * 
 * 性能提示：
 * 嗅探会轻微增加CPU负载（<5%），但对复杂网络环境至关重要
 */
function overwriteSniffer(params) {
  params.sniffer = {
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    "override-destination": false,
    sniff: {
      HTTP: { 
        ports: ["80", "443"],
        "override-destination": false 
      },
      TLS: { 
        ports: ["443"]
      }
    },
    "skip-domain": ["+.push.apple.com"],
    "skip-dst-address": [
      "91.105.192.0/23", "91.108.4.0/22", "91.108.8.0/21", 
      "91.108.16.0/21", "91.108.56.0/22", "95.161.64.0/20",
      "149.154.160.0/20", "185.76.151.0/24", 
      "2001:67c:4e8::/48", "2001:b28:f23c::/47", 
      "2001:b28:f23f::/48", "2a0a:f280:203::/48"
    ]
  };
}

// ===================== 代理组配置模块 =====================
/**
 * 创建代理组架构
 * @param {Object} params 配置对象
 * 
 * 架构组成：
 * 1. 地区分组（自动/手动）
 * 2. 核心功能组（延迟/故障/负载）
 * 3. 服务组（流媒体/AI/游戏）
 * 4. 特殊组（住宅IP/低倍率）
 * 5. 自定义组（用户规则）
 * 
 * 优化特点：
 * - 智能地区检测：自动识别节点所属地区
 * - 动态组创建：仅当存在对应节点时创建特殊组
 * - 图标系统：可视化分组标识
 * - 隐藏技术组：减少用户界面干扰
 */
function overwriteProxyGroups(params) {
  // 节点过滤正则（排除无效节点）
  const PROXY_REGEX = /^(?!.*(?:自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire)).*$/;
  
  // 特殊节点正则
  const RESIDENTIAL_REGEX = /(家宽|原生|residential|home)/i;
  const LOW_RATE_REGEX = /(低倍率|lowrate|low-rate|倍率)/i;
  
  // 创建地区代理组
  const regionGroups = createRegionGroups(params, COUNTRY_REGIONS);
  
  // 创建特殊节点组
  const specialGroups = createSpecialGroups(params, RESIDENTIAL_REGEX, LOW_RATE_REGEX);
  const hasResidential = specialGroups.residential.length > 0;
  const hasLowRate = specialGroups.lowRate.length > 0;
  
  // 创建核心功能组
  const coreGroups = createCoreGroups(params, hasResidential, hasLowRate);
  
  // 创建服务组
  const serviceGroups = createServiceGroups(hasResidential, hasLowRate);
  
  // 创建自定义规则组
  const customRuleGroups = createCustomRuleGroups(hasResidential, hasLowRate);

  // 合并所有代理组
  params["proxy-groups"] = [
    ...coreGroups,
    ...regionGroups.auto,
    ...regionGroups.manual,
    ...serviceGroups,
    ...customRuleGroups,
    ...(hasResidential ? [createResidentialGroup(specialGroups.residential)] : []),
    ...(hasLowRate ? [createLowRateGroup(specialGroups.lowRate)] : [])
  ];
  
  // 存储特殊组状态供规则模块使用
  params.__hasResidential = hasResidential;
  params.__hasLowRate = hasLowRate;
}

// ===================== 代理组工具函数 =====================
/**
 * 创建地区代理组
 * @param {Object} params 配置对象
 * @param {Array} regions 地区配置数组
 * @returns {Object} 自动组和手动组
 * 
 * 组类型说明：
 * - 自动选择组：fallback类型，自动选择最佳节点
 * - 手动选择组：select类型，用户手动选择
 * 
 * 优化点：
 * - 隐藏自动组：减少用户界面干扰
 * - 容错处理：无节点时使用DIRECT兜底
 */
function createRegionGroups(params, regions) {
  const availableRegions = new Set();
  
  // 检测可用地区
  params.proxies.forEach(proxy => {
    const region = regions.find(r => r.regex.test(proxy.name));
    region && availableRegions.add(region.name);
  });

  // 创建自动选择组
  const autoGroups = regions
    .filter(r => availableRegions.has(r.name))
    .map(region => ({
      name: `${region.name} - 自动选择`,
      type: "fallback",
      url: TEST_URL,
      interval: 300,
      tolerance: 50,
      proxies: getProxiesByRegex(params, region.regex, ["DIRECT"]),
      hidden: true
    }))
    .filter(g => g.proxies.length > 0);

  // 创建手动选择组
  const manualGroups = regions
    .filter(r => availableRegions.has(r.name))
    .map(region => ({
      name: `${region.name} - 手动选择`,
      type: "select",
      proxies: getProxiesByRegex(params, region.regex, ["手动选择"]),
      icon: region.icon,
      hidden: false
    }))
    .filter(g => g.proxies.length > 0);

  return { auto: autoGroups, manual: manualGroups };
}

/**
 * 创建特殊节点组
 * @param {Object} params 配置对象
 * @param {RegExp} residentialRegex 住宅IP正则
 * @param {RegExp} lowRateRegex 低倍率正则
 * @returns {Object} 住宅IP和低倍率节点列表
 * 
 * 说明：
 * 特殊节点组不会直接创建，仅返回节点列表
 * 实际创建在overwriteProxyGroups中按需进行
 */
function createSpecialGroups(params, residentialRegex, lowRateRegex) {
  return {
    residential: getProxiesByRegex(params, residentialRegex),
    lowRate: getProxiesByRegex(params, lowRateRegex)
  };
}

/**
 * 创建住宅IP节点组
 * @param {Array} proxies 节点列表
 * @returns {Object} 代理组配置
 * 
 * 特点：
 * - 用户可见（hidden: false）
 * - 显示房屋图标
 */
function createResidentialGroup(proxies) {
  return {
    name: RESIDENTIAL_GROUP,
    type: "select",
    icon: `${ICON_BASE}/home.svg`,
    proxies: proxies,
    hidden: false
  };
}

/**
 * 创建低倍率节点组
 * @param {Array} proxies 节点列表
 * @returns {Object} 代理组配置
 * 
 * 特点：
 * - 用户可见（hidden: false）
 * - 显示电池图标（象征节省资源）
 */
function createLowRateGroup(proxies) {
  return {
    name: LOW_RATE_GROUP,
    type: "select",
    icon: `${ICON_BASE}/battery.svg`,
    proxies: proxies,
    hidden: false
  };
}

/**
 * 创建核心功能组
 * @param {Object} params 配置对象
 * @param {boolean} hasResidential 是否存在住宅IP
 * @param {boolean} hasLowRate 是否存在低倍率
 * @returns {Array} 核心代理组数组
 * 
 * 包含组：
 * 1. 主代理组（策略入口）
 * 2. 延迟优选组
 * 3. 故障转移组
 * 4. 手动选择组
 * 5. 负载均衡组（散列/轮询）
 * 
 * 设计原则：
 * - 技术组隐藏（hidden: true）
 * - 负载均衡提供两种策略
 */
function createCoreGroups(params, hasResidential, hasLowRate) {
  // 获取有效代理节点
  const PROXY_REGEX = /^(?!.*(?:自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire)).*$/;
  const allProxies = getProxiesByRegex(params, PROXY_REGEX);
  const availableRegions = new Set();
  
  // 收集可用地区
  params.proxies.forEach(proxy => {
    const region = COUNTRY_REGIONS.find(r => r.regex.test(proxy.name));
    region && availableRegions.add(region.name);
  });

  return [
    // 主代理组（策略入口）
    createProxyGroup(PROXY_NAME, "select", {
      proxies: [
        "延迟优选", 
        "故障转移", 
        "手动选择", 
        ...(hasResidential ? [RESIDENTIAL_GROUP] : []),
        ...(hasLowRate ? [LOW_RATE_GROUP] : []),
        "负载均衡 (散列)", 
        "负载均衡 (轮询)", 
        "DIRECT"
      ],
      icon: `${ICON_BASE}/adjust.svg`
    }),
    
    // 延迟优选组
    createProxyGroup("延迟优选", "url-test", {
      "exclude-filter": "自动选择|手动选择",
      proxies: allProxies.length ? allProxies : ["DIRECT"],
      icon: `${ICON_BASE}/speed.svg`,
      hidden: true
    }),
    
    // 故障转移组
    createProxyGroup("故障转移", "fallback", {
      "exclude-filter": "自动选择|手动选择",
      proxies: allProxies.length ? allProxies : ["DIRECT"],
      icon: `${ICON_BASE}/ambulance.svg`,
      hidden: true
    }),
    
    // 手动选择组（地区组入口）
    createProxyGroup("手动选择", "select", {
      proxies: COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))
        .flatMap(r => [`${r.name} - 自动选择`, `${r.name} - 手动选择`]),
      icon: `${ICON_BASE}/link.svg`
    }),
    
    // 负载均衡组（散列策略）
    createProxyGroup("负载均衡 (散列)", "load-balance", {
      strategy: "consistent-hashing",
      "exclude-filter": "自动选择|手动选择",
      proxies: allProxies.length ? allProxies : ["DIRECT"],
      icon: `${ICON_BASE}/balance.svg`,
      hidden: true
    }),
    
    // 负载均衡组（轮询策略）
    createProxyGroup("负载均衡 (轮询)", "load-balance", {
      strategy: "round-robin",
      "exclude-filter": "自动选择|手动选择",
      proxies: allProxies.length ? allProxies : ["DIRECT"],
      icon: `${ICON_BASE}/merry_go.svg`,
      hidden: true
    })
  ];
}

/**
 * 创建服务组
 * @param {boolean} hasResidential 是否存在住宅IP
 * @param {boolean} hasLowRate 是否存在低倍率
 * @returns {Array} 服务代理组数组
 * 
 * 包含服务：
 * - 电报消息
 * - AI服务
 * - 流媒体
 * - 苹果服务
 * - 微软服务
 * - Google FCM
 * - Steam地区
 * - 漏网之鱼（兜底组）
 * 
 * 设计特点：
 * 每个服务组包含所有可用节点类型
 * 用户可根据服务特性选择最佳节点
 */
function createServiceGroups(hasResidential, hasLowRate) {
  const createServiceGroup = (name, icon) => {
    // 收集所有可用节点类型
    const proxies = [PROXY_NAME];
    COUNTRY_REGIONS.forEach(r => {
      proxies.push(`${r.name} - 自动选择`, `${r.name} - 手动选择`);
    });
    if (hasResidential) proxies.push(RESIDENTIAL_GROUP);
    if (hasLowRate) proxies.push(LOW_RATE_GROUP);
    proxies.push(CUSTOM_PROXY_GROUP, CUSTOM_DIRECT_GROUP, "DIRECT");
    
    return createProxyGroup(name, "select", {
      proxies,
      icon: `${ICON_BASE}/${icon}`
    });
  };

  return [
    createServiceGroup("电报消息", "telegram.svg"),
    createServiceGroup("AI", "chatgpt.svg"),
    createServiceGroup("流媒体", "youtube.svg"),
    createServiceGroup("苹果服务", "apple.svg"),
    createServiceGroup("微软服务", "microsoft.svg"),
    createServiceGroup("GoogleFCM", "google.svg"),
    createServiceGroup("Steam地区", "steam.svg"),
    // 漏网之鱼组（兜底策略）
    createProxyGroup("漏网之鱼", "select", {
      proxies: ["DIRECT", PROXY_NAME],
      icon: `${ICON_BASE}/fish.svg`
    })
  ];
}

/**
 * 创建自定义规则组
 * @param {boolean} hasResidential 是否存在住宅IP
 * @param {boolean} hasLowRate 是否存在低倍率
 * @returns {Array} 自定义规则组数组
 * 
 * 包含组：
 * 1. 自定义代理规则组
 * 2. 自定义直连规则组
 * 
 * 功能说明：
 * 允许用户添加特殊规则，优先级高于系统规则
 * 提供完整的策略选项供用户选择
 */
function createCustomRuleGroups(hasResidential, hasLowRate) {
  return [
    // 自定义代理规则组
    {
      name: CUSTOM_PROXY_GROUP,
      type: "select",
      icon: `${ICON_BASE}/proxy-custom.svg`,
      proxies: [
        "手动选择", 
        "延迟优选",
        "故障转移",
        ...(hasResidential ? [RESIDENTIAL_GROUP] : []),
        ...(hasLowRate ? [LOW_RATE_GROUP] : []),
        "DIRECT",
        "REJECT"
      ],
      hidden: false
    },
    // 自定义直连规则组
    {
      name: CUSTOM_DIRECT_GROUP,
      type: "select",
      icon: `${ICON_BASE}/direct-custom.svg`,
      proxies: [
        "DIRECT",
        "延迟优选", 
        "故障转移",
        ...(hasResidential ? [RESIDENTIAL_GROUP] : []),
        ...(hasLowRate ? [LOW_RATE_GROUP] : []),
        "REJECT"
      ],
      hidden: false
    }
  ];
}

// ===================== 规则配置模块 =====================
/**
 * 覆盖规则配置
 * @param {Object} params 配置对象
 * 
 * 架构特点：
 * 1. 分层规则链（10层结构）
 * 2. 动态策略选择（根据节点类型）
 * 3. 规则提供器工厂创建
 * 
 * 性能优化：
 * - 高频规则前置（减少匹配次数）
 * - IP规则后置（域名匹配优先）
 * - 地理规则兜底
 */
function overwriteRules(params) {
  // 获取特殊组状态
  const hasResidential = params.__hasResidential || false;
  const hasLowRate = params.__hasLowRate || false;
  
  // 动态策略选择
  const cdnProxy = hasLowRate ? LOW_RATE_GROUP : PROXY_NAME;
  const downloadProxy = hasLowRate ? LOW_RATE_GROUP : PROXY_NAME;
  const residentialProxy = hasResidential ? RESIDENTIAL_GROUP : PROXY_NAME;
  
  // 创建规则提供器
  params["rule-providers"] = createRuleProviders();
  
  // 构建优化规则链
  params.rules = buildOptimizedRuleChain(
    cdnProxy, 
    downloadProxy, 
    residentialProxy,
    PROXY_NAME,
    CUSTOM_PROXY_GROUP,
    CUSTOM_DIRECT_GROUP
  );
}

/**
 * 创建所有规则提供器
 * @returns {Object} 规则提供器集合
 * 
 * 规则分类：
 * 1. REJECT: 广告拦截类
 * 2. DIRECT: 直连类
 * 3. PROXY: 代理类
 * 4. CUSTOM: 自定义类
 * 
 * 路径规范：
 * - 远程URL: GitHub raw路径
 * - 本地路径: 保持相同目录结构
 */
function createRuleProviders() {
  return {
    // === 广告拦截规则集 ===
    Reject_ip: createRuleProvider(
      "ipcidr",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/ip/Reject_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/ip/Reject_ip.yaml"
    ),
    Reject_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_no_ip.yaml"
    ),
    Reject_domainset: createRuleProvider(
      "domain",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_domainset.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_domainset.yaml"
    ),
    Reject_no_ip_drop: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_drop.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_no_ip_drop.yaml"
    ),
    Reject_no_ip_no_drop: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_no_drop.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_no_ip_no_drop.yaml"
    ),
    
    // === 直连规则集 ===
    China_ip: createRuleProvider(
      "ipcidr",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/China_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/China_ip.yaml"
    ),
    Domestic_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Domestic_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/Domestic_ip.yaml"
    ),
    GoogleFCM_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/GoogleFCM_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/GoogleFCM_ip.yaml"
    ),
    Lan_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Lan_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/Lan_ip.yaml"
    ),
    SteamCN_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/SteamCN_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/SteamCN_ip.yaml"
    ),
    MicrosoftCDN_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/MicrosoftCDN_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/MicrosoftCDN_no_ip.yaml"
    ),
    Domestic_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Domestic_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/Domestic_no_ip.yaml"
    ),
    GoogleFCM_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/GoogleFCM_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/GoogleFCM_no_ip.yaml"
    ),
    Lan_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Lan_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/Lan_no_ip.yaml"
    ),
    SteamCN_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/SteamCN_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/SteamCN_no_ip.yaml"
    ),
    SteamRegion_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/SteamRegion_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/SteamRegion_no_ip.yaml"
    ),
    
    // === 代理规则集 ===
    Stream_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Stream_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/ip/Stream_ip.yaml"
    ),
    Stream_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Stream_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Stream_no_ip.yaml"
    ),
    Telegram_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Telegram_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/ip/Telegram_ip.yaml"
    ),
    AI_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/AI_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/AI_no_ip.yaml"
    ),
    CDN_domainset: createRuleProvider(
      "domain",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_domainset.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/CDN_domainset.yaml"
    ),
    CDN_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/CDN_no_ip.yaml"
    ),
    Download_domainset: createRuleProvider(
      "domain",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_domainset.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Download_domainset.yaml"
    ),
    Download_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Download_no_ip.yaml"
    ),
    Global_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Global_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Global_no_ip.yaml"
    ),
    Microsoft_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Microsoft_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Microsoft_no_ip.yaml"
    ),
    Steam_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Steam_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Steam_no_ip.yaml"
    ),
    Telegram_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Telegram_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Telegram_no_ip.yaml"
    ),
    Update_no_ip: createRuleProvider(
      "classical",
      "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Update_no_ip.yaml",
      "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Update_no_ip.yaml"
    ),
    
    // === 自定义规则集 ===
    CustomProxyRules: createCustomRuleProvider(
      "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnPROXYRules.list",
      "./ruleset/OwnRules/OwnPROXYRules.yaml"
    ),
    CustomDirectRules: createCustomRuleProvider(
      "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnDIRECTRules.list",
      "./ruleset/OwnRules/OwnDIRECTRules.yaml"
    )
  };
}

/**
 * 构建优化规则链
 * @param {string} cdnProxy CDN代理策略
 * @param {string} downloadProxy 下载代理策略
 * @param {string} residentialProxy 住宅代理策略
 * @returns {Array} 规则链数组
 * 
 * 规则链层次结构：
 * 1. 高频拦截规则（广告/恶意软件）
 * 2. 用户自定义规则（最高优先级）
 * 3. 直连规则（国内流量）
 * 4. 特殊服务规则（推送/游戏）
 * 5. 流量优化规则（CDN/下载）
 * 6. 质量敏感服务（流媒体/AI）
 * 7. 通用代理规则
 * 8. IP级规则
 * 9. 地理规则（兜底）
 * 10. 最终匹配
 */
function buildOptimizedRuleChain(
  cdnProxy, 
  downloadProxy, 
  residentialProxy,
  PROXY_NAME,
  CUSTOM_PROXY_GROUP,
  CUSTOM_DIRECT_GROUP
) {
  return [
    // 第1层：高频拦截（广告/恶意软件）
    "RULE-SET,Reject_no_ip,REJECT",
    "RULE-SET,Reject_domainset,REJECT",
    "RULE-SET,Reject_no_ip_drop,REJECT-DROP",
    "RULE-SET,Reject_no_ip_no_drop,REJECT",
    
    // 第2层：用户自定义规则
    "RULE-SET,CustomProxyRules," + CUSTOM_PROXY_GROUP,
    "RULE-SET,CustomDirectRules," + CUSTOM_DIRECT_GROUP,
    
    // 第3层：直连规则（减少代理压力）
    "RULE-SET,Domestic_no_ip,DIRECT",
    "RULE-SET,Lan_no_ip,DIRECT",
    "RULE-SET,MicrosoftCDN_no_ip,DIRECT",
    
    // 第4层：特殊服务（推送/游戏）
    "RULE-SET,GoogleFCM_no_ip,GoogleFCM",
    "RULE-SET,SteamRegion_no_ip,Steam地区",
    
    // 第5层：流量优化（CDN/下载）
    "RULE-SET,CDN_domainset," + cdnProxy,
    "RULE-SET,CDN_no_ip," + cdnProxy,
    "RULE-SET,Download_domainset," + downloadProxy,
    "RULE-SET,Download_no_ip," + downloadProxy,
    "RULE-SET,Update_no_ip," + downloadProxy,
    
    // 第6层：质量敏感服务（需要高质量节点）
    "RULE-SET,Stream_no_ip,流媒体",
    "RULE-SET,AI_no_ip," + residentialProxy,
    
    // 第7层：其他代理规则
    "RULE-SET,Telegram_no_ip,电报消息",
    "RULE-SET,Microsoft_no_ip,微软服务",
    "RULE-SET,Global_no_ip," + PROXY_NAME,
    
    // 第8层：IP规则（放在域名规则后）
    "RULE-SET,GoogleFCM_ip,GoogleFCM",
    "RULE-SET,Reject_ip,REJECT",
    "RULE-SET,Telegram_ip,电报消息",
    "RULE-SET,Stream_ip," + residentialProxy,
    "RULE-SET,Domestic_ip,DIRECT",
    "RULE-SET,China_ip,DIRECT",
    "RULE-SET,Lan_ip,DIRECT",
    
    // 第9层：地理规则（兜底）
    "GEOIP,CN,DIRECT",
    "GEOSITE,cn,DIRECT",
    
    // 第10层：最终匹配
    "MATCH,漏网之鱼"
  ];
}

// ===================== 实用工具函数 =====================
/**
 * 通过正则获取代理节点
 * @param {Object} params 配置对象
 * @param {RegExp} regex 匹配正则
 * @param {Array} [fallback=["DIRECT"]] 备选列表
 * @returns {Array} 匹配的节点名称数组
 * 
 * 功能说明：
 * 1. 过滤出名称匹配正则的节点
 * 2. 无匹配时返回备选列表
 * 3. 默认备选为DIRECT（直连）
 */
function getProxiesByRegex(params, regex, fallback = ["DIRECT"]) {
  // 空指针防护
  if (!params || !params.proxies || !Array.isArray(params.proxies)) {
    return fallback;
  }
  
  const matched = params.proxies
    .filter(e => regex.test(e.name))
    .map(e => e.name);
    
  return matched.length ? matched : fallback;
}

/**
 * 创建代理组
 * @param {string} name 组名称
 * @param {string} type 组类型
 * @param {Object} [options={}] 额外选项
 * @returns {Object} 代理组配置
 * 
 * 支持类型：
 * - select: 手动选择
 * - url-test: 延迟测试
 * - fallback: 故障转移
 * - load-balance: 负载均衡
 * 
 * 自动配置：
 * - url-test/fallback: 自动添加测试URL和间隔
 * - load-balance: 添加负载均衡参数
 */
function createProxyGroup(name, type, options = {}) {
  const base = { 
    name, 
    type, 
    url: type !== "select" ? TEST_URL : undefined, 
    interval: type !== "select" ? 300 : undefined
  };
  
  // 负载均衡特殊配置
  if (type === "load-balance") {
    Object.assign(options, {
      "max-failed-times": 3,
      lazy: true
    });
  }
  
  return Object.assign(base, options);
}

// ===================== DNS配置模块 =====================
/**
 * 覆盖DNS配置
 * @param {Object} params 配置对象
 * 
 * 优化目标：
 * 1. 减少DNS查询延迟
 * 2. 防止DNS污染
 * 3. 节省电量（减少无线电活动）
 * 
 * 核心配置：
 * - fake-ip-range: 198.18.0.1/16（标准假IP段）
 * - fake-ip-filter: 精简列表（减少干扰）
 * - nameserver: 国内可靠DNS
 * - proxy-server-nameserver: 国外可靠DNS
 * - fallback: 备用DNS
 * - fallback-filter: 智能回退过滤
 */
function overwriteDns(params) {
    params.dns = {
        enable: true,
        listen: "0.0.0.0:1053",     // 监听所有接口
        "enhanced-mode": "fake-ip",  // 假IP模式（最佳兼容性）
        "fake-ip-range": "198.18.0.1/16", // 标准假IP段
        "use-hosts": false,          // 禁用hosts（避免冲突）
        "use-system-hosts": false,    // 禁用系统hosts
        ipv6: false,                 // 禁用IPv6 DNS（减少查询）
        "fake-ip-filter": [          // 精简过滤列表
            "*.lan", "*.local", "*.home",  // 本地域名
            "time.*.com", "ntp.*.com",    // 时间服务
            "*.msftconnecttest.com", "*.msftncsi.com", // 微软连接测试
            "localhost.*"                 // 本地主机
        ],
        "default-nameserver": [      // 初始DNS（必须可靠）
            "tls://223.5.5.5",       // 阿里DNS
            "tls://1.12.12.12"        // DNSPod
        ],
        nameserver: [               // 常规查询DNS
            "https://dns.alidns.com/dns-query",  // 阿里DoH
            "https://doh.pub/dns-query"           // 腾讯DoH
        ],
        "proxy-server-nameserver": [ // 代理使用的DNS
            "tls://8.8.8.8",         // Google DNS
            "tls://1.1.1.1"          // Cloudflare DNS
        ],
        fallback: [                 // 备用DNS
            "tls://8.8.4.4",         // Google备用
            "tls://1.0.0.1"          // Cloudflare备用
        ],
        "fallback-filter": {         // 回退过滤规则
            "geoip": true,           // 非中国IP使用回退
            "ipcidr": [              // 指定IP段使用回退
                "240.0.0.0/4",       // 保留IP段
                "0.0.0.0/32"         // 无效地址
            ]
        }
    };
}

// ===================== TUN配置模块 =====================
/**
 * 覆盖TUN配置
 * @param {Object} params 配置对象
 * 
 * 功能说明：
 * 1. 创建虚拟网卡实现全局代理
 * 2. 自动路由流量
 * 3. 智能接口检测
 * 
 * 关键参数：
 * - stack: mixed（混合IPv4/IPv6栈）
 * - dns-hijack: 劫持所有DNS请求
 * - auto-route: 自动路由流量（必需）
 * - auto-redirect: 禁用自动重定向（避免冲突）
 * - mtu: 1500（标准MTU大小）
 * - route-exclude-address: 排除组播地址
 */
function overwriteTunnel(params) {
    params.tun = {
        enable: true,
        stack: "mixed",             // 混合协议栈
        device: "Mihomo",            // 设备名称
        "dns-hijack": ["any:53"],   // 劫持所有DNS
        "auto-route": true,          // 自动路由（必需）
        "auto-redirect": false,      // 禁用重定向（防冲突）
        "auto-detect-interface": true, // 自动检测接口
        "strict-route": false,       // 非严格路由（兼容性好）
        "route-exclude-address": [
            "239.255.255.250/32"    // 排除SSDP协议
        ],
        mtu: 1500                   // 标准MTU
    };
}
