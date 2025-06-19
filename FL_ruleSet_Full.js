/*** 
 * Clash Verge Rev 全局扩展脚本（带详细注释版）
 * 版本：3.1.4
 * 说明：本脚本提供高度可定制的策略组和规则管理，支持家宽节点优先、自定义规则等特性
 * 主要功能：
 * 1. 智能节点分组（家宽/低倍率优先）
 * 2. 自定义直连/代理规则
 * 3. 应用专属策略组
 * 4. 广告过滤和隐私保护
 * 5. 高性能分组算法
 * 
 * 使用建议：
 * - 修改配置请集中在顶部「配置分离区」
 * - 通过FEATURE_FLAGS开关功能模块
 * - 自定义规则通过外部列表维护
 */

// ================= 配置分离区（用户主要修改区域）=================
/**
 * 基础常量配置
 * 说明：控制脚本核心行为和全局设置
 * 修改建议：
 * - ICON_BASE_URL: 可替换为自定义图标库
 * - CUSTOM_RULES: 自定义规则链接（无需修改脚本即可更新规则）
 */
const CONFIG = {
  ENABLE: true, // 总开关，设为false可禁用整个脚本
  ICON_BASE_URL: "https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/", // 策略组图标库
  TEST_URLS: {
    // 各服务的测试URL（用于策略组延迟检测）
    DEFAULT: "http://cp.cloudflare.com/generate_204",
    YOUTUBE: "https://www.youtube.com/s/desktop/494dd881/img/favicon.ico",
    OPENAI: "https://chat.openai.com/cdn-cgi/trace",
    APPLE: "http://www.apple.com/library/test/success.html",
    GOOGLE: "http://www.google.com/generate_204",
    MICROSOFT: "http://www.msftconnecttest.com/connecttest.txt",
    GITHUB: "https://github.com/robots.txt",
    CHINA: "http://wifi.vivo.com.cn/generate_204" // 国内网站检测URL
  },
  MULTIPLIER_REGEX: /([xX✕✖⨉倍率])([0-9.]+)/i, // 倍率匹配正则
  RULE_PROVIDER_COMMON: { // 规则提供者通用设置
    type: 'http',
    format: 'yaml',
    interval: 86400, // 24小时更新一次
    compression: 'gzip'
  },
  GROUP_BASE_OPTION: { // 策略组基础设置
    interval: 300, // 5分钟检测一次
    timeout: 3000, // 3秒超时
    url: 'http://cp.cloudflare.com/generate_204', // 默认检测URL
    lazy: true,
    'max-failed-times': 3, // 最大失败次数
    hidden: false
  },
  // 自定义规则链接（用户维护位置）
  CUSTOM_RULES: {
    DIRECT: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/main/OwnRules/OwnDIRECTRules.list",
    PROXY: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/main/OwnRules/OwnPROXYRules.list"
  }
};

/**
 * 功能开关配置
 * 说明：按需启用/禁用特定功能模块
 * 修改建议：
 * - 关闭未使用的服务以减少策略组数量
 * - customRules: 自定义规则总开关
 */
const FEATURE_FLAGS = {
  apple: true,       // 苹果服务
  microsoft: true,   // 微软服务
  github: true,      // GitHub服务
  google: true,      // 谷歌服务
  openai: true,      // AI服务
  notion: true,      // Notion办公
  Onedrive: true,    // OneDrive
  GameStore: true,   // 游戏商店
  epicDownload: true,// Epic下载
  youtube: true,     // YouTube
  telegram: true,    // Telegram
  tracker: true,     // 跟踪器拦截
  BanAD: true,       // 广告过滤
  BanProgramAD: true,// 程序化广告拦截
  // 自定义规则开关（默认开启）
  customRules: true
};

/**
 * 规则配置
 * 说明：定义规则处理顺序
 * 修改建议：
 * - 在PRE_RULES添加高优先级规则
 * - 在POST_RULES调整最终匹配规则
 */
const RULE_CONFIG = {
  PRE_RULES: [
    'RULE-SET,applications,下载软件', // 应用规则
    'PROCESS-NAME,SunloginClient,DIRECT', // 特定进程直连
    'PROCESS-NAME,SunloginClient.exe,DIRECT',
    'PROCESS-NAME,AnyDesk,DIRECT',
    'PROCESS-NAME,AnyDesk.exe,DIRECT',
  ],
  POST_RULES: [
    'GEOSITE,private,DIRECT', // 私有网络
    'GEOIP,private,DIRECT,no-resolve',
    'GEOSITE,cn,国内网站',    // 国内流量
    'GEOIP,cn,国内网站,no-resolve',
    'MATCH,其他外网'          // 最终匹配规则
  ]
};

/**
 * 地区节点配置（核心分组设置）
 * 说明：定义节点分组规则，家宽/低倍率节点优先
 * 修改建议：
 * - 调整ratioLimit控制倍率筛选阈值
 * - 修改regex优化节点匹配
 * - 添加/删除地区分组
 */
const REGION_CONFIG = {
  excludeHighPercentage: true, // 排除高倍率节点
  regions: [
    { 
      name: '原生IP/家宽',  // 家宽节点组（最高优先级）
      regex: /原生|家宽|住宅|home|residential/i, 
      ratioLimit: 100,      // 倍率限制（100表示无限制）
      icon: 'Home'          // 图标名称
    },
    { 
      name: '低倍率',       // 低倍率节点组
      regex: /低倍率|0\.2|0.5|ratio|倍率低/i, 
      ratioLimit: 0.8,      // 只允许0.8倍率以下的节点
      icon: 'Speedtest'
    },
    // 以下为常规地区分组
    { 
      name: 'HK香港', 
      regex: /港|🇭🇰|hk|hongkong|hong kong/i, 
      ratioLimit: 2,        // 允许2倍率以下的节点
      icon: 'Hong_Kong'
    },
    { 
      name: 'US美国', 
      regex: /美|🇺🇸|us|united state|america/i, 
      ratioLimit: 2,
      icon: 'United_States'
    },
    { 
      name: 'JP日本', 
      regex: /日本|🇯🇵|jp|japan/i, 
      ratioLimit: 2,
      icon: 'Japan'
    },
    { 
      name: 'SG新加坡', 
      regex: /新加坡|🇸🇬|sg|singapore/i, 
      ratioLimit: 2,
      icon: 'Singapore'
    },
    { 
      name: 'TW台湾省', 
      regex: /台湾|🇹🇼|tw|taiwan|tai wan/i, 
      ratioLimit: 2,
      icon: 'China'
    }
  ]
};

/**
 * DNS配置（高级设置）
 * 说明：DNS解析相关配置
 * 修改建议：
 * - 普通用户无需修改
 * - 高级用户可调整fake-ip-filter和nameserver
 */
const DNS_CONFIG = {
  enable: true,
  listen: ':1053',
  ipv6: true,
  'prefer-h3': true, // 优先HTTP/3
  'use-hosts': true,
  'use-system-hosts': true,
  'respect-rules': true,
  'enhanced-mode': 'fake-ip', // 使用fake-ip模式
  'fake-ip-range': '198.18.0.1/16',
  'fake-ip-filter': ['*', '+.lan', '+.local', '+.market.xiaomi.com'], // 不使用fake-ip的域名
  nameserver: ['https://120.53.53.53/dns-query', 'https://223.5.5.5/dns-query'], // 默认DNS
  'proxy-server-nameserver': ['https://120.53.53.53/dns-query', 'https://223.5.5.5/dns-query'], // 代理模式DNS
  'ssl-verification': true,
  cache: true,
  'cache-size': 4096, // DNS缓存大小
  'cache-ttl-min': 600, // 最小缓存时间(秒)
  'cache-ttl-max': 3600, // 最大缓存时间(秒)
  'nameserver-policy': { // 特定域名DNS策略
    'geosite:private': 'system',
    'geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn': ['119.29.29.29', '223.5.5.5']
  }
};

/**
 * 基础规则集配置
 * 说明：预定义的规则集来源
 * 修改建议：
 * - 添加自定义规则源
 * - 调整path设置本地存储路径
 */
const BASE_RULE_PROVIDERS = {
  applications: { // 应用程序规则
    behavior: 'classical',
    format: 'text',
    url: 'https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@clash-ruleset/applications.list',
    path: './ruleset/toookamak/applications.list'
  },
  adblockmihomo: { // 广告过滤规则
    behavior: 'domain',
    format: 'mrs',
    url: 'https://github.com/217heidai/adblockfilters/raw/refs/heads/main/rules/adblockmihomo.mrs',
    path: './ruleset/toookamak/adblockmihomo.mrs'
  },
  ai: { // AI服务规则
    behavior: 'classical',
    format: 'text',
    url: 'https://github.com/dahaha-365/YaNet/raw/refs/heads/dist/rulesets/mihomo/ai.list',
    path: './ruleset/toookamak/ai.list'
  },
  epicDownload: { // Epic游戏规则
    behavior: 'classical',
    format: 'text',
    url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Epic/Epic.list',
    path: './ruleset/toookamak/Epic.list'
  },
  // 自定义规则集（用户维护）
  own_direct: {
    behavior: 'classical',
    format: 'text',
    url: CONFIG.CUSTOM_RULES.DIRECT, // 直连规则列表
    path: './ruleset/toookamak/own_direct.list'
  },
  own_proxy: {
    behavior: 'classical',
    format: 'text',
    url: CONFIG.CUSTOM_RULES.PROXY, // 代理规则列表
    path: './ruleset/toookamak/own_proxy.list'
  }
};

// ================= 功能模块区（一般无需修改）=================
/**
 * 代理组创建器
 * 说明：策略组工厂方法，统一创建策略组
 * 注意：修改此处会影响所有策略组生成
 */
const GroupFactory = {
  /**
   * 创建基础策略组
   */
  createBaseGroup(options) {
    return { ...CONFIG.GROUP_BASE_OPTION, ...options };
  },

  /**
   * 创建应用策略组（含延迟优选）
   */
  createAppGroup(options) {
    return this.createBaseGroup({
      ...options,
      proxies: ['延迟优选', ...(options.proxies || [])]
    });
  },

  /**
   * 创建地区策略组
   */
  createRegionGroup(region) {
    return this.createBaseGroup({
      name: region.name,
      type: 'url-test', // 自动选择延迟最低节点
      tolerance: 50,    // 50ms容差
      icon: `${CONFIG.ICON_BASE_URL}${region.icon}.png`,
      proxies: []
    });
  }
};

/**
 * 规则管理器
 * 说明：管理所有规则集和规则处理逻辑
 * 高级用法：
 * - 在addFeatureRules中添加自定义规则
 * - 在registerConditionalProviders添加条件规则
 */
const RuleManager = {
  ruleProviders: null, // 规则提供者缓存
  
  // 获取规则提供者（延迟加载）
  getRuleProviders() {
    if (!this.ruleProviders) {
      this.ruleProviders = this.initRuleProviders();
    }
    return this.ruleProviders;
  },
  
  /**
   * 初始化规则提供者
   */
  initRuleProviders() {
    const providers = new Map();
    
    // 注册基础规则集
    Object.entries(BASE_RULE_PROVIDERS).forEach(([key, config]) => {
      providers.set(key, { ...CONFIG.RULE_PROVIDER_COMMON, ...config });
    });
    
    // 注册条件规则集
    this.registerConditionalProviders(providers);
    
    return providers;
  },

  /**
   * 注册条件规则集（按功能开关）
   */
  registerConditionalProviders(providers) {
    if (FEATURE_FLAGS.notion) {
      providers.set('notion', {
        ...CONFIG.RULE_PROVIDER_COMMON,
        behavior: 'classical',
        format: 'text',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Notion/Notion.list',
        path: './ruleset/toookamak/notion.list'
      });
      
      providers.set('figma_in_notion', {
        ...CONFIG.RULE_PROVIDER_COMMON,
        behavior: 'classical',
        format: 'text',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Figma/Figma.list',
        path: './ruleset/toookamak/figma.list'
      });
    }
  },

  /**
   * 构建规则列表
   * 规则优先级：
   * 1. 预定义规则(PRE_RULES)
   * 2. 自定义规则
   * 3. 功能规则
   * 4. 基础规则(POST_RULES)
   */
  buildRules() {
    const rules = [...RULE_CONFIG.PRE_RULES];
    
    // 添加自定义规则（高优先级）
    if (FEATURE_FLAGS.customRules) {
      rules.push(
        'RULE-SET,own_direct,自定义直连',
        'RULE-SET,own_proxy,自定义代理'
      );
    }
    
    // 添加功能规则
    this.addFeatureRules(rules);
    
    // 添加基础规则
    rules.push(...RULE_CONFIG.POST_RULES);
    
    return rules;
  },

  /**
   * 添加功能相关规则
   * 扩展点：在此处添加自定义服务规则
   */
  addFeatureRules(rules) {
    // Notion办公
    if (FEATURE_FLAGS.notion) {
      rules.push('RULE-SET,notion,Notion办公', 'RULE-SET,figma_in_notion,Notion办公');
    }
    
    // 国外AI
    if (FEATURE_FLAGS.openai) {
      rules.push(
        'DOMAIN-SUFFIX,grazie.ai,国外AI',
        'DOMAIN-SUFFIX,grazie.aws.intellij.net,国外AI',
        'RULE-SET,ai,国外AI'
      );
    }
    
    // YouTube
    if (FEATURE_FLAGS.youtube) {
      rules.push('GEOSITE,youtube,YouTube');
    }
    
    // Telegram
    if (FEATURE_FLAGS.telegram) {
      rules.push('GEOIP,telegram,Telegram');
    }
    
    // 跟踪分析
    if (FEATURE_FLAGS.tracker) {
      rules.push('GEOSITE,tracker,跟踪分析');
    }
    
    // 广告过滤
    if (FEATURE_FLAGS.BanAD) {
      rules.push('GEOSITE,category-ads-all,广告过滤', 'RULE-SET,adblockmihomo,广告过滤');
    }
    
    // 苹果服务
    if (FEATURE_FLAGS.apple) {
      rules.push('GEOSITE,apple-cn,苹果服务');
    }
    
    // 谷歌服务
    if (FEATURE_FLAGS.google) {
      rules.push('GEOSITE,google,谷歌服务');
    }
    
    // 微软服务
    if (FEATURE_FLAGS.microsoft) {
      rules.push('GEOSITE,microsoft@cn,国内网站', 'GEOSITE,microsoft,微软服务');
    }
    
    // GitHub服务
    if (FEATURE_FLAGS.github) {
      rules.push('GEOSITE,github,Github');
    }
    
    // Epic下载服务
    if (FEATURE_FLAGS.epicDownload) {
      rules.push('RULE-SET,epicDownload,虚幻引擎');
    }
  }
};

/**
 * 节点管理器
 * 说明：负责节点智能分组（家宽/低倍率优先）
 * 算法优化：单次遍历+缓存机制，高效处理大量节点
 */
const NodeManager = {
  /**
   * 按地区分组节点（核心算法）
   * 分组逻辑：
   * 1. 家宽节点优先
   * 2. 低倍率节点次优
   * 3. 常规地区节点
   * 4. 未分组节点归入"其他节点"
   */
  groupNodesByRegion(proxies) {
    const regionGroups = new Map();
    const groupedProxies = new Set();
    const regions = REGION_CONFIG.regions;
    
    // 预先创建分组对象
    regions.forEach(region => {
      regionGroups.set(region.name, {
        group: GroupFactory.createRegionGroup(region),
        region
      });
    });
    
    // 单次遍历处理所有节点（O(n)复杂度）
    proxies.forEach(proxy => {
      if (groupedProxies.has(proxy.name)) return;
      
      // 缓存倍率计算（提升性能）
      let multiplier = 0;
      if (!proxy._multiplier) {
        const match = proxy.name.match(CONFIG.MULTIPLIER_REGEX);
        proxy._multiplier = match && match[2] ? parseFloat(match[2]) : 0;
      }
      multiplier = proxy._multiplier;
      
      // 查找匹配的分组（家宽优先）
      const matchedRegion = regions.find(region => 
        region.regex.test(proxy.name) && multiplier <= region.ratioLimit
      );
      
      if (matchedRegion) {
        const groupObj = regionGroups.get(matchedRegion.name);
        groupObj.group.proxies.push(proxy.name);
        groupedProxies.add(proxy.name);
      }
    });
    
    // 过滤掉空分组
    const validGroups = Array.from(regionGroups.values())
      .filter(item => item.group.proxies.length > 0)
      .map(item => item.group);
    
    return {
      regionGroups: validGroups,
      ungrouped: proxies
        .map(p => p.name)
        .filter(name => !groupedProxies.has(name))
    };
  }
};

/**
 * 策略组构建器
 * 说明：创建所有策略组结构
 * 注意：此处已修复循环依赖问题
 */
const PolicyBuilder = {
  /**
   * 构建核心策略组
   * 包含：
   * - 代理模式（全局开关）
   * - 手动选择（所有节点）
   * - 延迟优选（自动选择）
   * - 故障转移（备用节点）
   */
  buildCoreGroups(regionGroups, ungroupedNodes) {
    const regionGroupNames = regionGroups.map(g => g.name);
    
    if (ungroupedNodes.length > 0) {
      regionGroupNames.push('其他节点');
    }
    
    return [
      // 代理模式选择组（策略总开关）
      GroupFactory.createBaseGroup({
        name: '代理模式',
        type: 'select',
        proxies: ['手动选择', '延迟优选', '故障转移', ...regionGroupNames, '直连'],
        icon: `${CONFIG.ICON_BASE_URL}Proxy.png`
      }),
      
      // 手动选择组（所有节点列表）
      GroupFactory.createBaseGroup({
        name: '手动选择',
        type: 'select',
        proxies: [], // 后续填充
        icon: `${CONFIG.ICON_BASE_URL}Global.png`
      }),
      
      // 延迟优选组（自动选择最佳节点）
      GroupFactory.createBaseGroup({
        name: '延迟优选',
        type: 'url-test',
        tolerance: 50,
        proxies: [...regionGroupNames],
        icon: `${CONFIG.ICON_BASE_URL}Speedtest.png`
      }),
      
      // 故障转移组（备用节点）
      GroupFactory.createBaseGroup({
        name: '故障转移',
        type: 'fallback',
        proxies: [...regionGroupNames],
        icon: `${CONFIG.ICON_BASE_URL}Final.png`
      })
    ];
  },

  /**
   * 构建自定义策略组
   * 说明：用户自定义规则对应的策略组
   * 使用建议：
   * - 在CUSTOM_RULES维护规则列表
   * - 通过FEATURE_FLAGS.customRules开关
   */
  buildCustomGroups() {
    if (!FEATURE_FLAGS.customRules) return [];
    
    return [
      // 自定义直连组
      GroupFactory.createBaseGroup({
        name: '自定义直连',
        type: 'select',
        proxies: ['直连', '国内网站'], // 无循环依赖
        icon: `${CONFIG.ICON_BASE_URL}Direct.png`
      }),
      
      // 自定义代理组
      GroupFactory.createBaseGroup({
        name: '自定义代理',
        type: 'select',
        proxies: ['其他外网', '国内网站', '直连', '延迟优选'], 
        icon: `${CONFIG.ICON_BASE_URL}Proxy.png`
      })
    ];
  },

  /**
   * 构建应用策略组
   * 说明：按应用/服务创建专属策略组
   * 配置建议：
   * - 通过FEATURE_FLAGS控制是否创建
   * - 在RULE_CONFIG添加对应规则
   */
  buildAppGroups(regionGroups) {
    const regionGroupNames = regionGroups.map(g => g.name);
    const appGroups = [];
    
    // Notion办公
    if (FEATURE_FLAGS.notion) {
      appGroups.push(GroupFactory.createAppGroup({
        name: 'Notion办公',
        type: 'select',
        proxies: [...regionGroupNames, '直连'],
        icon: `${CONFIG.ICON_BASE_URL}Notion.png`
      }));
    }
    
    // 国外AI（ChatGPT等）
    if (FEATURE_FLAGS.openai) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '国外AI',
        type: 'select',
        proxies: [...regionGroupNames, '直连'],
        url: CONFIG.TEST_URLS.OPENAI,
        icon: `${CONFIG.ICON_BASE_URL}ChatGPT.png`
      }));
    }
    
    // YouTube
    if (FEATURE_FLAGS.youtube) {
      appGroups.push(GroupFactory.createAppGroup({
        name: 'YouTube',
        type: 'select',
        proxies: [...regionGroupNames, '直连'],
        url: CONFIG.TEST_URLS.YOUTUBE,
        icon: `${CONFIG.ICON_BASE_URL}YouTube.png`
      }));
    }
    
    // Telegram
    if (FEATURE_FLAGS.telegram) {
      appGroups.push(GroupFactory.createAppGroup({
        name: 'Telegram',
        type: 'select',
        proxies: [...regionGroupNames, '直连'],
        url: 'http://www.telegram.org/img/website_icon.svg',
        icon: `${CONFIG.ICON_BASE_URL}Telegram.png`
      }));
    }
    
    // 跟踪分析拦截（隐私保护）
    if (FEATURE_FLAGS.tracker) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '跟踪分析',
        type: 'select',
        proxies: ['拒绝', '直连'],
        icon: `${CONFIG.ICON_BASE_URL}Reject.png`
      }));
    }
    
    // 广告过滤
    if (FEATURE_FLAGS.BanAD) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '广告过滤',
        type: 'select',
        proxies: ['拒绝', '直连'],
        icon: `${CONFIG.ICON_BASE_URL}Advertising.png`
      }));
    }
    
    // 苹果服务
    if (FEATURE_FLAGS.apple) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '苹果服务',
        type: 'select',
        proxies: [...regionGroupNames, '直连'],
        url: CONFIG.TEST_URLS.APPLE,
        icon: `${CONFIG.ICON_BASE_URL}Apple_2.png`
      }));
    }
    
    // 谷歌服务
    if (FEATURE_FLAGS.google) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '谷歌服务',
        type: 'select',
        proxies: [...regionGroupNames, '直连'],
        url: CONFIG.TEST_URLS.GOOGLE,
        icon: `${CONFIG.ICON_BASE_URL}Google_Search.png`
      }));
    }
    
    // 微软服务
    if (FEATURE_FLAGS.microsoft) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '微软服务',
        type: 'select',
        proxies: [...regionGroupNames, '直连'],
        url: CONFIG.TEST_URLS.MICROSOFT,
        icon: `${CONFIG.ICON_BASE_URL}Microsoft.png`
      }));
    }
    
    // GitHub服务
    if (FEATURE_FLAGS.github) {
      appGroups.push(GroupFactory.createAppGroup({
        name: 'Github',
        type: 'select',
        proxies: [...regionGroupNames, '直连'],
        url: CONFIG.TEST_URLS.GITHUB,
        icon: `${CONFIG.ICON_BASE_URL}GitHub.png`
      }));
    }
    
    // Epic下载服务
    if (FEATURE_FLAGS.epicDownload) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '虚幻引擎',
        type: 'select',
        proxies: [...regionGroupNames, '直连'],
        icon: `${CONFIG.ICON_BASE_URL}Download.png`
      }));
    }
    
    return appGroups;
  },

  /**
   * 构建基础策略组
   * 说明：基础网络服务策略组
   * 包含：
   * - 下载软件
   * - 其他外网
   * - 国内网站
   */
  buildBasicGroups(regionGroups) {
    const regionGroupNames = regionGroups.map(g => g.name);
    
    return [
      // 下载软件策略组
      GroupFactory.createBaseGroup({
        name: '下载软件',
        type: 'select',
        proxies: ['直连', '拒绝', '国内网站', ...regionGroupNames],
        icon: `${CONFIG.ICON_BASE_URL}Download.png`
      }),
      
      // 其他外网策略组（兜底策略）
      GroupFactory.createBaseGroup({
        name: '其他外网',
        type: 'select',
        proxies: ['国内网站', ...regionGroupNames],
        icon: `${CONFIG.ICON_BASE_URL}Streaming!CN.png`
      }),
      
      // 国内网站策略组
      GroupFactory.createAppGroup({
        name: '国内网站',
        type: 'select',
        proxies: ['直连', ...regionGroupNames],
        url: CONFIG.TEST_URLS.CHINA,
        icon: `${CONFIG.ICON_BASE_URL}StreamingCN.png`
      })
    ];
  }
};

// ================= 主控制器（处理流程控制）=================
/**
 * 主控制器
 * 说明：控制整个配置生成流程
 * 处理阶段：
 * 1. 配置验证
 * 2. 节点分组
 * 3. 策略组构建
 * 4. 规则生成
 */
const MainController = {
  /**
   * 配置验证
   * 说明：确保配置合法性，避免运行时错误
   */
  validateConfig() {
    if (!Array.isArray(REGION_CONFIG?.regions)) {
      throw new Error('无效的地区配置: regions 必须是数组');
    }
    
    REGION_CONFIG.regions.forEach(region => {
      if (!region.name || typeof region.name !== 'string') {
        throw new Error(`无效的地区配置: 缺少名称 ${JSON.stringify(region)}`);
      }
      if (!(region.regex instanceof RegExp)) {
        throw new Error(`无效的正则表达式: ${region.name}`);
      }
      if (typeof region.ratioLimit !== 'number' || region.ratioLimit < 0) {
        throw new Error(`无效的倍率限制: ${region.name}`);
      }
    });
  },

  /**
   * 初始化配置
   * 说明：设置Clash核心配置
   * 高级配置：
   * - sniffer: 网络流量分析
   * - geox-url: 地理数据源
   * - ntp: 时间同步
   */
  initConfig(config) {
    config['allow-lan'] = true; // 允许局域网连接
    config['bind-address'] = '*'; // 监听所有地址
    config['mode'] = 'rule'; // 规则模式
    config['dns'] = DNS_CONFIG; // 应用DNS配置
    
    // 性能配置
    config['profile'] = {
      'store-selected': true, // 记忆选择
      'store-fake-ip': true   // 记忆fake-ip
    };
    config['unified-delay'] = true;
    config['tcp-concurrent'] = true; // TCP并发
    config['keep-alive-interval'] = 1800; // 连接保持
    config['find-process-mode'] = 'strict'; // 进程匹配模式
    config['geodata-mode'] = true;
    config['geodata-loader'] = 'memconservative'; // 内存保守模式
    config['geo-auto-update'] = true; // 自动更新地理数据
    config['geo-update-interval'] = 24; // 每天更新一次

    // 网络诊断配置（高级用户调整）
    config['sniffer'] = {
      enable: true,
      'force-dns-mapping': true,
      'parse-pure-ip': false,
      'override-destination': true,
      sniff: {
        TLS: { ports: [443, 8443] },
        HTTP: { ports: [80, '8080-8880'] },
        QUIC: { ports: [443, 8443] }
      },
      'skip-src-address': [
        '127.0.0.0/8', '192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'
      ],
      'force-domain': [ // 强制解析的域名
        '+.google.com', '+.googleapis.com', '+.googleusercontent.com',
        '+.youtube.com', '+.facebook.com', '+.messenger.com',
        '+.fbcdn.net', 'fbcdn-a.akamaihd.net'
      ],
      'skip-domain': ['Mijia Cloud', '+.oray.com'] // 跳过的域名
    };

    // 时间同步配置
    config['ntp'] = {
      enable: true,
      'write-to-system': false, // 不修改系统时间
      server: 'cn.ntp.org.cn' // NTP服务器
    };

    // 地理数据源（建议使用默认源）
    config['geox-url'] = {
      geoip: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat',
      geosite: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat',
      mmdb: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb',
      asn: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb'
    };
    
    return config;
  },

  /**
   * 主处理函数
   * 四阶段处理流程：
   * 1. 初始化：验证配置并设置基础参数
   * 2. 节点分组：智能分组节点
   * 3. 策略组构建：创建所有策略组
   * 4. 规则处理：生成最终规则集
   */
  process(config) {
    // 总开关检查
    if (!CONFIG.ENABLE) return config;
    
    // 第一阶段：必要初始化
    this.validateConfig();
    config = this.initConfig(config);
    
    // 节点检查
    const proxyCount = config?.proxies?.length ?? 0;
    const proxyProviderCount = typeof config?.['proxy-providers'] === 'object' 
      ? Object.keys(config['proxy-providers']).length 
      : 0;
    
    if (proxyCount === 0 && proxyProviderCount === 0) {
      throw new Error('配置文件中未找到任何代理');
    }
    
    // 第二阶段：节点分组（家宽优先）
    const { regionGroups, ungrouped } = NodeManager.groupNodesByRegion(config.proxies);
    
    // 第三阶段：策略组构建
    const coreGroups = PolicyBuilder.buildCoreGroups(regionGroups, ungrouped);
    const customGroups = PolicyBuilder.buildCustomGroups();
    const appGroups = PolicyBuilder.buildAppGroups(regionGroups);
    const basicGroups = PolicyBuilder.buildBasicGroups(regionGroups);
    
    // 组合所有策略组
    config['proxy-groups'] = [
      ...coreGroups,      // 核心策略组
      ...customGroups,    // 自定义策略组
      ...appGroups,       // 应用策略组
      ...basicGroups,     // 基础策略组
      ...regionGroups     // 地区节点组
    ];
    
    // 添加其他节点组（未分组节点）
    if (ungrouped.length > 0) {
      config['proxy-groups'].push(GroupFactory.createBaseGroup({
        name: '其他节点',
        type: 'select',
        proxies: ungrouped,
        icon: `${CONFIG.ICON_BASE_URL}World_Map.png`
      }));
    }
    
    // 添加直连节点（如果不存在）
    if (!config.proxies.some(p => p.name === '直连')) {
      config.proxies.push({
        name: '直连',
        type: 'direct',
        udp: true
      });
    }
    
    // 添加拒绝节点（如果不存在）
    if (!config.proxies.some(p => p.name === '拒绝')) {
      config.proxies.push({
        name: '拒绝',
        type: 'reject'
      });
    }
    
    // 更新手动选择组的节点列表
    const manualSelectGroup = config['proxy-groups'].find(g => g.name === '手动选择');
    if (manualSelectGroup) {
      manualSelectGroup.proxies = config.proxies
        .filter(p => p.type !== 'direct' && p.type !== 'reject')
        .map(p => p.name);
    }
    
    // 第四阶段：规则处理（延迟加载）
    config['rules'] = RuleManager.buildRules();
    config['rule-providers'] = Object.fromEntries(RuleManager.getRuleProviders());
    
    return config;
  }
};

// ================= 入口函数（Clash调用接口）=================
/**
 * 入口函数
 * 说明：Clash调用的主要入口
 * @param {Object} config - 原始配置对象
 * @returns {Object} - 处理后的配置对象
 */
const main = (config) => {
  return MainController.process(config);
};
