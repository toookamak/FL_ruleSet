/*** 
 * Clash Verge Rev 精简版脚本 (Android/Windows 优化)
 * 版本：3.2.7
 * 修复：未定义REJECT错误
 * 优化点：
 * 1. 修复CONFIG.BUILTIN_PROXIES未定义错误
 * 2. 添加配置保护机制
 * 3. 增强错误处理
 * 4. 保留美国、日本、新加坡、香港核心地区分组
 */

// ================= 配置分离区 =================
const CONFIG = {
  ENABLE: true,
  ICON_BASE_URL: "https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/",
  TEST_URLS: {
    DEFAULT: "http://cp.cloudflare.com/generate_204",
    OPENAI: "https://chat.openai.com/cdn-cgi/trace",
    CHINA: "http://wifi.vivo.com.cn/generate_204",
    GOOGLE: "http://www.google.com/generate_204"
  },
  MULTIPLIER_REGEX: /([xX✕✖⨉倍率])([0-9.]+)/i,
  RULE_PROVIDER_COMMON: {
    type: 'http',
    format: 'yaml',
    interval: 86400,
    compression: 'gzip'
  },
  GROUP_BASE_OPTION: {
    interval: 600,
    timeout: 5000,
    url: 'http://cp.cloudflare.com/generate_204',
    lazy: true,
    'max-failed-times': 3,
    hidden: false
  },
  CUSTOM_RULES: {
    DIRECT: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/main/OwnRules/OwnDIRECTRules.list",
    PROXY: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/main/OwnRules/OwnPROXYRules.list"
  },
  // 内置代理和策略组名称（确保已定义）
  BUILTIN_PROXIES: {
    DIRECT: "DIRECT",
    REJECT: "REJECT"
  },
  POLICY_GROUPS: {
    PROXY: "代理模式",
    FOREIGN: "其他外网"
  }
};

/**
 * 功能开关
 */
const FEATURE_FLAGS = {
  apple: true,
  microsoft: true,
  google: true,
  openai: true,
  youtube: true,
  telegram: true,
  tracker: true,
  BanAD: true,
  notion: false,
  github: false,
  Onedrive: false,
  GameStore: false,
  epicDownload: false,
  customRules: true
};

/**
 * 精简规则配置
 */
const RULE_CONFIG = {
  PRE_RULES: [
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
    `MATCH,${CONFIG.POLICY_GROUPS.FOREIGN}`
  ]
};

/**
 * 核心地区配置（美日新港）
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
      name: 'HK香港', 
      regex: /港|🇭🇰|hk|hongkong|hong kong/i, 
      ratioLimit: 2,
      icon: 'Hong_Kong'
    }
  ]
};

/**
 * 精简DNS配置
 */
const DNS_CONFIG = {
  enable: true,
  listen: ':1053',
  ipv6: true,
  'prefer-h3': true,
  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.1/16',
  'fake-ip-filter': ['*.lan', '*.local', '*.msftconnecttest.com'],
  nameserver: [
    'https://120.53.53.53/dns-query', 
    'https://223.5.5.5/dns-query',
    'tls://8.8.4.4'
  ],
  'proxy-server-nameserver': ['https://120.53.53.53/dns-query'],
  cache: true,
  'cache-size': 2048,
  'cache-ttl-min': 600,
  'cache-ttl-max': 3600
};

/**
 * 规则集配置
 */
const BASE_RULE_PROVIDERS = {
  applications: {
    behavior: 'classical',
    format: 'text',
    url: 'https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@clash-ruleset/applications.list',
    path: './ruleset/applications.list'
  },
  adblock: {
    behavior: 'domain',
    format: 'text',
    url: 'https://raw.githubusercontent.com/217heidai/adblockfilters/main/rules/adblock.txt',
    path: './ruleset/adblock.txt'
  },
  ai: {
    behavior: 'classical',
    format: 'text',
    url: 'https://github.com/dahaha-365/YaNet/raw/refs/heads/dist/rulesets/mihomo/ai.list',
    path: './ruleset/ai.list'
  },
  google: {
    behavior: 'classical',
    format: 'text',
    url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Google/Google.list',
    path: './ruleset/google.list'
  },
  telegram: {
    behavior: 'classical',
    format: 'text',
    url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Telegram/Telegram.list',
    path: './ruleset/telegram.list'
  },
  own_direct: {
    behavior: 'classical',
    format: 'text',
    url: CONFIG.CUSTOM_RULES.DIRECT,
    path: './ruleset/own_direct.list'
  },
  own_proxy: {
    behavior: 'classical',
    format: 'text',
    url: CONFIG.CUSTOM_RULES.PROXY,
    path: './ruleset/own_proxy.list'
  }
};

// ================= 功能模块区 =================
const GroupFactory = {
  createBaseGroup(options) {
    return { ...CONFIG.GROUP_BASE_OPTION, ...options };
  },

  createAppGroup(options) {
    return this.createBaseGroup({
      ...options,
      proxies: ['延迟优选', ...(options.proxies || [])]
    });
  },

  createRegionGroup(region) {
    return this.createBaseGroup({
      name: region.name,
      type: 'url-test',
      tolerance: 100,
      icon: `${CONFIG.ICON_BASE_URL}${region.icon}.png`,
      proxies: []
    });
  }
};

const RuleManager = {
  ruleProviders: null,
  
  getRuleProviders() {
    this.ruleProviders = this.ruleProviders || this.initRuleProviders();
    return this.ruleProviders;
  },
  
  initRuleProviders() {
    const providers = new Map();
    Object.entries(BASE_RULE_PROVIDERS).forEach(([key, config]) => {
      providers.set(key, { ...CONFIG.RULE_PROVIDER_COMMON, ...config });
    });
    return providers;
  },

  buildRules() {
    const rules = [...RULE_CONFIG.PRE_RULES];
    
    if (FEATURE_FLAGS.customRules) {
      rules.push(
        `RULE-SET,own_direct,${CONFIG.BUILTIN_PROXIES.DIRECT}`,
        `RULE-SET,own_proxy,${CONFIG.POLICY_GROUPS.FOREIGN}`
      );
    }
    
    this.addFeatureRules(rules);
    rules.push(...RULE_CONFIG.POST_RULES);
    return rules;
  },

  addFeatureRules(rules) {
    // 国外AI
    if (FEATURE_FLAGS.openai) {
      rules.push('RULE-SET,ai,国外AI');
    }
    
    // YouTube
    if (FEATURE_FLAGS.youtube) {
      rules.push('GEOSITE,youtube,YouTube');
    }
    
    // Telegram
    if (FEATURE_FLAGS.telegram) {
      rules.push('RULE-SET,telegram,Telegram');
    }
    
    // 隐私保护
    if (FEATURE_FLAGS.tracker) {
      rules.push('GEOSITE,tracker,跟踪分析');
    }
    
    // 广告过滤
    if (FEATURE_FLAGS.BanAD) {
      rules.push('RULE-SET,adblock,广告过滤');
    }
    
    // 苹果服务
    if (FEATURE_FLAGS.apple) {
      rules.push('GEOSITE,apple-cn,苹果服务');
    }
    
    // 谷歌服务
    if (FEATURE_FLAGS.google) {
      rules.push('RULE-SET,google,谷歌服务');
    }
  }
};

/**
 * 高效节点分组
 */
const NodeManager = {
  groupNodesByRegion(proxies) {
    const regionGroups = new Map();
    const groupedProxies = new Set();
    const regions = REGION_CONFIG.regions;
    
    regions.forEach(region => {
      regionGroups.set(region.name, {
        group: GroupFactory.createRegionGroup(region),
        region
      });
    });
    
    proxies.forEach(proxy => {
      if (groupedProxies.has(proxy.name)) return;
      
      let multiplier = proxy._multiplier || 0;
      if (!proxy._multiplier) {
        const match = proxy.name.match(CONFIG.MULTIPLIER_REGEX);
        proxy._multiplier = match?.[2] ? parseFloat(match[2]) : 0;
        multiplier = proxy._multiplier;
      }
      
      for (const region of regions) {
        if (region.regex.test(proxy.name) && multiplier <= region.ratioLimit) {
          regionGroups.get(region.name).group.proxies.push(proxy.name);
          groupedProxies.add(proxy.name);
          break;
        }
      }
    });
    
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
 * 策略组构建器（修复REJECT未定义错误）
 */
const PolicyBuilder = {
  // 安全获取配置值
  getBuiltinProxy(name) {
    return (CONFIG.BUILTIN_PROXIES && CONFIG.BUILTIN_PROXIES[name]) || name;
  },
  
  buildCoreGroups(regionGroups, ungroupedNodes) {
    const regionGroupNames = regionGroups.map(g => g.name);
    
    if (ungroupedNodes.length > 0) {
      regionGroupNames.push('其他节点');
    }
    
    return [
      GroupFactory.createBaseGroup({
        name: CONFIG.POLICY_GROUPS.PROXY,
        type: 'select',
        proxies: ['手动选择', '延迟优选', ...regionGroupNames, this.getBuiltinProxy('DIRECT')],
        icon: `${CONFIG.ICON_BASE_URL}Proxy.png`
      }),
      
      GroupFactory.createBaseGroup({
        name: '手动选择',
        type: 'select',
        proxies: [],
        icon: `${CONFIG.ICON_BASE_URL}Global.png`
      }),
      
      GroupFactory.createBaseGroup({
        name: '延迟优选',
        type: 'url-test',
        tolerance: 100,
        proxies: [...regionGroupNames],
        icon: `${CONFIG.ICON_BASE_URL}Speedtest.png`
      })
    ];
  },

  buildCustomGroups() {
    if (!FEATURE_FLAGS.customRules) return [];
    
    return [
      GroupFactory.createBaseGroup({
        name: '自定义直连',
        type: 'select',
        proxies: [this.getBuiltinProxy('DIRECT'), '国内网站'],
        icon: `${CONFIG.ICON_BASE_URL}Direct.png`
      }),
      
      GroupFactory.createBaseGroup({
        name: '自定义代理',
        type: 'select',
        proxies: [CONFIG.POLICY_GROUPS.FOREIGN, '国内网站', this.getBuiltinProxy('DIRECT')],
        icon: `${CONFIG.ICON_BASE_URL}Proxy.png`
      })
    ];
  },

  buildAppGroups(regionGroups) {
    const regionGroupNames = regionGroups.map(g => g.name);
    const appGroups = [];
    
    // 国外AI
    if (FEATURE_FLAGS.openai) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '国外AI',
        type: 'select',
        proxies: [...regionGroupNames, this.getBuiltinProxy('DIRECT')],
        url: CONFIG.TEST_URLS.OPENAI,
        icon: `${CONFIG.ICON_BASE_URL}ChatGPT.png`
      }));
    }
    
    // YouTube
    if (FEATURE_FLAGS.youtube) {
      appGroups.push(GroupFactory.createAppGroup({
        name: 'YouTube',
        type: 'select',
        proxies: [...regionGroupNames, this.getBuiltinProxy('DIRECT')],
        url: 'http://www.youtube.com/favicon.ico',
        icon: `${CONFIG.ICON_BASE_URL}YouTube.png`
      }));
    }
    
    // Telegram
    if (FEATURE_FLAGS.telegram) {
      appGroups.push(GroupFactory.createAppGroup({
        name: 'Telegram',
        type: 'select',
        proxies: [...regionGroupNames, this.getBuiltinProxy('DIRECT')],
        icon: `${CONFIG.ICON_BASE_URL}Telegram.png`
      }));
    }
    
    // 跟踪分析
    if (FEATURE_FLAGS.tracker) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '跟踪分析',
        type: 'select',
        proxies: [this.getBuiltinProxy('REJECT'), this.getBuiltinProxy('DIRECT')],
        icon: `${CONFIG.ICON_BASE_URL}Reject.png`
      }));
    }
    
    // 广告过滤
    if (FEATURE_FLAGS.BanAD) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '广告过滤',
        type: 'select',
        proxies: [this.getBuiltinProxy('REJECT'), this.getBuiltinProxy('DIRECT')],
        icon: `${CONFIG.ICON_BASE_URL}Advertising.png`
      }));
    }
    
    // 苹果服务
    if (FEATURE_FLAGS.apple) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '苹果服务',
        type: 'select',
        proxies: [...regionGroupNames, this.getBuiltinProxy('DIRECT')],
        icon: `${CONFIG.ICON_BASE_URL}Apple_2.png`
      }));
    }
    
    // 谷歌服务
    if (FEATURE_FLAGS.google) {
      appGroups.push(GroupFactory.createAppGroup({
        name: '谷歌服务',
        type: 'select',
        proxies: [...regionGroupNames, this.getBuiltinProxy('DIRECT')],
        url: CONFIG.TEST_URLS.GOOGLE,
        icon: `${CONFIG.ICON_BASE_URL}Google_Search.png`
      }));
    }
    
    return appGroups;
  },

  buildBasicGroups(regionGroups) {
    const regionGroupNames = regionGroups.map(g => g.name);
    
    return [
      GroupFactory.createBaseGroup({
        name: CONFIG.POLICY_GROUPS.FOREIGN,
        type: 'select',
        proxies: ['国内网站', ...regionGroupNames],
        icon: `${CONFIG.ICON_BASE_URL}Streaming!CN.png`
      }),
      
      GroupFactory.createAppGroup({
        name: '国内网站',
        type: 'select',
        proxies: [this.getBuiltinProxy('DIRECT'), ...regionGroupNames],
        url: CONFIG.TEST_URLS.CHINA,
        icon: `${CONFIG.ICON_BASE_URL}StreamingCN.png`
      })
    ];
  }
};

// ================= 主控制器 =================
const MainController = {
  validateConfig() {
    if (!Array.isArray(REGION_CONFIG?.regions)) {
      throw new Error('无效的地区配置');
    }
    
    // 确保关键配置存在
    if (!CONFIG.BUILTIN_PROXIES) {
      CONFIG.BUILTIN_PROXIES = {
        DIRECT: "DIRECT",
        REJECT: "REJECT"
      };
    }
  },

  initConfig(config) {
    config['allow-lan'] = true;
    config['bind-address'] = '*';
    config['mode'] = 'rule';
    config['dns'] = DNS_CONFIG;
    
    config['profile'] = {
      'store-selected': true,
      'store-fake-ip': false
    };
    
    config['sniffer'] = {
      enable: true,
      'override-destination': true,
      sniff: { HTTP: { ports: [80, 8080] } }
    };

    return config;
  },

  process(config) {
    if (!CONFIG.ENABLE) return config;
    
    try {
      this.validateConfig();
      config = this.initConfig(config);
      
      if (!config.proxies?.length && !config['proxy-providers']) {
        throw new Error('未找到有效代理');
      }
      
      const { regionGroups, ungrouped } = NodeManager.groupNodesByRegion(config.proxies);
      const coreGroups = PolicyBuilder.buildCoreGroups(regionGroups, ungrouped);
      const customGroups = PolicyBuilder.buildCustomGroups();
      const appGroups = PolicyBuilder.buildAppGroups(regionGroups);
      const basicGroups = PolicyBuilder.buildBasicGroups(regionGroups);
      
      config['proxy-groups'] = [
        ...coreGroups,
        ...customGroups,
        ...appGroups,
        ...basicGroups,
        ...regionGroups
      ];
      
      if (ungrouped.length > 0) {
        config['proxy-groups'].push(GroupFactory.createBaseGroup({
          name: '其他节点',
          type: 'select',
          proxies: ungrouped,
          icon: `${CONFIG.ICON_BASE_URL}World_Map.png`
        }));
      }
      
      // 更新手动选择组
      const manualGroup = config['proxy-groups'].find(g => g.name === '手动选择');
      if (manualGroup) {
        manualGroup.proxies = config.proxies
          .filter(p => p.type !== 'direct' && p.type !== 'reject')
          .map(p => p.name);
      }
      
      // 规则处理
      config['rules'] = RuleManager.buildRules();
      config['rule-providers'] = Object.fromEntries(RuleManager.getRuleProviders());
    } catch (error) {
      console.error('配置处理失败:', error);
      // 回退原始配置
      return config;
    }
    
    return config;
  }
};

// ================= 入口函数 =================
const main = (config) => {
  return MainController.process(config);
};
