// FL_Clash_Rule_DIY.js - 策略组优化版
// 修复：lineTypeGroups未定义问题
// 特点：完整修复所有分组引用问题
// 版本：v7.5.1
// 最后更新：2024-06-20

// ===================== 全局配置常量 =====================
const TEST_URL = "http://www.gstatic.com/generate_204";

// ===================== 策略组分类常量 =====================
const GROUP_CATEGORY = {
  CORE: "核心路由",
  REGION_ENTRY: "地区选择",
  REGION: "具体地区",
  LINE_TYPE: "线路特性",
  SERVICE: "服务专用",
  TRAFFIC: "流量管理",
  CUSTOM: "自定义规则",
  DEFAULT_ROUTE: "默认路由"
};

// ===================== 策略组命名常量 =====================
const PROXY_MODE = "代理模式";
const MANUAL_REGION_SELECT = "手动选择 (地区)";
const RESIDENTIAL_LINE = "家宽/原生线路";
const LOW_RATE_NODE = "低倍率节点";
const INSTANT_MESSAGING = "即时通讯";
const AI_SERVICE = "AI服务";
const PLATFORM_SERVICE = "平台服务";
const VIDEO_STREAMING = "视频服务";
const GOOGLE_SERVICES = "谷歌服务";
const MICROSOFT_SERVICES = "微软服务";
const GITHUB_SERVICES = "GitHub服务";
const UNREAL_ENGINE = "虚幻引擎";
const AD_BLOCKING = "广告拦截";
const HIGH_TRAFFIC_CHANNEL = "大流量通道";
const OFFICE_OPTIMIZED = "办公优化通道";
const CUSTOM_PROXY_RULE = "自定义代理规则";
const CUSTOM_DIRECT_RULE = "自定义直连规则";
const DOMESTIC_TRAFFIC = "国内流量";
const GLOBAL_TRAFFIC = "国际流量";

// 自定义规则URL
const CUSTOM_PROXY_RULES_URL = "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnPROXYRules.list";
const CUSTOM_DIRECT_RULES_URL = "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnDIRECTRules.list";

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
    
    return params;
};

// ===================== 基础设置模块 =====================
function overwriteBasicOptions(params) {
    Object.assign(params, {
        "mixed-port": 7890,
        "allow-lan": true,
        "unified-delay": true,
        "tcp-concurrent": true,
        "geodata-mode": true,
        "geodata-loader": "standard",
        "geox-url": {
            "geoip": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat",
            "geosite": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat"
        },
        "find-process-mode": "strict",
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

// ===================== 代理组配置模块 (已完整实现) =====================
function overwriteProxyGroups(params) {
    // 地区配置（包含台湾）
    const COUNTRY_REGIONS = [
        { 
            code: "HK", name: "香港", 
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/hk.svg",
            regex: /(香港|HK|Hong Kong|🇭🇰)/i
        },
        {
            code: "SG", name: "新加坡",
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/sg.svg",
            regex: /(新加坡|狮城|SG|Singapore|🇸🇬)/i
        },
        {
            code: "JP", name: "日本",
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/jp.svg",
            regex: /(日本|JP|Japan|🇯🇵)/i
        },
        {
            code: "US", name: "美国",
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/us.svg",
            regex: /(美国|US|USA|United States|America|🇺🇸)/i
        },
        {
            code: "TW", name: "台湾省",
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/tw.svg",
            regex: /(台湾|TW|Taiwan|🇹🇼)/i
        }
    ];

    // 获取有效代理
    const PROXY_REGEX = /^(?!.*(?:自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire)).*$/;
    const allProxies = getProxiesByRegex(params, PROXY_REGEX);
    const availableRegions = new Set();
    
    // 节点过滤正则
    const RESIDENTIAL_REGEX = /(家宽|原生|residential|home)/i;
    const LOW_RATE_REGEX = /(低倍率|lowrate|low-rate|倍率)/i;
    
    // 节点分类处理
    params.proxies.forEach(proxy => {
        const region = COUNTRY_REGIONS.find(r => r.regex.test(proxy.name));
        region ? availableRegions.add(region.name) : null;
    });

    // 创建地区自动选择组（直接添加到代理模式）
    const autoGroups = COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))
        .map(region => createProxyGroup(
            `${region.name} · 自动选择`, 
            "url-test", 
            {
                category: GROUP_CATEGORY.REGION,
                url: TEST_URL,
                interval: 300,
                tolerance: 50,
                proxies: getProxiesByRegex(params, region.regex),
                hidden: false
            }
        ))
        .filter(g => g.proxies.length > 0);

    // 创建地区手动选择组
    const manualGroups = COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))
        .map(region => createProxyGroup(
            `${region.name} · 手动选择`, 
            "select", 
            {
                category: GROUP_CATEGORY.REGION,
                proxies: getProxiesByRegex(params, region.regex),
                icon: region.icon,
                hidden: false
            }
        ))
        .filter(g => g.proxies.length > 0);

    // 获取家宽/原生节点
    const residentialProxies = getProxiesByRegex(params, RESIDENTIAL_REGEX);
    const hasResidential = residentialProxies.length > 0;
    
    // 获取低倍率节点
    const lowRateProxies = getProxiesByRegex(params, LOW_RATE_REGEX);
    const hasLowRate = lowRateProxies.length > 0;
    
    // ===== 线路特性策略组 (修复此处) =====
    const lineTypeGroups = [
        // 家宽/原生线路
        hasResidential ? createProxyGroup(RESIDENTIAL_LINE, "select", {
            category: GROUP_CATEGORY.LINE_TYPE,
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/home-network.svg",
            proxies: residentialProxies,
            hidden: false
        }) : null,
        
        // 低倍率节点
        hasLowRate ? createProxyGroup(LOW_RATE_NODE, "select", {
            category: GROUP_CATEGORY.LINE_TYPE,
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/low-rate.svg",
            proxies: lowRateProxies,
            hidden: false
        }) : null
    ].filter(Boolean);

    // ===== 核心路由策略组 =====
    const coreGroups = [
        // 代理模式（包含各地区自动选择组）
        createProxyGroup(PROXY_MODE, "select", {
            category: GROUP_CATEGORY.CORE,
            proxies: [
                // 解散自动选择组，直接添加各地区自动选择
                ...autoGroups.map(g => g.name), 
                "延迟优选", 
                "故障转移", 
                ...manualGroups.map(g => g.name),
                ...(hasResidential ? [RESIDENTIAL_LINE] : []),
                ...(hasLowRate ? [LOW_RATE_NODE] : []),
                "负载均衡 · 散列", 
                "负载均衡 · 轮询", 
                "DIRECT",
                "REJECT"
            ],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/adjust.svg"
        }),
        
        // 延迟优选
        createProxyGroup("延迟优选", "url-test", {
            category: GROUP_CATEGORY.CORE,
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/speed.svg",
            hidden: false
        }),
        
        // 故障转移
        createProxyGroup("故障转移", "fallback", {
            category: GROUP_CATEGORY.CORE,
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/ambulance.svg",
            hidden: false
        }),
        
        // 负载均衡
        createProxyGroup("负载均衡 · 散列", "load-balance", {
            category: GROUP_CATEGORY.CORE,
            strategy: "consistent-hashing",
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/balance.svg",
            hidden: false
        }),
        
        createProxyGroup("负载均衡 · 轮询", "load-balance", {
            category: GROUP_CATEGORY.CORE,
            strategy: "round-robin",
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/merry_go.svg",
            hidden: false
        })
    ];

    // ===== 服务专用策略组 =====
    const coreOptions = [
        PROXY_MODE,
        "延迟优选",
        "故障转移",
        ...(hasLowRate ? [LOW_RATE_NODE] : []),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []),
        "DIRECT",
        "REJECT"
    ];

    const serviceGroups = [
        // === 新增服务组 ===
        createCustomGroup(VIDEO_STREAMING, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/video.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        createCustomGroup(GOOGLE_SERVICES, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/google.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        createCustomGroup(MICROSOFT_SERVICES, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/microsoft.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        createCustomGroup(GITHUB_SERVICES, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/github.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        createCustomGroup(UNREAL_ENGINE, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/unreal-engine.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        // === 原有服务组 ===
        createCustomGroup(INSTANT_MESSAGING, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/telegram.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        createCustomGroup(AI_SERVICE, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/chatgpt.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        createCustomGroup(PLATFORM_SERVICE, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/cloud.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        createProxyGroup(AD_BLOCKING, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: [...coreOptions, "REJECT"],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/adblock.svg"
        })
    ];

    // ===== 流量管理策略组 =====
    const trafficGroups = [
        createCustomGroup(HIGH_TRAFFIC_CHANNEL, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/download.svg", coreOptions, GROUP_CATEGORY.TRAFFIC),
        
        createCustomGroup(OFFICE_OPTIMIZED, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/office.svg", coreOptions, GROUP_CATEGORY.TRAFFIC)
    ];

    // ===== 自定义规则策略组 =====
    const customRuleGroups = [
        createCustomGroup(CUSTOM_PROXY_RULE, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/proxy-custom.svg", coreOptions, GROUP_CATEGORY.CUSTOM),
        
        createCustomGroup(CUSTOM_DIRECT_RULE, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/direct-custom.svg", coreOptions, GROUP_CATEGORY.CUSTOM)
    ];

    // ===== 默认路由策略组 =====
    const defaultRouteGroups = [
        createCustomGroup(DOMESTIC_TRAFFIC, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/cn.svg", coreOptions, GROUP_CATEGORY.DEFAULT_ROUTE),
        
        createCustomGroup(GLOBAL_TRAFFIC, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/global.svg", coreOptions, GROUP_CATEGORY.DEFAULT_ROUTE)
    ];

    // ===== 合并所有代理组 =====
    params["proxy-groups"] = [
        ...coreGroups,
        ...autoGroups,       // 各地区自动选择直接添加
        ...manualGroups,     // 各地区手动选择
        ...lineTypeGroups,   // 现在已正确定义
        ...serviceGroups,
        ...trafficGroups,
        ...customRuleGroups,
        ...defaultRouteGroups
    ];
    
    // 按分类排序
    params["proxy-groups"].sort((a, b) => {
        const order = Object.values(GROUP_CATEGORY);
        return order.indexOf(a.category) - order.indexOf(b.category);
    });
    
    // 存储策略组状态
    params.__hasResidential = hasResidential;
    params.__hasLowRate = hasLowRate;
}

// ===================== 规则配置模块 =====================
function overwriteRules(params) {
    // $$$$ 自定义规则添加区域 $$$$
    const customRules = [];
    
    // ================= 流量分流规则 =================
    const rules = [
        // === 广告拦截规则 ===
        'RULE-SET,Reject_no_ip,' + AD_BLOCKING,
        'RULE-SET,Reject_domainset,' + AD_BLOCKING,
        'RULE-SET,Reject_no_ip_drop,' + AD_BLOCKING,
        'RULE-SET,Reject_no_ip_no_drop,' + AD_BLOCKING,
        'RULE-SET,Reject_ip,' + AD_BLOCKING,
        
        // $$$$ 用户自定义规则区域 $$$$
        ...customRules,
        
        // === 自定义规则集 ===
        'RULE-SET,CustomProxyRules,' + CUSTOM_PROXY_RULE,
        'RULE-SET,CustomDirectRules,' + CUSTOM_DIRECT_RULE,
        
        // === AI服务规则 ===
        'DOMAIN-SUFFIX,grazie.ai,' + AI_SERVICE,
        'DOMAIN-SUFFIX,grazie.aws.intellij.net,' + AI_SERVICE,
        'RULE-SET,ai,' + AI_SERVICE,
        
        // === 社交媒体规则 ===
        'GEOSITE,youtube,' + VIDEO_STREAMING,
        'GEOIP,telegram,' + INSTANT_MESSAGING,
        
        // === 隐私保护规则 ===
        'GEOSITE,tracker,' + AD_BLOCKING,
        
        // === 广告过滤规则 ===
        'GEOSITE,category-ads-all,' + AD_BLOCKING,
        'RULE-SET,adblockmihomo,' + AD_BLOCKING,
        
        // === 平台服务规则 ===
        'GEOSITE,apple-cn,' + PLATFORM_SERVICE,
        'GEOSITE,google,' + GOOGLE_SERVICES,
        'GEOSITE,microsoft@cn,' + DOMESTIC_TRAFFIC,
        'GEOSITE,microsoft,' + MICROSOFT_SERVICES,
        'GEOSITE,github,' + GITHUB_SERVICES,
        
        // === 游戏平台规则 ===
        'RULE-SET,epicDownload,' + HIGH_TRAFFIC_CHANNEL,
        'RULE-SET,UnrealRules,' + UNREAL_ENGINE,  // 新增虚幻引擎规则
        
        // === 基础路由规则 ===
        'GEOSITE,private,DIRECT',
        'GEOIP,private,DIRECT,no-resolve',
        'GEOSITE,cn,' + DOMESTIC_TRAFFIC,
        'GEOIP,cn,' + DOMESTIC_TRAFFIC + ',no-resolve',
        
        // === 最终匹配规则 ===
        `GEOIP,CN,${DOMESTIC_TRAFFIC}`,
        `MATCH,${GLOBAL_TRAFFIC}`
    ];
    
    params.rules = rules;
    params["rule-providers"] = createRuleProviders();
    
    function createRuleProviders() {
        return {
            // ======== 规则提供器 ========
            VideoRules: {
                type: "http",
                behavior: "classical",
                format: "text",
                url: "https://REPLACE_WITH_YOUR_VIDEO_RULES_URL", // 请替换为实际的视频规则URL
                path: "./ruleset/toookamak/VideoRules.list",
                interval: 86400
            },
            GoogleRules: {
                type: "http",
                behavior: "classical",
                format: "text",
                url: "https://REPLACE_WITH_YOUR_GOOGLE_RULES_URL", // 请替换为实际的谷歌规则URL
                path: "./ruleset/toookamak/GoogleRules.list",
                interval: 86400
            },
            MicrosoftRules: {
                type: "http",
                behavior: "classical",
                format: "text",
                url: "https://REPLACE_WITH_YOUR_MICROSOFT_RULES_URL", // 请替换为实际的微软规则URL
                path: "./ruleset/toookamak/MicrosoftRules.list",
                interval: 86400
            },
            GithubRules: {
                type: "http",
                behavior: "classical",
                format: "text",
                url: "https://REPLACE_WITH_YOUR_GITHUB_RULES_URL", // 请替换为实际的GitHub规则URL
                path: "./ruleset/toookamak/GithubRules.list",
                interval: 86400
            },
            UnrealRules: {
                type: "http",
                behavior: "classical",
                format: "text",
                url: "https://REPLACE_WITH_YOUR_UNREAL_ENGINE_URL", // 请替换为实际的虚幻引擎规则URL
                path: "./ruleset/toookamak/UnrealRules.list",
                interval: 86400
            },
            
            // ======== 原有规则提供器 ========
            applications: {
                type: "http",
                behavior: "classical",
                format: "text",
                url: "https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@clash-ruleset/applications.list",
                path: "./ruleset/toookamak/applications.list",
                interval: 86400
            },
            Reject_ip: {
                type: "http",
                behavior: "classical",
                format: "yaml",
                url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/ip/Reject_ip.yaml",
                path: "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/ip/Reject_ip.yaml",
                interval: 1800
            },
            Reject_no_ip: {
                type: "http",
                behavior: "classical",
                format: "yaml",
                url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip.yaml",
                path: "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_no_ip.yaml",
                interval: 1800
            },
            Reject_domainset: {
                type: "http",
                behavior: "domain",
                format: "yaml",
                url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_domainset.yaml",
                path: "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_domainset.yaml",
                interval: 1800
            },
            Reject_no_ip_drop: {
                type: "http",
                behavior: "classical",
                format: "yaml",
                url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_drop.yaml",
                path: "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_no_ip_drop.yaml",
                interval: 1800
            },
            Reject_no_ip_no_drop: {
                type: "http",
                behavior: "classical",
                format: "yaml",
                url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_no_drop.yaml",
                path: "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_no_ip_no_drop.yaml",
                interval: 1800
            },
            ai: {
                type: "http",
                behavior: "classical",
                format: "text",
                url: "https://github.com/dahaha-365/YaNet/raw/refs/heads/dist/rulesets/mihomo/ai.list",
                path: "./ruleset/toookamak/ai.list",
                interval: 86400
            },
            adblockmihomo: {
                type: "http",
                behavior: "domain",
                format: "mrs",
                url: "https://github.com/217heidai/adblockfilters/raw/refs/heads/main/rules/adblockmihomo.mrs",
                path: "./ruleset/toookamak/adblockmihomo.mrs",
                interval: 86400
            },
            epicDownload: {
                type: "http",
                behavior: "classical",
                format: "text",
                url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Epic/Epic.list",
                path: "./ruleset/toookamak/Epic.list",
                interval: 86400
            },
            CustomProxyRules: {
                type: "http",
                behavior: "classical",
                format: "text",
                interval: 86400,
                url: CUSTOM_PROXY_RULES_URL,
                path: "./ruleset/OwnRules/OwnPROXYRules.yaml"
            },
            CustomDirectRules: {
                type: "http",
                behavior: "classical",
                format: "text",
                interval: 86400,
                url: CUSTOM_DIRECT_RULES_URL,
                path: "./ruleset/OwnRules/OwnDIRECTRules.yaml"
            }
        };
    }
}

// ===================== DNS配置模块 =====================
function overwriteDns(params) {
    params.dns = {
        enable: true,
        listen: "0.0.0.0:1053",
        "enhanced-mode": "fake-ip",
        "fake-ip-range": "198.18.0.1/16",
        "use-hosts": true,
        "use-system-hosts": false,
        ipv6: false,
        "respect-rules": true,
        "fake-ip-filter": [
            "*.lan", "*.local", "*.localhost",
            "time*.*.com", "time.*.com", "ntp.*.com",
            "*.market.xiaomi.com",
            "localhost.ptlogin2.qq.com",
            "localhost.sec.qq.com",
            "+.qq.com", "+.tencent.com",
            "+.msftconnecttest.com",
            "+.msftncsi.com",
            "+.srv.nintendo.net",
            "+.stun.playstation.net",
            "xbox.*.microsoft.com"
        ],
        "default-nameserver": [
            "tls://223.5.5.5:853",
            "tls://119.29.29.29:853"
        ],
        nameserver: [
            "https://dns.alidns.com/dns-query#h3=true",
            "https://doh.pub/dns-query#h3=true",
            "https://223.6.6.6/dns-query"
        ],
        fallback: [
            "https://1.1.1.1/dns-query#h3=true",
            "https://8.8.8.8/dns-query#h3=true",
            "tls://1.1.1.1:853"
        ],
        "fallback-filter": {
            geoip: true,
            "geoip-code": "CN",
            ipcidr: ["240.0.0.0/4"]
        },
        "proxy-server-nameserver": [
            "https://1.1.1.1/dns-query#h3=true",
            "https://8.8.8.8/dns-query#h3=true",
            "tls://1.1.1.1:853"
        ],
        "nameserver-policy": {
            "geosite:private": "system",
            "geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn": ["119.29.29.29", "223.5.5.5"],
            "geosite:geolocation-!cn": ["1.1.1.1", "8.8.8.8"],
            "+.github.com,+.githubusercontent.com": ["1.1.1.1", "8.8.8.8"]
        }
    };
}

// ===================== TUN配置模块 =====================
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
        "route-exclude-address": [
            "192.168.0.0/16",
            "10.0.0.0/8", 
            "172.16.0.0/12",
            "127.0.0.0/8",
            "169.254.0.0/16"
        ],
        mtu: 1500
    };
}

// ===================== 辅助函数 =====================
function createProxyGroup(name, type, options = {}) {
    const base = { 
        name, 
        type, 
        category: options.category || "未分类",
        url: type !== "select" ? TEST_URL : undefined, 
        interval: type !== "select" ? 300 : undefined
    };
    
    if (type === "load-balance") {
        Object.assign(options, {
            "max-failed-times": 3,
            lazy: true
        });
    }
    
    return Object.assign(base, options);
}

function createCustomGroup(name, icon, proxies, category) {
    return {
        name,
        type: "select",
        category: category || "未分类",
        icon: icon,
        proxies: [...proxies],
        hidden: false
    };
}

// ===== getProxiesByRegex 函数 =====
function getProxiesByRegex(params, regex, fallback = ["DIRECT"]) {
    const matched = params.proxies
        .filter(e => regex.test(e.name))
        .map(e => e.name);
    return matched.length ? matched : fallback;
}
