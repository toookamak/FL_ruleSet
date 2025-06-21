// FL_Clash_Rule_DIY.js - 策略组优化版
// 优化：直接使用完整规则URL，便于维护
// 特点：所有规则集使用完整URL，图标使用完整URL
// 版本：v7.2.0
// 最后更新：2024-01-20

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
const GLOBAL_ROUTING = "全局路由策略";
const MANUAL_REGION_SELECT = "手动选择 (地区)";
const AUTO_REGION_SELECT = "自动选择 (地区)";
const RESIDENTIAL_LINE = "家宽/原生线路";
const LOW_RATE_NODE = "低倍率节点";
const INSTANT_MESSAGING = "即时通讯";
const AI_SERVICE = "AI服务";
const PLATFORM_SERVICE = "平台服务";
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
function overwriteProxyGroups(params) {
    // 地区配置（移除台湾）
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

    // 创建地区自动选择组
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
                hidden: true
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

    // 获取其他地区节点
    const otherProxies = params.proxies
        .filter(proxy => 
            !COUNTRY_REGIONS.some(region => region.regex.test(proxy.name)) &&
            !RESIDENTIAL_REGEX.test(proxy.name) &&
            !LOW_RATE_REGEX.test(proxy.name)
        )
        .map(proxy => proxy.name);
    
    const hasOtherProxies = otherProxies.length > 0;
    
    // 其他地区组
    const otherAutoGroup = hasOtherProxies ? createProxyGroup(
        "其他地区 · 自动选择", 
        "url-test", 
        {
            category: GROUP_CATEGORY.REGION,
            url: TEST_URL,
            interval: 300,
            tolerance: 50,
            proxies: otherProxies,
            hidden: true
        }
    ) : null;
    
    const otherManualGroup = hasOtherProxies ? createProxyGroup(
        "其他地区 · 手动选择", 
        "select", 
        {
            category: GROUP_CATEGORY.REGION,
            proxies: otherProxies,
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/global.svg",
            hidden: false
        }
    ) : null;

    // 获取家宽/原生节点
    const residentialProxies = getProxiesByRegex(params, RESIDENTIAL_REGEX);
    const hasResidential = residentialProxies.length > 0;
    
    // 获取低倍率节点
    const lowRateProxies = getProxiesByRegex(params, LOW_RATE_REGEX);
    const hasLowRate = lowRateProxies.length > 0;
    
    // ===== 核心路由策略组 =====
    const coreGroups = [
        // 全局路由策略
        createProxyGroup(GLOBAL_ROUTING, "select", {
            category: GROUP_CATEGORY.CORE,
            proxies: [
                "延迟优选", 
                "故障转移", 
                MANUAL_REGION_SELECT,
                AUTO_REGION_SELECT,
                ...(hasResidential ? [RESIDENTIAL_LINE] : []),
                ...(hasLowRate ? [LOW_RATE_NODE] : []),
                "负载均衡 · 散列", 
                "负载均衡 · 轮询", 
                "DIRECT"
            ],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/adjust.svg"
        }),
        
        // 延迟优选
        createProxyGroup("延迟优选", "url-test", {
            category: GROUP_CATEGORY.CORE,
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/speed.svg",
            hidden: true
        }),
        
        // 故障转移
        createProxyGroup("故障转移", "fallback", {
            category: GROUP_CATEGORY.CORE,
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/ambulance.svg",
            hidden: true
        }),
        
        // 负载均衡
        createProxyGroup("负载均衡 · 散列", "load-balance", {
            category: GROUP_CATEGORY.CORE,
            strategy: "consistent-hashing",
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/balance.svg",
            hidden: true
        }),
        
        createProxyGroup("负载均衡 · 轮询", "load-balance", {
            category: GROUP_CATEGORY.CORE,
            strategy: "round-robin",
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/merry_go.svg",
            hidden: true
        })
    ];

    // ===== 地区选择入口组 =====
    const regionEntryGroups = [
        // 手动选择入口
        createProxyGroup(MANUAL_REGION_SELECT, "select", {
            category: GROUP_CATEGORY.REGION_ENTRY,
            proxies: [
                ...manualGroups.map(g => g.name),
                ...(hasOtherProxies ? ["其他地区 · 手动选择"] : [])
            ],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/hand-map.svg"
        }),
        
        // 自动选择入口
        createProxyGroup(AUTO_REGION_SELECT, "select", {
            category: GROUP_CATEGORY.REGION_ENTRY,
            proxies: [
                ...autoGroups.map(g => g.name),
                ...(hasOtherProxies ? ["其他地区 · 自动选择"] : [])
            ],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/auto-map.svg"
        })
    ];

    // ===== 线路特性策略组 =====
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

    // ===== 服务专用策略组 =====
    const coreOptions = [
        GLOBAL_ROUTING,
        MANUAL_REGION_SELECT,
        AUTO_REGION_SELECT,
        ...(hasLowRate ? [LOW_RATE_NODE] : []),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []),
        "延迟优选",
        "DIRECT"
    ];

    const serviceGroups = [
        // 即时通讯
        createCustomGroup(INSTANT_MESSAGING, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/telegram.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        // AI服务
        createCustomGroup(AI_SERVICE, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/chatgpt.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        // 平台服务
        createCustomGroup(PLATFORM_SERVICE, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/cloud.svg", coreOptions, GROUP_CATEGORY.SERVICE),
        
        // 广告拦截
        createProxyGroup(AD_BLOCKING, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: ["REJECT","DIRECT"],
            icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/adblock.svg"
        })
    ];

    // ===== 流量管理策略组 =====
    const trafficGroups = [
        // 大流量通道
        createCustomGroup(HIGH_TRAFFIC_CHANNEL, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/download.svg", coreOptions, GROUP_CATEGORY.TRAFFIC),
        
        // 办公优化通道
        createCustomGroup(OFFICE_OPTIMIZED, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/office.svg", coreOptions, GROUP_CATEGORY.TRAFFIC)
    ];

    // ===== 自定义规则策略组 =====
    const customRuleGroups = [
        // 自定义代理规则
        createCustomGroup(CUSTOM_PROXY_RULE, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/proxy-custom.svg", coreOptions, GROUP_CATEGORY.CUSTOM),
        
        // 自定义直连规则
        createCustomGroup(CUSTOM_DIRECT_RULE, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/direct-custom.svg", coreOptions, GROUP_CATEGORY.CUSTOM)
    ];

    // ===== 默认路由策略组 =====
    const defaultRouteGroups = [
        // 国内流量
        createCustomGroup(DOMESTIC_TRAFFIC, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/cn.svg", coreOptions, GROUP_CATEGORY.DEFAULT_ROUTE),
        
        // 国际流量
        createCustomGroup(GLOBAL_TRAFFIC, "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/global.svg", coreOptions, GROUP_CATEGORY.DEFAULT_ROUTE)
    ];

    // ===== 合并所有代理组 =====
    params["proxy-groups"] = [
        ...coreGroups,
        ...regionEntryGroups,
        ...manualGroups,
        ...autoGroups,
        ...(otherManualGroup ? [otherManualGroup] : []),
        ...(otherAutoGroup ? [otherAutoGroup] : []),
        ...lineTypeGroups,
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
    // 格式: "规则类型,规则值,策略组"
    // 示例: 
    //   "DOMAIN-SUFFIX,example.com,平台服务"
    //   "IP-CIDR,192.168.1.0/24,DIRECT"
    const customRules = [
        // "DOMAIN-SUFFIX,custom-domain.com,平台服务"
    ]; 
    
    // 获取策略组状态
    const hasResidential = params.__hasResidential || false;
    const hasLowRate = params.__hasLowRate || false;
    
    // 构建规则数组
    const rules = [
        // === 广告拦截规则 ===
        `RULE-SET,Reject_no_ip,${AD_BLOCKING}`,
        `RULE-SET,Reject_domainset,${AD_BLOCKING}`,
        `RULE-SET,Reject_no_ip_drop,${AD_BLOCKING}`,
        `RULE-SET,Reject_no_ip_no_drop,${AD_BLOCKING}`,
        `RULE-SET,Reject_ip,${AD_BLOCKING}`,
        
        // $$$$ 用户自定义规则区域 $$$$
        ...customRules,
        
        // === 自定义规则集 ===
        `RULE-SET,CustomProxyRules,${CUSTOM_PROXY_RULE}`,
        `RULE-SET,CustomDirectRules,${CUSTOM_DIRECT_RULE}`,
        
        // === 非IP类规则 ===
        `RULE-SET,CustomProxy_no_ip,${GLOBAL_ROUTING}`,
        `RULE-SET,GoogleFCM_no_ip,${PLATFORM_SERVICE}`,
        "RULE-SET,NetEaseMusic_no_ip,DIRECT",
        `RULE-SET,SteamRegion_no_ip,${PLATFORM_SERVICE}`,
        "RULE-SET,SteamCN_no_ip,DIRECT",
        `RULE-SET,Steam_no_ip,${GLOBAL_ROUTING}`,
        
        // === 流量优化规则 ===
        `RULE-SET,CDN_domainset,${hasLowRate ? LOW_RATE_NODE : GLOBAL_ROUTING}`,
        `RULE-SET,CDN_no_ip,${hasLowRate ? LOW_RATE_NODE : GLOBAL_ROUTING}`,
        
        `RULE-SET,Download_domainset,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,Download_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        
        `RULE-SET,Update_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        
        `RULE-SET,Office_no_ip,${OFFICE_OPTIMIZED}`,
        
        // === 质量敏感服务 ===
        `RULE-SET,AI_no_ip,${AI_SERVICE}`,
        `RULE-SET,Telegram_no_ip,${INSTANT_MESSAGING}`,
        
        // === 平台服务 ===
        `RULE-SET,Microsoft_no_ip,${PLATFORM_SERVICE}`,
        
        // === 其他规则 ===
        "RULE-SET,AppleCDN_no_ip,DIRECT",
        "RULE-SET,AppleCN_no_ip,DIRECT",
        "RULE-SET,MicrosoftCDN_no_ip,DIRECT",
        `RULE-SET,Global_no_ip,${GLOBAL_ROUTING}`,
        "RULE-SET,Domestic_no_ip,DIRECT",
        "RULE-SET,Direct_no_ip,DIRECT",
        "RULE-SET,Lan_no_ip,DIRECT",
        
        // === IP类规则 ===
        `RULE-SET,GoogleFCM_ip,${PLATFORM_SERVICE}`,
        "RULE-SET,NetEaseMusic_ip,DIRECT",
        "RULE-SET,SteamCN_ip,DIRECT",
        `RULE-SET,Reject_ip,${AD_BLOCKING}`,
        `RULE-SET,Telegram_ip,${INSTANT_MESSAGING}`,
        `RULE-SET,Stream_ip,${hasResidential ? RESIDENTIAL_LINE : GLOBAL_ROUTING}`,
        `RULE-SET,SteamRegion_ip,${PLATFORM_SERVICE}`,
        
        // === 新增 Figma 规则 ===
        `RULE-SET,Figma_ip,${OFFICE_OPTIMIZED}`,  // 指向办公优化通道
        
        // === 国内IP规则 ===
        "RULE-SET,Domestic_ip,DIRECT",
        "RULE-SET,China_ip,DIRECT",
        "RULE-SET,Lan_ip,DIRECT",
        "GEOIP,CN,DIRECT",
        "GEOSITE,cn,DIRECT",
        
        // === 最终匹配规则 ===
        `GEOIP,CN,${DOMESTIC_TRAFFIC}`,
        `MATCH,${GLOBAL_TRAFFIC}`
    ];
    
    params.rules = rules;
    params["rule-providers"] = createRuleProviders();
}

// ===================== 规则提供器配置 =====================
function createRuleProviders() {
    return {
        // === 广告拦截规则集 ===
        Reject_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/ip/Reject_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/ip/Reject_ip.yaml"
        },
        Reject_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_no_ip.yaml"
        },
        Reject_domainset: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_domainset.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_domainset.yaml"
        },
        Reject_no_ip_drop: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_drop.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_no_ip_drop.yaml"
        },
        Reject_no_ip_no_drop: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_no_drop.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/REJECT/no_ip/Reject_no_ip_no_drop.yaml"
        },
        
        // === 直连规则集 ===
        China_ip: {
            type: "http",
            behavior: "ipcidr",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/China_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/China_ip.yaml"
        },
        Domestic_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Domestic_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/Domestic_ip.yaml"
        },
        GoogleFCM_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/GoogleFCM_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/GoogleFCM_ip.yaml"
        },
        Lan_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Lan_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/Lan_ip.yaml"
        },
        NetEaseMusic_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/NetEaseMusic_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/NetEaseMusic_ip.yaml"
        },
        SteamCN_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/SteamCN_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/ip/SteamCN_ip.yaml"
        },
        AppleCDN_no_ip: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/AppleCDN_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/AppleCDN_no_ip.yaml"
        },
        AppleCN_no_ip: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/AppleCN_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/AppleCN_no_ip.yaml"
        },
        Direct_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Direct_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/Direct_no_ip.yaml"
        },
        Domestic_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Domestic_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/Domestic_no_ip.yaml"
        },
        GoogleFCM_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/GoogleFCM_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/GoogleFCM_no_ip.yaml"
        },
        Lan_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Lan_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/Lan_no_ip.yaml"
        },
        MicrosoftCDN_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/MicrosoftCDN_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/MicrosoftCDN_no_ip.yaml"
        },
        NetEaseMusic_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/NetEaseMusic_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/NetEaseMusic_no_ip.yaml"
        },
        SteamCN_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/SteamCN_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/SteamCN_no_ip.yaml"
        },
        SteamRegion_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/SteamRegion_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/DIRECT/no_ip/SteamRegion_no_ip.yaml"
        },
        
        // === 代理规则集 ===
        Stream_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Stream_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/ip/Stream_ip.yaml"
        },
        Telegram_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Telegram_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/ip/Telegram_ip.yaml"
        },
        AI_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/AI_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/AI_no_ip.yaml"
        },
        Apple_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Apple_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Apple_no_ip.yaml"
        },
        CDN_domainset: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_domainset.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/CDN_domainset.yaml"
        },
        CDN_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/CDN_no_ip.yaml"
        },
        CustomProxy_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CustomProxy_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/CustomProxy_no_ip.yaml"
        },
        Download_domainset: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_domainset.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Download_domainset.yaml"
        },
        Download_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Download_no_ip.yaml"
        },
        Global_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Global_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Global_no_ip.yaml"
        },
        Microsoft_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Microsoft_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Microsoft_no_ip.yaml"
        },
        Steam_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Steam_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Steam_no_ip.yaml"
        },
        Telegram_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Telegram_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Telegram_no_ip.yaml"
        },
        Update_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Update_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Update_no_ip.yaml"
        },
        SteamRegion_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/SteamRegion_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/ip/SteamRegion_ip.yaml"
        },
        
        // === 新增规则集 ===
        Office_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Office_no_ip.yaml",
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/no_ip/Office_no_ip.yaml"
        },
        
        // === 新增 Figma 规则集 ===
        Figma_ip: {
            type: "http",
            behavior: "ipcidr",
            format: "text",  // 使用text格式因为源文件是.list格式
            interval: 86400,  // 每天更新一次
            url: "https://raw.githubusercontent.com/figmaIP.list", // 您的Figma规则URL
            path: "./ruleset/RealSeek/Clash_Rule_DIY/PROXY/ip/Figma_ip.list"
        },
        
        // === 自定义规则集 ===
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
            "*.lan", "*.local",
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
          'https://1.1.1.1/dns-query', 'https://223.5.5.5/dns-query'
        ],
        "nameserver-policy": { // 特定域名DNS策略
            'geosite:private': 'system',
            'geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn': ['119.29.29.29', '223.5.5.5']
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
        "route-exclude-address": [],
        mtu: 1500
    };
}
