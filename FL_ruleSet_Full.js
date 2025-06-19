/*** 
 * Clash Verge Rev 全局扩展脚本（修复循环依赖）
 * 版本：3.1.3
 * 修复：策略组循环依赖问题
 */

// ================= 配置分离区 =================
/**
 * 基础常量配置
 */
const CONFIG = {
  ENABLE: true,
  ICON_BASE_URL: "https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/",
  TEST_URLS: {
    DEFAULT: "http://cp.cloudflare.com/generate_204",
    YOUTUBE: "https://www.youtube.com/s/desktop/494dd881/img/favicon.ico",
    OPENAI: "https://chat.openai.com/cdn-cgi/trace",
    APPLE: "http://www.apple.com/library/test/success.html",
    GOOGLE: "http://www.google.com/generate_204",
    MICROSOFT: "http://www.msftconnecttest.com/connecttest.txt",
    GITHUB: "https://github.com/robots.txt",
    CHINA: "http://wifi.vivo.com.cn/generate_204"
  },
  MULTIPLIER_REGEX: /([xX✕✖⨉倍率])([0-9.]+)/i,
  RULE_PROVIDER_COMMON: {
    type: 'http',
    format: 'yaml',
    interval: 86400,
    compression: 'gzip'
  },
  GROUP_BASE_OPTION: {
    interval: 300,
    timeout: 3000,
    url: 'http://cp.cloudflare.com/generate_204',
    lazy: true,
    'max-failed-times': 3,
    hidden: false
  },
  // 自定义规则链接
  CUSTOM_RULES: {
    DIRECT: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/main/OwnRules/OwnDIRECTRules.list",
    PROXY: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/main/OwnRules/OwnPROXYRules.list"
  }
};

/**
 * 功能开关配置
 */
const FEATURE_FLAGS = {
  apple: true,
  microsoft: true,
  github: true,
  google: true,
  openai: true,
  notion: true,
  Onedrive: true,
  GameStore: true,
  epicDownload: true,
  youtube: true,
  telegram: true,
  tracker: true,
  BanAD: true,
  BanProgramAD: true,
  // 自定义规则开关（默认开启）
  customRules: true
};

/**
 * 规则配置
 */
const RULE_CONFIG = {
  PRE_RULES: [
    'RULE-SET,applications,下载软件',
    'PROCESS-NAME,SunloginClient,DIRECT',
    'PROCESS-NAME,SunloginClient.exe,DIRECT',
    'PROCESS-NAME,AnyDesk,DIRECT',
    'PROCESS-NAME,AnyDesk.exe,DIRECT',
  ],
  POST_RULES: [
    'GEOSITE,private,DIRECT',
    'GEOIP,private,DIRECT,no-resolve',
    'GEOSITE,cn,国内网站',
    'GEOIP,cn,国内网站,no-resolve',
    'MATCH,其他外网'
  ]
};

/**
 * 地区节点配置
 */
const REGION_CONFIG = {
  excludeHighPercentage: true,
  regions: [
    { 
      name: '原生IP/家宽', 
      regex: /原生|家宽|住宅|home|residential/i, 
      ratioLimit: 100,
      icon: 'Home'
    },
    { 
      name: '低倍率', 
      regex: /低倍率|0\.2|0.5|ratio|倍率低/i, 
      ratioLimit: 0.8,
      icon: 'Speedtest'
    },
    { 
      name: 'HK香港', 
      regex: /港|🇭🇰|hk|hongkong|hong kong/i, 
      ratioLimit: 2,
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
 * DNS配置
 */
const DNS_CONFIG = {
  enable: true,
  listen: ':1053',
  ipv6: true,
  'prefer-h3': true,
  'use-hosts': true,
  'use-system-hosts': true,
  'respect-rules': true,
  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.1/16',
  'fake-ip-filter': ['*', '+.lan', '+.local', '+.market.xiaomi.com'],
  nameserver: ['https://120.53.53.53/dns-query', 'https://223.5.5.5/dns-query'],
  'proxy-server-nameserver': ['https://120.53.53.53/dns-query', 'https://223.5.5.5/dns-query'],
  'ssl-verification': true,
  cache: true,
  'cache-size': 4096,
  'cache-ttl-min': 600,
  'cache-ttl-max': 3600,
  'nameserver-policy': {
    'geosite:private': 'system',
    'geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn': ['119.29.29.29', '223.5.5.5']
  }
};

/**
 * 基础规则集配置
 */
const BASE_RULE_PROVIDERS = {
  applications: {
    behavior: 'classical',
    format: 'text',
    url: 'https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@clash-ruleset/applications.list',
    path: './ruleset/DustinWin/applications.list'
  },
  adblockmihomo: {
    behavior: 'domain',
    format: 'mrs',
    url: 'https://github.com/217heidai/adblockfilters/raw/refs/heads/main/rules/adblockmihomo.mrs',
    path: './ruleset/adblockfilters/adblockmihomo.mrs'
  },
  ai: {
    behavior: 'classical',
    format: 'text',
    url: 'https://github.com/dahaha-365/YaNet/raw/refs/heads/dist/rulesets/mihomo/ai.list',
    path: './ruleset/YaNet/ai.list'
  },
  epicDownload: {
    behavior: 'classical',
    format: 'text',
    url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Epic/Epic.list',
    path: './ruleset/blackmatrix7/Epic.list'
  },
  // 新增自定义规则集
  own_direct: {
    behavior: 'classical',
    format: 'text',
    url: CONFIG.CUSTOM_RULES.DIRECT,
    path: './ruleset/custom/own_direct.list'
  },
  own_proxy: {
    behavior: 'classical',
    format: 'text',
    url: CONFIG.CUSTOM_RULES.PROXY,
    path: './ruleset/custom/own_proxy.list'
  }
};

// ================= 功能模块区 =================
/**
 * 代理组创建器
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
      type: 'url-test',
      tolerance: 50,
      icon: `${CONFIG.ICON_BASE_URL}${region.icon}.png`,
      proxies: []
    });
  }
};

/**
 * 规则管理器（优化：延迟加载）
 */
const RuleManager = {
  ruleProviders: null,
  
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
   * 注册条件规则集
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
    
    // 游戏专用
    if (FEATURE_FLAGS.games) {
      rules.push(
        'GEOSITE,category-games@cn,国内网站',
        'GEOSITE,category-games,游戏专用'
      );
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
 * 节点管理器（优化：高效分组算法）
 */
const NodeManager = {
  /**
   * 按地区分组节点（优化版本）
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
    
    // 单次遍历处理所有节点
    proxies.forEach(proxy => {
      if (groupedProxies.has(proxy.name)) return;
      
      // 缓存倍率计算
      let multiplier = 0;
      if (!proxy._multiplier) {
        const match = proxy.name.match(CONFIG.MULTIPLIER_REGEX);
        proxy._multiplier = match && match[2] ? parseFloat(match[2]) : 0;
      }
      multiplier = proxy._multiplier;
      
      // 查找匹配的分组
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
 * 策略组构建器（修复循环依赖）
 */
const PolicyBuilder = {
  /**
   * 构建核心策略组
   */
  buildCoreGroups(regionGroups, ungroupedNodes) {
    const regionGroupNames = regionGroups.map(g => g.name);
    
    if (ungroupedNodes.length > 0) {
      regionGroupNames.push('其他节点');
    }
    
    return [
      // 代理模式选择组
      GroupFactory.createBaseGroup({
        name: '代理模式',
        type: 'select',
        proxies: ['手动选择', '延迟优选', '故障转移', ...regionGroupNames, '直连'],
        icon: `${CONFIG.ICON_BASE_URL}Proxy.png`
      }),
      
      // 手动选择组
      GroupFactory.createBaseGroup({
        name: '手动选择',
        type: 'select',
        proxies: [],
        icon: `${CONFIG.ICON_BASE_URL}Global.png`
      }),
      
      // 延迟优选组
      GroupFactory.createBaseGroup({
        name: '延迟优选',
        type: 'url-test',
        tolerance: 50,
        proxies: [...regionGroupNames],
        icon: `${CONFIG.ICON_BASE_URL}Speedtest.png`
      }),
      
      // 故障转移组
      GroupFactory.createBaseGroup({
        name: '故障转移',
        type: 'fallback',
        proxies: [...regionGroupNames],
        icon: `${CONFIG.ICON_BASE_URL}Final.png`
      })
    ];
  },

  /**
   * 构建自定义策略组（修复循环依赖）
   */
  buildCustomGroups() {
    if (!FEATURE_FLAGS.customRules) return [];
    
    return [
      // 自定义直连组
      GroupFactory.createBaseGroup({
        name: '自定义直连',
        type: 'select',
        proxies: ['直连', '国内网站'], // 移除了代理模式
        icon: `${CONFIG.ICON_BASE_URL}Direct.png`
      }),
      
      // 自定义代理组
      GroupFactory.createBaseGroup({
        name: '自定义代理',
        type: 'select',
        proxies: ['其他外网', '国内网站', '直连','延迟优选'], // 移除了代理模式
        icon: `${CONFIG.ICON_BASE_URL}Proxy.png`
      })
    ];
  },

  /**
   * 构建应用策略组（修复循环依赖）
   */
  buildAppGroups(regionGroups) {
    const regionGroupNames = regionGroups.map(g => g.name);
    const appGroups = [];
    
    // Notion办公（按需）
    if (FEATURE_FLAGS.notion) {
      appGroups.push(GroupFactory.createAppGroup({
        name: 'Notion办公',
        type: 'select',
        proxies: [...regionGroupNames, '直连'], // 移除了代理模式
        icon: `${CONFIG.ICON_BASE_URL}Notion.png`
      }));
    }
    
    // 国外AI（按需）
    if (FEATURE_FLAGS.openai) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '国外AI',
        type: 'select',
        proxies: [...regionGroupNames, '直连'], // 移除了代理模式
        url: CONFIG.TEST_URLS.OPENAI,
        icon: `${CONFIG.ICON_BASE_URL}ChatGPT.png`
      }));
    }
    
    // YouTube（按需）
    if (FEATURE_FLAGS.youtube) {
      appGroups.push(GroupFactory.createAppGroup({
        name: 'YouTube',
        type: 'select',
        proxies: [...regionGroupNames, '直连'], // 移除了代理模式
        url: CONFIG.TEST_URLS.YOUTUBE,
        icon: `${CONFIG.ICON_BASE_URL}YouTube.png`
      }));
    }
    
    // Telegram（按需）
    if (FEATURE_FLAGS.telegram) {
      appGroups.push(GroupFactory.createAppGroup({
        name: 'Telegram',
        type: 'select',
        proxies: [...regionGroupNames, '直连'], // 移除了代理模式
        url: 'http://www.telegram.org/img/website_icon.svg',
        icon: `${CONFIG.ICON_BASE_URL}Telegram.png`
      }));
    }
    
    // 游戏专用策略组（按需）
    if (FEATURE_FLAGS.games) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '游戏专用',
        type: 'select',
        proxies: [...regionGroupNames, '直连'], // 移除了代理模式
        icon: `${CONFIG.ICON_BASE_URL}Game.png`
      }));
    }
    
    // 跟踪分析拦截（按需）
    if (FEATURE_FLAGS.tracker) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '跟踪分析',
        type: 'select',
        proxies: ['拒绝', '直连'], // 移除了代理模式
        icon: `${CONFIG.ICON_BASE_URL}Reject.png`
      }));
    }
    
    // 广告过滤（按需）
    if (FEATURE_FLAGS.BanAD) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '广告过滤',
        type: 'select',
        proxies: ['拒绝', '直连'], // 移除了代理模式
        icon: `${CONFIG.ICON_BASE_URL}Advertising.png`
      }));
    }
    
    // 苹果服务（按需）
    if (FEATURE_FLAGS.apple) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '苹果服务',
        type: 'select',
        proxies: [...regionGroupNames, '直连'], // 移除了代理模式
        url: CONFIG.TEST_URLS.APPLE,
        icon: `${CONFIG.ICON_BASE_URL}Apple_2.png`
      }));
    }
    
    // 谷歌服务（按需）
    if (FEATURE_FLAGS.google) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '谷歌服务',
        type: 'select',
        proxies: [...regionGroupNames, '直连'], // 移除了代理模式
        url: CONFIG.TEST_URLS.GOOGLE,
        icon: `${CONFIG.ICON_BASE_URL}Google_Search.png`
      }));
    }
    
    // 微软服务（按需）
    if (FEATURE_FLAGS.microsoft) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '微软服务',
        type: 'select',
        proxies: [...regionGroupNames, '直连'], // 移除了代理模式
        url: CONFIG.TEST_URLS.MICROSOFT,
        icon: `${CONFIG.ICON_BASE_URL}Microsoft.png`
      }));
    }
    
    // GitHub服务（按需）
    if (FEATURE_FLAGS.github) {
      appGroups.push(GroupFactory.createAppGroup({
        name: 'Github',
        type: 'select',
        proxies: [...regionGroupNames, '直连'], // 移除了代理模式
        url: CONFIG.TEST_URLS.GITHUB,
        icon: `${CONFIG.ICON_BASE_URL}GitHub.png`
      }));
    }
    
    // Epic下载服务（按需）
    if (FEATURE_FLAGS.epicDownload) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '虚幻引擎',
        type: 'select',
        proxies: [...regionGroupNames, '直连'], // 移除了代理模式
        icon: `${CONFIG.ICON_BASE_URL}Download.png`
      }));
    }
    
    return appGroups;
  },

  /**
   * 构建基础策略组（修复循环依赖）
   */
  buildBasicGroups(regionGroups) {
    const regionGroupNames = regionGroups.map(g => g.name);
    
    return [
      // 下载软件
      GroupFactory.createBaseGroup({
        name: '下载软件',
        type: 'select',
        proxies: ['直连', '拒绝', '国内网站', ...regionGroupNames], // 移除了代理模式
        icon: `${CONFIG.ICON_BASE_URL}Download.png`
      }),
      
      // 其他外网
      GroupFactory.createBaseGroup({
        name: '其他外网',
        type: 'select',
        proxies: ['国内网站', ...regionGroupNames], // 移除了代理模式
        icon: `${CONFIG.ICON_BASE_URL}Streaming!CN.png`
      }),
      
      // 国内网站
      GroupFactory.createAppGroup({
        name: '国内网站',
        type: 'select',
        proxies: ['直连', ...regionGroupNames], // 移除了代理模式
        url: CONFIG.TEST_URLS.CHINA,
        icon: `${CONFIG.ICON_BASE_URL}StreamingCN.png`
      })
    ];
  }
};

// ================= 主控制器 =================
const MainController = {
  /**
   * 配置验证
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
   */
  initConfig(config) {
    config['allow-lan'] = true;
    config['bind-address'] = '*';
    config['mode'] = 'rule';
    config['dns'] = DNS_CONFIG;
    
    // 性能配置
    config['profile'] = {
      'store-selected': true,
      'store-fake-ip': true
    };
    config['unified-delay'] = true;
    config['tcp-concurrent'] = true;
    config['keep-alive-interval'] = 1800;
    config['find-process-mode'] = 'strict';
    config['geodata-mode'] = true;
    config['geodata-loader'] = 'memconservative';
    config['geo-auto-update'] = true;
    config['geo-update-interval'] = 24;

    // 网络诊断配置
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
      'force-domain': [
        '+.google.com', '+.googleapis.com', '+.googleusercontent.com',
        '+.youtube.com', '+.facebook.com', '+.messenger.com',
        '+.fbcdn.net', 'fbcdn-a.akamaihd.net'
      ],
      'skip-domain': ['Mijia Cloud', '+.oray.com']
    };

    // 时间同步配置
    config['ntp'] = {
      enable: true,
      'write-to-system': false,
      server: 'cn.ntp.org.cn'
    };

    // 地理数据源
    config['geox-url'] = {
      geoip: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat',
      geosite: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat',
      mmdb: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb',
      asn: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb'
    };
    
    return config;
  },

  /**
   * 主处理函数（修复循环依赖）
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
    
    // 第二阶段：节点分组
    const { regionGroups, ungrouped } = NodeManager.groupNodesByRegion(config.proxies);
    
    // 第三阶段：策略组构建
    const coreGroups = PolicyBuilder.buildCoreGroups(regionGroups, ungrouped);
    const customGroups = PolicyBuilder.buildCustomGroups();
    const appGroups = PolicyBuilder.buildAppGroups(regionGroups);
    const basicGroups = PolicyBuilder.buildBasicGroups(regionGroups);
    
    // 组合所有策略组
    config['proxy-groups'] = [
      ...coreGroups,
      ...customGroups,
      ...appGroups,
      ...basicGroups,
      ...regionGroups
    ];
    
    // 添加其他节点组
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
        
      // 不再添加自定义组到手动选择组
    }
    
    // 第四阶段：规则处理（延迟加载）
    config['rules'] = RuleManager.buildRules();
    config['rule-providers'] = Object.fromEntries(RuleManager.getRuleProviders());
    
    return config;
  }
};

// ================= 入口函数 =================
const main = (config) => {
  return MainController.process(config);
};
