// TK_ClashRuleDIY
// https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/TK_ClashRuleDIY_1124.js
// 版本：v8.2.2
// 最后更新：2025-11-25  | 
// ===================== 待       办 =====================
//
// 1.优化了规则集顺序，补充精简规则集
// 2.GEO的优化
// 3.DNS设置的优化



// ===================== 配置管理中心 =====================
/**
 * 统一配置管理器 - 集中管理所有可配置参数
 */
const CONFIG_MANAGER = {
    // 基础配置常量
    TEST_URL: "http://www.gstatic.com/generate_204",
    REGION_TEST_URLS: {
        HK: "http://www.gstatic.com/generate_204",
        SG: "http://www.gstatic.com/generate_204",
        JP: "http://www.gstatic.com/generate_204",
        US: "http://www.gstatic.com/generate_204"
    },
    
    // 更新间隔配置
    UPDATE_INTERVALS: {
        DEFAULT: 172800,
        CRITICAL: 86400,
        STATIC: 86400
    },
    
    // 策略组分类配置
    GROUP_CATEGORY: {
        CORE: "核心路由",
        REGION_ENTRY: "地区选择",
        REGION: "具体地区",
        LINE_TYPE: "线路特性",
        SERVICE: "服务专用",
        TRAFFIC: "流量管理",
        CUSTOM: "自定义规则",
        DEFAULT_ROUTE: "默认路由"
    },
    
    // 自定义规则URL配置
    CUSTOM_RULES: {
        PROXY_URL: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnPROXYRules.list",
        DIRECT_URL: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnDIRECTRules.list",
        REJECT_URL: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnREJECTRules.list"
    },
    
    // CDN源配置
    CDN_SOURCES: {
        PRIMARY: "https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/",
        BACKUP: "https://ghproxy.com/https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/",
        LOCAL: "./icons/"
    }
};

// ===================== 关键词配置 =====================
/**
 * 统一关键词配置 - 集中管理所有过滤关键词
 */
const KEYWORDS_CONFIG = {
    NOTIFICATION: "自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire|剩余|激励|分享|到期|续费|充值",
    RESIDENTIAL: "家宽|原生|residential|home",
    LOW_RATE: "低倍率|lowrate|低-rate|倍率"
};

/**
 * 构建正则表达式工具函数
 */
function buildRegex(keywords, flags = 'i') {
    return new RegExp(`(${keywords})`, flags);
}

/**
 * 构建排除正则表达式工具函数
 */
function buildExcludeRegex(keywords, flags = 'i') {
    return new RegExp(`^(?!.*(?:${keywords})).*$`, flags);
}

// 预构建常用正则表达式
const REGEX_PATTERNS = {
    NOTIFICATION: buildRegex(KEYWORDS_CONFIG.NOTIFICATION),
    NOTIFICATION_CHECK: buildRegex(KEYWORDS_CONFIG.NOTIFICATION),
    NOTIFICATION_EXCLUDE: buildExcludeRegex(KEYWORDS_CONFIG.NOTIFICATION),
    
    RESIDENTIAL: buildRegex(KEYWORDS_CONFIG.RESIDENTIAL),
    RESIDENTIAL_CHECK: buildRegex(KEYWORDS_CONFIG.RESIDENTIAL),
    
    LOW_RATE: buildRegex(KEYWORDS_CONFIG.LOW_RATE),
    LOW_RATE_CHECK: buildRegex(KEYWORDS_CONFIG.LOW_RATE)
};

// ===================== 策略组命名常量 =====================
/**
 * 所有策略组名称定义
 */
const GLOBAL_ROUTING = "🧭 代理模式";
const ALL_NODES_GROUP = "🌍 全部节点";
const RESIDENTIAL_LINE = "🏠 家宽/原生线路";
const LOW_RATE_NODE = "💰 低倍率节点";
const NOTIFICATION_GROUP = "📢 机场通知";
const OFFICE_MESSAGING = "办公通讯";
const AI_SERVICE = "AI服务";
const AD_BLOCKING = "广告拦截";
const HIGH_TRAFFIC_CHANNEL = "大流量通道";
const GOOGLE_SERVICE = "谷歌服务";
const MICROSOFT_SERVICE = "微软服务";
const UNREAL_ENGINE = "虚幻引擎";
const CUSTOM_PROXY_RULE = "自定义代理规则";
const CUSTOM_DIRECT_RULE = "自定义直连规则";
const DOMESTIC_TRAFFIC = "国内流量";
const GLOBAL_TRAFFIC = "国际流量";

// ===================== 缓存管理 =====================
/**
 * 全局缓存对象
 */
const CACHE = {
    proxyGroups: null,
    availableRegions: null,
    residentialProxies: null,
    lowRateProxies: null,
    ruleProviders: null
};

// ===================== 图标配置 =====================
/**
 * 图标开关配置
 */
const SETTINGS = {
    DISPLAY_ICONS: false
};

/**
 * 策略组图标配置
 */
const ICONS = {
    GLOBAL_ROUTING: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Proxy.png",
    ALL_NODES: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "World_Map.png",
    SPEED_TEST: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Speedtest.png",
    FAILOVER: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Final.png",
    LOAD_BALANCE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Balance.png",
    HOME_NETWORK: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "VIP.png",
    LOW_RATE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Speedtest.png",
    NOTIFICATION: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Apple_Mail.png",
    
    HK: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Hong_Kong.png",
    SG: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Singapore.png",
    JP: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Japan.png",
    US: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "United_States.png",
    GLOBAL: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "World_Map.png",
    
    OFFICE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Notion.png",
    AI: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "ChatGPT.png",
    CLOUD: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Server.png",
    VIDEO: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "YouTube.png",
    GOOGLE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Google_Search.png",
    MICROSOFT: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Microsoft.png",
    UNREAL: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Download.png",
    
    AD_BLOCK: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Advertising.png",
    TRACKING: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Reject.png",
    
    DOWNLOAD: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Download.png",
    
    CUSTOM_PROXY: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Proxy.png",
    CUSTOM_DIRECT: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Direct.png",
    
    DOMESTIC: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "StreamingCN.png",
    INTERNATIONAL: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Streaming!CN.png"
};

/**
 * 主入口函数 - 处理Clash配置文件
 */
const main = (params) => {
    if (!params.proxies) return params;
    
    overwriteBasicOptions(params);
    overwriteSniffer(params);
    overwriteProxyGroups(params);
    overwriteRules(params);
    overwriteDns(params);
    overwriteTunnel(params);
    
    clearCache();
    
    return params;
};

// ===================== 缓存管理函数 =====================
/**
 * 清理缓存函数
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
 * 覆盖基础配置选项
 */
function overwriteBasicOptions(params) {
    Object.assign(params, {
        "mixed-port": 7890,
        "allow-lan": true,
        "unified-delay": true,
        "tcp-concurrent": true,
        "geodata-mode": true,
        "geodata-mode": true,
        "geox-url": {
            "geoip": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat",
            "geosite": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat"
        },
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
 * 覆盖流量嗅探配置
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
            "149.154.160.0/20", "185.76.151.0/24", "2001:67c:4e8::/48",
            "2001:b28:f23c::/47", "2001:b28:f23f::/48", "2a0a:f280:203::/48"
        ]
    };
}

// ===================== 代理组配置模块 =====================
/**
 * 覆盖代理组配置
 */
function overwriteProxyGroups(params) {
    if (CACHE.proxyGroups) {
        params["proxy-groups"] = CACHE.proxyGroups;
        params.__hasResidential = CACHE.residentialProxies && CACHE.residentialProxies.length > 0;
        params.__hasLowRate = CACHE.lowRateProxies && CACHE.lowRateProxies.length > 0;
        return;
    }
    
    const COUNTRY_REGIONS = createRegionalConfig();
    
    const { allProxies, availableRegions, residentialProxies, lowRateProxies, hasResidential, hasLowRate, hasOtherProxies, notificationProxies, hasNotifications } = 
        processProxyNodes(params, COUNTRY_REGIONS);
    
    params.__hasResidential = hasResidential;
    params.__hasLowRate = hasLowRate;
    params.__hasNotifications = hasNotifications;
    
    CACHE.residentialProxies = residentialProxies;
    CACHE.lowRateProxies = lowRateProxies;
    
    const coreGroups = createCoreGroups(allProxies, COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasNotifications);
    const manualSelectGroups = createRegionalGroups(params, COUNTRY_REGIONS, availableRegions, hasNotifications, notificationProxies);
    const lineTypeGroups = createLineTypeGroups(hasResidential, residentialProxies, hasLowRate, lowRateProxies);
    const notificationGroups = createNotificationGroups(hasNotifications, notificationProxies);
    const serviceGroups = createServiceGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications);
    const trafficGroups = createTrafficGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications);
    const customRuleGroups = createCustomRuleGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications);
    const defaultRouteGroups = createDefaultRouteGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications);
    
    const allGroups = [
        ...coreGroups,
        ...manualSelectGroups,
        ...lineTypeGroups,
        ...notificationGroups,
        ...serviceGroups,
        ...trafficGroups, 
        ...customRuleGroups,
        ...defaultRouteGroups
    ];
    
    CACHE.proxyGroups = allGroups;
    params["proxy-groups"] = allGroups;
}

/**
 * 创建地区配置
 */
function createRegionalConfig() {
    return [
        { 
            code: "HK",
            name: "🇭🇰 香港",
            icon: ICONS.HK,
            regex: /(香港|HK|Hong Kong|🇭🇰)/i
        },
        {
            code: "SG", 
            name: "🇸🇬 新加坡",
            icon: ICONS.SG,
            regex: /(新加坡|狮城|SG|Singapore|🇸🇬)/i
        },
        {
            code: "JP", 
            name: "🇯🇵 日本",
            icon: ICONS.JP,
            regex: /(日本|JP|Japan|🇯🇵)/i
        },
        {
            code: "US", 
            name: "🇺🇸 美国", 
            icon: ICONS.US,
            regex: /(美国|US|USA|United States|America|🇺🇸)/i
        }
    ];
}

/**
 * 处理代理节点分类
 */
function processProxyNodes(params, COUNTRY_REGIONS) {
    const PROXY_REGEX = REGEX_PATTERNS.NOTIFICATION_EXCLUDE;
    const allProxies = getProxiesByRegex(params, PROXY_REGEX);
    
    const availableRegions = new Set();
    params.proxies.forEach(proxy => {
        const region = COUNTRY_REGIONS.find(r => r.regex.test(proxy.name));
        if (region) {
            availableRegions.add(region.name);
        }
    });
    
    const residentialProxies = getProxiesByRegex(params, REGEX_PATTERNS.RESIDENTIAL);
    const lowRateProxies = getProxiesByRegex(params, REGEX_PATTERNS.LOW_RATE);
    const hasResidential = residentialProxies.length > 0;
    const hasLowRate = lowRateProxies.length > 0;
    
    const otherProxies = params.proxies
        .filter(proxy => 
            !COUNTRY_REGIONS.some(region => region.regex.test(proxy.name)) &&
            !REGEX_PATTERNS.RESIDENTIAL_CHECK.test(proxy.name) &&
            !REGEX_PATTERNS.LOW_RATE_CHECK.test(proxy.name) &&
            !REGEX_PATTERNS.NOTIFICATION_CHECK.test(proxy.name)
        )
        .map(proxy => proxy.name);
    const hasOtherProxies = otherProxies.length > 0;
    
    const notificationProxies = params.proxies
        .filter(proxy => REGEX_PATTERNS.NOTIFICATION.test(proxy.name))
        .map(proxy => proxy.name);
    const hasNotifications = notificationProxies.length > 0;
    
    return {
        allProxies: allProxies.length ? allProxies : ["DIRECT"],
        availableRegions,
        residentialProxies,
        lowRateProxies,
        hasResidential,
        hasLowRate,
        hasOtherProxies,
        notificationProxies,
        hasNotifications
    };
}

/**
 * 创建基础选项数组
 */
function createBaseOptions(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasNotifications, hasOtherProxies = false) {
    const baseOptions = [
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name}`),
        ...(hasOtherProxies ? ["🌐 其他地区"] : []),
        ALL_NODES_GROUP,
        "⚡ 延迟优选",
        "🚧 故障转移",
        ...(hasResidential ? [RESIDENTIAL_LINE] : []),
        ...(hasLowRate ? [LOW_RATE_NODE] : []),
        ...(hasNotifications ? [NOTIFICATION_GROUP] : []),
        "⚖️ 负载均衡 · 散列",
        "🔁 负载均衡 · 轮询",
        "DIRECT",
        "REJECT"
    ];
    
    return baseOptions;
}

/**
 * 创建核心策略组
 */
function createCoreGroups(allProxies, COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasNotifications) {
    const baseOptions = createBaseOptions(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasNotifications, true);
    
    return [
        createProxyGroup(GLOBAL_ROUTING, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            proxies: baseOptions,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.GLOBAL_ROUTING : undefined
        }),
        
        createProxyGroup("⚡ 延迟优选", "url-test", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.SPEED_TEST : undefined,
            hidden: true
        }),
        
        createProxyGroup("🚧 故障转移", "fallback", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.FAILOVER : undefined,
            hidden: true
        }),
        
        createProxyGroup("⚖️ 负载均衡 · 散列", "load-balance", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            strategy: "consistent-hashing",
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.LOAD_BALANCE : undefined,
            hidden: true
        }),
        
        createProxyGroup("🔁 负载均衡 · 轮询", "load-balance", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            strategy: "round-robin",
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.LOAD_BALANCE : undefined,
            hidden: true
        }),

        createProxyGroup(ALL_NODES_GROUP, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            proxies: allProxies,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.ALL_NODES : undefined,
            hidden: false 
        }),
    ];
}

/**
 * 创建地区策略组
 */
function createRegionalGroups(params, COUNTRY_REGIONS, availableRegions, hasNotifications, notificationProxies) {
    const manualGroups = [];
    
    COUNTRY_REGIONS.forEach(region => {
        if (availableRegions.has(region.name)) {
            const regionProxies = params.proxies
                .filter(proxy => 
                    region.regex.test(proxy.name) &&
                    !REGEX_PATTERNS.RESIDENTIAL.test(proxy.name) &&
                    !REGEX_PATTERNS.LOW_RATE.test(proxy.name) &&
                    !REGEX_PATTERNS.NOTIFICATION.test(proxy.name)
                )
                .map(proxy => proxy.name);
            
            if (regionProxies.length > 0) {
                manualGroups.push(createProxyGroup(
                    `${region.name}`,
                    "select",
                    {
                        category: CONFIG_MANAGER.GROUP_CATEGORY.REGION,
                        proxies: regionProxies,
                        icon: SETTINGS.DISPLAY_ICONS ? region.icon : undefined,
                        hidden: false
                    }
                ));
            }
        }
    });
    
    const otherProxies = params.proxies
        .filter(proxy => 
            !COUNTRY_REGIONS.some(region => region.regex.test(proxy.name)) &&
            !REGEX_PATTERNS.RESIDENTIAL_CHECK.test(proxy.name) &&
            !REGEX_PATTERNS.LOW_RATE_CHECK.test(proxy.name) &&
            !REGEX_PATTERNS.NOTIFICATION_CHECK.test(proxy.name)
        )
        .map(proxy => proxy.name);
    
    if (otherProxies.length > 0) {
        manualGroups.push(createProxyGroup(
            "🌐 其他地区",
            "select",
            {
                category: CONFIG_MANAGER.GROUP_CATEGORY.REGION,
                proxies: otherProxies,
                icon: SETTINGS.DISPLAY_ICONS ? ICONS.GLOBAL : undefined,
                hidden: false
            }
        ));
    }
    
    return manualGroups;
}

/**
 * 创建线路特性策略组
 */
function createLineTypeGroups(hasResidential, residentialProxies, hasLowRate, lowRateProxies) {
    const groups = [];
    
    if (hasResidential) {
        groups.push(createProxyGroup(RESIDENTIAL_LINE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.LINE_TYPE,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.HOME_NETWORK : undefined,
            proxies: residentialProxies,
            hidden: false
        }));
    }
    
    if (hasLowRate) {
        groups.push(createProxyGroup(LOW_RATE_NODE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.LINE_TYPE,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.LOW_RATE : undefined,
            proxies: lowRateProxies,
            hidden: false
        }));
    }
    
    return groups;
}

/**
 * 创建通知策略组
 */
function createNotificationGroups(hasNotifications, notificationProxies) {
    const groups = [];
    
    if (hasNotifications) {
        groups.push(createProxyGroup(NOTIFICATION_GROUP, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CUSTOM,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.NOTIFICATION : undefined,
            proxies: notificationProxies,
            hidden: false
        }));
    }
    
    return groups;
}

/**
 * 创建服务策略组
 */
function createServiceGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications) {
    const serviceOptions = [
        GLOBAL_ROUTING,
        "⚡ 延迟优选",
        "🚧 故障转移",
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name}`),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []),
        ...(hasLowRate ? [LOW_RATE_NODE] : []),
        ...(hasOtherProxies ? ["🌐 其他地区"] : []),
        ...(hasNotifications ? [NOTIFICATION_GROUP] : []),
        ALL_NODES_GROUP,
        "DIRECT",
        "REJECT"
    ];
    
    return [
        createProxyGroup(OFFICE_MESSAGING, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.OFFICE : undefined
        }),
        createProxyGroup(AI_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.AI : undefined
        }),
        createProxyGroup(GOOGLE_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.GOOGLE : undefined
        }),
        createProxyGroup(MICROSOFT_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.MICROSOFT : undefined
        }),
        createProxyGroup(UNREAL_ENGINE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.UNREAL : undefined
        }),
        createProxyGroup(AD_BLOCKING, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: ["REJECT", "DIRECT"],
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.AD_BLOCK : undefined
        })
    ];
}

/**
 * 创建流量管理策略组
 */
function createTrafficGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications) {
    const trafficOptions = [
        GLOBAL_ROUTING,
        "DIRECT",
        "REJECT",
        "⚡ 延迟优选",
        "🚧 故障转移",
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name}`),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []),
        ...(hasLowRate ? [LOW_RATE_NODE] : []),
        ...(hasOtherProxies ? ["🌐 其他地区"] : []),
        ...(hasNotifications ? [NOTIFICATION_GROUP] : []),
        ALL_NODES_GROUP,
    ];
    
    return [
        createProxyGroup(HIGH_TRAFFIC_CHANNEL, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.TRAFFIC,
            proxies: trafficOptions,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.DOWNLOAD : undefined
        })
    ];
}

/**
 * 创建自定义规则策略组
 */
function createCustomRuleGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications) {
    const customOptions = [
        GLOBAL_ROUTING,
        "⚡ 延迟优选",
        "🚧 故障转移",
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name}`),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []),
        ...(hasLowRate ? [LOW_RATE_NODE] : []),
        ...(hasOtherProxies ? ["🌐 其他地区"] : []),
        ...(hasNotifications ? [NOTIFICATION_GROUP] : []),
        ALL_NODES_GROUP,
        "DIRECT",
        "REJECT"
    ];
    
    return [
        createProxyGroup(CUSTOM_PROXY_RULE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CUSTOM,
            proxies: customOptions,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.CUSTOM_PROXY : undefined
        }),
        createProxyGroup(CUSTOM_DIRECT_RULE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CUSTOM,
            proxies: ["DIRECT", ...customOptions],
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.CUSTOM_DIRECT : undefined
        })
    ];
}

/**
 * 创建默认路由策略组
 */
function createDefaultRouteGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications) {
    const defaultOptions = [
        GLOBAL_ROUTING,
        "DIRECT",
        "REJECT",
        "⚡ 延迟优选",
        "🚧 故障转移",
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name}`),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []),
        ...(hasLowRate ? [LOW_RATE_NODE] : []),
        ...(hasOtherProxies ? ["🌐 其他地区"] : []),
        ...(hasNotifications ? [NOTIFICATION_GROUP] : []),
        ALL_NODES_GROUP,
    ];
    
    return [
        createProxyGroup(DOMESTIC_TRAFFIC, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.DEFAULT_ROUTE,
            proxies: defaultOptions,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.DOMESTIC : undefined
        }),
        createProxyGroup(GLOBAL_TRAFFIC, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.DEFAULT_ROUTE,
            proxies: defaultOptions,
            icon: SETTINGS.DISPLAY_ICONS ? ICONS.INTERNATIONAL : undefined
        })
    ];
}

// ===================== 规则配置模块 =====================
/**
 * 覆盖规则配置
 */
function overwriteRules(params) {
    const customRules = [];
    const hasResidential = params.__hasResidential || false;
    const hasLowRate = params.__hasLowRate || false;
    
    const rules = [
        `RULE-SET,Reject_no_ip,${AD_BLOCKING}`,
        `RULE-SET,Reject_domainset,${AD_BLOCKING}`,
        `RULE-SET,Reject_no_ip_drop,${AD_BLOCKING}`,
        `RULE-SET,Reject_no_ip_no_drop,${AD_BLOCKING}`,
        `RULE-SET,Reject_ip,${AD_BLOCKING}`,
        `RULE-SET,CustomRejectRules,${AD_BLOCKING}`,
        
        "GEOSITE,cn,DIRECT",
        "GEOIP,cn,DIRECT,no-resolve",
        `RULE-SET,Lan_ip,DIRECT`,
        `RULE-SET,Domestic_no_ip,DIRECT`,
        
        ...customRules,
        
        `RULE-SET,applications,${HIGH_TRAFFIC_CHANNEL}`,
        
        `RULE-SET,CustomProxyRules,${CUSTOM_PROXY_RULE}`,
        `RULE-SET,CustomDirectRules,${CUSTOM_DIRECT_RULE}`,
        
        `RULE-SET,Figma_ip,${OFFICE_MESSAGING}`,
        `RULE-SET,Notion_ip,${OFFICE_MESSAGING}`,
        `RULE-SET,Github,${OFFICE_MESSAGING}`,
        `RULE-SET,OneDrive,${OFFICE_MESSAGING}`,
        `RULE-SET,Dropbox,${OFFICE_MESSAGING}`,
        `RULE-SET,Telegram_ip,${OFFICE_MESSAGING}`,
        `RULE-SET,Telegram_no_ip,${OFFICE_MESSAGING}`,
        
        `RULE-SET,OpenAI,${AI_SERVICE}`,
        `RULE-SET,AI_no_ip,${AI_SERVICE}`,
        `RULE-SET,Gemini,${AI_SERVICE}`,
        `RULE-SET,YouTube,${GOOGLE_SERVICE}`,
        `RULE-SET,GoogleFCM_ip,${GOOGLE_SERVICE}`,
        `RULE-SET,Google,${GOOGLE_SERVICE}`,
        `RULE-SET,GoogleFCM_no_ip,${GOOGLE_SERVICE}`,
        `RULE-SET,Microsoft_no_ip,${MICROSOFT_SERVICE}`,
        
        `RULE-SET,MicrosoftCDN_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,CDN_domainset,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,CDN_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,Download_domainset,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,Download_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,GameDownload,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,Stream_ip,${HIGH_TRAFFIC_CHANNEL}`,
        
        `RULE-SET,UnrealRules,${UNREAL_ENGINE}`,
        
        `GEOIP,CN,${DOMESTIC_TRAFFIC}`,
        `MATCH,${GLOBAL_TRAFFIC}`
    ];
    
    params.rules = rules;
    params["rule-providers"] = createRuleProviders();
}

// ===================== 规则提供器配置 =====================
/**
 * 创建规则提供器配置
 */
function createRuleProviders() {
    if (CACHE.ruleProviders) {
        return CACHE.ruleProviders;
    }
    
    function createRuleProviderConfig(url, path, interval = CONFIG_MANAGER.UPDATE_INTERVALS.DEFAULT) {
        return {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: interval,
            url: url,
            path: path
        };
    }
    
    const providers = {
        Reject_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/ip/Reject_ip.yaml",
            "./ruleset/toookamak/Reject_ip.yaml"
        ),
        Reject_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip.yaml", 
            "./ruleset/toookamak/Reject_no_ip.yaml"
        ),
        Reject_domainset: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_domainset.yaml",
            "./ruleset/toookamak/Reject_domainset.yaml"
        ),
        Reject_no_ip_drop: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_drop.yaml",
            "./ruleset/toookamak/Reject_no_ip_drop.yaml"
        ),
        Reject_no_ip_no_drop: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_no_drop.yaml",
            "./ruleset/toookamak/Reject_no_ip_no_drop.yaml"
        ),
        
        GoogleFCM_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/GoogleFCM_ip.yaml",
            "./ruleset/toookamak/GoogleFCM_ip.yaml"
        ),
        Lan_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Lan_ip.yaml",
            "./ruleset/toookamak/Lan_ip.yaml"
        ),
        SteamCN_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/SteamCN_ip.yaml",
            "./ruleset/toookamak/SteamCN_ip.yaml"
        ),
        Domestic_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Domestic_no_ip.yaml",
            "./ruleset/toookamak/Domestic_no_ip.yaml"
        ),
        GoogleFCM_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/GoogleFCM_no_ip.yaml",
            "./ruleset/toookamak/GoogleFCM_no_ip.yaml"
        ),
        MicrosoftCDN_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/MicrosoftCDN_no_ip.yaml",
            "./ruleset/toookamak/MicrosoftCDN_no_ip.yaml"
        ),
        
        Stream_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Stream_ip.yaml",
            "./ruleset/toookamak/Stream_ip.yaml"
        ),
        Telegram_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Telegram_ip.yaml",
            "./ruleset/toookamak/Telegram_ip.yaml"
        ),
        AI_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/AI_no_ip.yaml",
            "./ruleset/toookamak/AI_no_ip.yaml"
        ),
        CDN_domainset: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_domainset.yaml",
            "./ruleset/toookamak/CDN_domainset.yaml"
        ),
        CDN_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_no_ip.yaml",
            "./ruleset/toookamak/CDN_no_ip.yaml"
        ),
        Download_domainset: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_domainset.yaml",
            "./ruleset/toookamak/Download_domainset.yaml"
        ),
        Download_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_no_ip.yaml",
            "./ruleset/toookamak/Download_no_ip.yaml"
        ),
        Microsoft_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Microsoft_no_ip.yaml",
            "./ruleset/toookamak/Microsoft_no_ip.yaml"
        ),
        Telegram_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Telegram_no_ip.yaml",
            "./ruleset/toookamak/Telegram_no_ip.yaml"
        ),

        Figma_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Figma/Figma.yaml",
            "./ruleset/toookamak/Figma_ip.yaml"
        ),
        Notion_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Notion/Notion.yaml",
            "./ruleset/toookamak/Notion_ip.yaml"
        ),
        Github: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/GitHub/GitHub.yaml",
            "./ruleset/toookamak/Github.yaml"
        ),
        OneDrive: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/OneDrive/OneDrive.yaml",
            "./ruleset/toookamak/OneDrive.yaml"
        ),
        YouTube: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/YouTube/YouTube.yaml",
            "./ruleset/toookamak/YouTube.yaml"
        ),
        Google: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Google/Google.yaml",
            "./ruleset/toookamak/Google.yaml"
        ),
        Gemini: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Gemini/Gemini.yaml",
            "./ruleset/toookamak/Gemini.yaml"
        ),
        OpenAI: createRuleProviderConfig(   
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/OpenAI/OpenAI.yaml",
            "./ruleset/toookamak/OpenAI.yaml"
        ),
        GameDownload: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Game/GameDownload/GameDownload.yaml",
            "./ruleset/toookamak/GameDownload.yaml"
        ),
        UnrealRules: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Epic/Epic.yaml",
            "./ruleset/toookamak/UnrealRules.yaml"
        ),
        Dropbox: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Dropbox/Dropbox.yaml",
            "./ruleset/toookamak/Dropbox.yaml"
        ),

        CustomProxyRules: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
            url: CONFIG_MANAGER.CUSTOM_RULES.PROXY_URL,
            path: "./ruleset/toookamak/OwnPROXYRules.yaml"
        },
        CustomDirectRules: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
            url: CONFIG_MANAGER.CUSTOM_RULES.DIRECT_URL,
            path: "./ruleset/toookamak/OwnDIRECTRules.yaml"
        },
        CustomRejectRules: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
            url: CONFIG_MANAGER.CUSTOM_RULES.REJECT_URL,
            path: "./ruleset/toookamak/OwnREJECTRules.yaml"
        },

        applications: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
            url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/applications.txt",
            path: "./ruleset/toookamak/applications.yaml"
        }
    };
    
    CACHE.ruleProviders = providers;
    return providers;
}

// ===================== 辅助函数 =====================
/**
 * 创建代理组
 */
function createProxyGroup(name, type, options = {}) {
    const base = { 
        name,
        type,
        category: options.category || "未分类",
        url: type !== "select" ? CONFIG_MANAGER.TEST_URL : undefined,
        interval: type !== "select" ? 600 : undefined
    };
    
    if (type === "load-balance") {
        Object.assign(options, {
            "max-failed-times": 3,
            lazy: true
        });
    }
    
    // 统一图标处理
    if (SETTINGS.DISPLAY_ICONS && options.icon) {
        base.icon = options.icon;
    }
    
    return Object.assign(base, options);
}

/**
 * 根据正则表达式获取代理节点
 */
function getProxiesByRegex(params, regex, fallback = ["DIRECT"]) {
    const matched = params.proxies
        .filter(e => regex.test(e.name))
        .map(e => e.name);
    return matched.length ? matched : fallback;
}

// ===================== DNS配置模块 =====================
/**
 * 覆盖DNS配置
 */
function overwriteDns(params) {
    params.dns = {
        enable: true,
        listen: "0.0.0.0:1053",
        "enhanced-mode": "fake-ip",
        "fake-ip-range": "198.18.0.1/16",
        "use-hosts": false,
        "use-system-hosts": false,
        ipv6: false,
        "fake-ip-filter": [
            "*.lan", "*.local",// 局域网地址
            "time.*.com", "ntp.*.com",// 时间同步
            "*.xiaomi.com",// 小米相关
            "*.apple.com" ,// Apple 相关
            "localhost.ptlogin2.qq.com",// 腾讯相关
            "localhost.sec.qq.com",// 腾讯相关
            "*.qq.com", "*.tencent.com",// 腾讯相关
            "*.msftconnecttest.com",//  Microsoft 相关
            "*.msftncsi.com"//  Microsoft 相关
        ],
        "default-nameserver": [
            "tls://223.5.5.5",          // 阿里 DNS
            "tls://1.1.1.1",           // Cloudflare
            "tls://9.9.9.9",           // Quad9
            
        ],
        nameserver: [
            "https://dns.alidns.com/dns-query",
            "https://cloudflare-dns.com/dns-query",
            "https://doh.pub/dns-query"
        ],
        "proxy-server-nameserver": [
          'https://1.1.1.1/dns-query',
          'https://223.5.5.5/dns-query'
        ],
        "nameserver-policy": {
            'geosite:private': 'system',
            'geosite:cn': ['119.29.29.29', '223.5.5.5'],
            'geosite:geolocation-!cn': ['https://cloudflare-dns.com/dns-query'],
            'domain:.cn': ['119.29.29.29', '223.5.5.5'], // 特别指明.cn区
            'geosite:category-games@cn': ['119.29.29.29', '223.5.5.5']
        }
    };
}

// ===================== TUN配置模块 =====================
/**
 * 覆盖TUN配置
 */
function overwriteTunnel(params) {
    params.tun = {
        enable: true,
        stack: "mixed",
        device: "Mihomo",
        "dns-hijack": ["any:53"],
        "auto-route": true,
        "auto-redirect": false,
        "auto-detect-interface": true,
        "strict-route": false,
        "route-exclude-address": [],
        mtu: 1500
    };
}
