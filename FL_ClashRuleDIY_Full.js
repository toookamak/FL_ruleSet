// FL_ClashRuleDIY_Full.js - Clash/Mihomo高级规则配置脚本
// 版本：v7.3.1 修复版
// 特点：修复缺失规则集，完整检查所有规则引用
// 最后更新：2023-12-15

// ===================== 全局配置常量 =====================
const PROXY_NAME = "代理模式";
const TEST_URL = "http://www.gstatic.com/generate_204";
const RESIDENTIAL_GROUP = "家宽/原生";
const LOW_RATE_GROUP = "低倍率";
const CUSTOM_PROXY_GROUP = "自定义代理规则";
const CUSTOM_DIRECT_GROUP = "自定义直连规则";

// ===================== 主入口函数 =====================
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

// ===================== 规则提供器工厂函数 =====================
/**
 * 创建标准规则提供器
 * @param {string} behavior - 规则行为类型 (ipcidr|domain|classical)
 * @param {string} url - 完整的远程规则URL
 * @param {string} path - 完整的本地缓存路径
 * @returns {Object} 规则提供器配置
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
 * @param {string} url - 完整的远程规则URL
 * @param {string} path - 完整的本地缓存路径
 * @returns {Object} 自定义规则提供器配置
 */
function createCustomRuleProvider(url, path) {
    return {
        type: "http",
        behavior: "classical",
        format: "text",  // LIST格式
        interval: 86400, // 24小时更新一次
        url: url,
        path: path
    };
}

// ===================== 基础设置模块 =====================
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
function overwriteSniffer(params) {
    params.sniffer = {
        enable: true,
        "force-dns-mapping": true,
        "parse-pure-ip": true,
        "override-destination": false,
        sniff: {
            HTTP: { ports: ["80", "443"], "override-destination": false },
            TLS: { ports: ["443"] }
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
function overwriteProxyGroups(params) {
    // 使用完整图标URL（示例）
    const ICON_BASE = "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io/main/docs/assets/icons";
    
    // 地区配置
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

    // 节点分类
    const PROXY_REGEX = /^(?!.*(?:自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire)).*$/;
    const allProxies = getProxiesByRegex(params, PROXY_REGEX);
    const availableRegions = new Set();
    
    const RESIDENTIAL_REGEX = /(家宽|原生|residential|home)/i;
    const LOW_RATE_REGEX = /(低倍率|lowrate|low-rate|倍率)/i;
    
    params.proxies.forEach(proxy => {
        const region = COUNTRY_REGIONS.find(r => r.regex.test(proxy.name));
        region ? availableRegions.add(region.name) : null;
    });

    // 代理组创建
    const autoGroups = COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))
        .map(region => ({
            name: `${region.name} - 自动选择`,
            type: "fallback",
            url: TEST_URL,
            interval: 300,
            tolerance: 50,
            proxies: getProxiesByRegex(params, region.regex),
            hidden: true
        }))
        .filter(g => g.proxies.length > 0);

    const manualGroups = COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))
        .map(region => ({
            name: `${region.name} - 手动选择`,
            type: "select",
            proxies: getProxiesByRegex(params, region.regex, ["手动选择"]),
            icon: region.icon,
            hidden: false
        }))
        .filter(g => g.proxies.length > 0);

    // 特殊节点组
    const residentialProxies = getProxiesByRegex(params, RESIDENTIAL_REGEX);
    const hasResidential = residentialProxies.length > 0;
    
    const lowRateProxies = getProxiesByRegex(params, LOW_RATE_REGEX);
    const hasLowRate = lowRateProxies.length > 0;
    
    const residentialGroup = hasResidential ? {
        name: RESIDENTIAL_GROUP,
        type: "select",
        icon: `${ICON_BASE}/home.svg`,
        proxies: residentialProxies,
        hidden: false
    } : null;
    
    const lowRateGroup = hasLowRate ? {
        name: LOW_RATE_GROUP,
        type: "select",
        icon: `${ICON_BASE}/battery.svg`,
        proxies: lowRateProxies,
        hidden: false
    } : null;
    
    // 核心代理组
    const coreGroups = [
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
        
        createProxyGroup("延迟优选", "url-test", {
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: `${ICON_BASE}/speed.svg`,
            hidden: true
        }),
        
        createProxyGroup("故障转移", "fallback", {
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: `${ICON_BASE}/ambulance.svg`,
            hidden: true
        }),
        
        createProxyGroup("手动选择", "select", {
            proxies: COUNTRY_REGIONS
                .filter(r => availableRegions.has(r.name))
                .flatMap(r => [`${r.name} - 自动选择`, `${r.name} - 手动选择`]),
            icon: `${ICON_BASE}/link.svg`
        }),
        
        createProxyGroup("负载均衡 (散列)", "load-balance", {
            strategy: "consistent-hashing",
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: `${ICON_BASE}/balance.svg`,
            hidden: true
        }),
        
        createProxyGroup("负载均衡 (轮询)", "load-balance", {
            strategy: "round-robin",
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: `${ICON_BASE}/merry_go.svg`,
            hidden: true
        })
    ];

    // 服务组
    const serviceGroups = [
        createServiceGroup("电报消息", "telegram.svg", availableRegions, COUNTRY_REGIONS, true, true, hasResidential, hasLowRate, true),
        createServiceGroup("AI", "chatgpt.svg", availableRegions, COUNTRY_REGIONS, true, true, hasResidential, hasLowRate, true),
        createServiceGroup("流媒体", "youtube.svg", availableRegions, COUNTRY_REGIONS, true, true, hasResidential, hasLowRate, true),
        createServiceGroup("苹果服务", "apple.svg", availableRegions, COUNTRY_REGIONS, false, false, hasResidential, hasLowRate, true),
        createServiceGroup("微软服务", "microsoft.svg", availableRegions, COUNTRY_REGIONS, true, false, hasResidential, hasLowRate, true),
        createServiceGroup("GoogleFCM", "google.svg", availableRegions, COUNTRY_REGIONS, true, true, hasResidential, hasLowRate, true),
        createServiceGroup("Steam地区", "steam.svg", availableRegions, COUNTRY_REGIONS, true, true, hasResidential, hasLowRate, true),
        createProxyGroup("漏网之鱼", "select", {
            proxies: ["DIRECT", PROXY_NAME],
            icon: `${ICON_BASE}/fish.svg`
        })
    ];

    // 自定义规则组
    const customRuleGroups = [
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

    // 合并代理组
    params["proxy-groups"] = [
        ...coreGroups,
        ...autoGroups,
        ...manualGroups,
        ...serviceGroups,
        ...customRuleGroups,
        ...(residentialGroup ? [residentialGroup] : []),
        ...(lowRateGroup ? [lowRateGroup] : [])
    ];
    
    // 存储状态
    params.__hasResidential = hasResidential;
    params.__hasLowRate = hasLowRate;
}

// ===================== 规则配置模块 =====================
function overwriteRules(params) {
    const customRules = [];
    
    // 策略组状态
    const hasResidential = params.__hasResidential || false;
    const hasLowRate = params.__hasLowRate || false;
    const cdnProxy = hasLowRate ? LOW_RATE_GROUP : PROXY_NAME;
    const downloadProxy = hasLowRate ? LOW_RATE_GROUP : PROXY_NAME;
    const residentialProxy = hasResidential ? RESIDENTIAL_GROUP : PROXY_NAME;
    
    // 规则集配置（使用完整URL和Path）
    params["rule-providers"] = {
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
        // 修复：添加缺失的Stream_no_ip规则集
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
        
        // === 新增自定义规则集 ===
        CustomProxyRules: createCustomRuleProvider(
            "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnPROXYRules.list",
            "./ruleset/OwnRules/OwnPROXYRules.yaml"
        ),
        CustomDirectRules: createCustomRuleProvider(
            "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnDIRECTRules.list",
            "./ruleset/OwnRules/OwnDIRECTRules.yaml"
        )
    };

    // 规则链（已检查所有规则集引用）
    params.rules = [
        // 广告拦截
        "RULE-SET,Reject_no_ip,REJECT",
        "RULE-SET,Reject_domainset,REJECT",
        "RULE-SET,Reject_no_ip_drop,REJECT-DROP",
        "RULE-SET,Reject_no_ip_no_drop,REJECT",
        
        // 自定义规则
        ...customRules,
        "RULE-SET,CustomProxyRules," + CUSTOM_PROXY_GROUP,
        "RULE-SET,CustomDirectRules," + CUSTOM_DIRECT_GROUP,
        
        // 非IP规则
        "RULE-SET,GoogleFCM_no_ip,GoogleFCM",
        "RULE-SET,SteamRegion_no_ip,Steam地区",
        
        // 流量优化
        "RULE-SET,CDN_domainset," + cdnProxy,
        "RULE-SET,CDN_no_ip," + cdnProxy,
        "RULE-SET,Download_domainset," + downloadProxy,
        "RULE-SET,Download_no_ip," + downloadProxy,
        "RULE-SET,Update_no_ip," + downloadProxy,
        
        // 质量敏感服务
        "RULE-SET,Stream_no_ip,流媒体",  // 修复：使用正确的规则集
        "RULE-SET,AI_no_ip," + residentialProxy,
        
        // 其他规则
        "RULE-SET,Telegram_no_ip,电报消息",
        "RULE-SET,MicrosoftCDN_no_ip,DIRECT",
        "RULE-SET,Microsoft_no_ip,微软服务",
        "RULE-SET,Global_no_ip," + PROXY_NAME,
        "RULE-SET,Domestic_no_ip,DIRECT",
        "RULE-SET,Lan_no_ip,DIRECT",
        
        // IP规则
        "RULE-SET,GoogleFCM_ip,GoogleFCM",
        "RULE-SET,Reject_ip,REJECT",
        "RULE-SET,Telegram_ip,电报消息",
        "RULE-SET,Stream_ip," + residentialProxy,
        "RULE-SET,Domestic_ip,DIRECT",
        "RULE-SET,China_ip,DIRECT",
        "RULE-SET,Lan_ip,DIRECT",
        "GEOIP,CN,DIRECT",
        "GEOSITE,cn,DIRECT",
        "MATCH,漏网之鱼"
    ];
}

// ===================== 实用工具函数 =====================
function getProxiesByRegex(params, regex, fallback = ["DIRECT"]) {
    const matched = params.proxies
        .filter(e => regex.test(e.name))
        .map(e => e.name);
    return matched.length ? matched : fallback;
}

function createProxyGroup(name, type, options = {}) {
    const base = { 
        name, 
        type, 
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

function createServiceGroup(name, icon, availableRegions, regions, 
                           includeDirect = true, directFirst = false,
                           hasResidential = false, hasLowRate = false,
                           includeCustom = false) {
    const proxies = [PROXY_NAME];
    regions.filter(r => availableRegions.has(r.name)).forEach(r => {
        proxies.push(`${r.name} - 自动选择`, `${r.name} - 手动选择`);
    });
    if (hasResidential) proxies.push(RESIDENTIAL_GROUP);
    if (hasLowRate) proxies.push(LOW_RATE_GROUP);
    if (includeCustom) proxies.push(CUSTOM_PROXY_GROUP, CUSTOM_DIRECT_GROUP);
    if (includeDirect) directFirst ? proxies.unshift("DIRECT") : proxies.push("DIRECT");
    return createProxyGroup(name, "select", {
        proxies,
        icon: `${globalThis.ICON_BASE || "https://example.com/icons"}/${icon}`
    });
}

// ===================== DNS配置模块 =====================
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
            "*", "*.lan", "*.local",
            "time.*.com", "ntp.*.com",
            "*.market.xiaomi.com",
            "localhost.ptlogin2.qq.com",
            "localhost.sec.qq.com",
            "*.qq.com", "*.tencent.com",
            "*.msftconnecttest.com",
            "*.msftncsi.com"
        ],
        "default-nameserver": ["tls://223.5.5.5"],
        nameserver: [
            "https://dns.alidns.com/dns-query",
            "https://doh.pub/dns-query"
        ],
        "proxy-server-nameserver": [
            "https://doh.pub/dns-query",
            "https://dns.alidns.com/dns-query"
        ]
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
        "route-exclude-address": [],
        mtu: 1500
    };
}
