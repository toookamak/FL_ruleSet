// FL_Clash_Rule_DIY.js - Clash/Mihomo高级规则配置脚本
// 修复：策略组循环依赖问题
// 新增：1. 家宽/原生线路策略组 2. 低倍率策略组 3. 自定义代理规则策略组 4. 自定义直连规则策略组
// 特点：支持多地区自动选择、智能分流、广告拦截和流量优化
// 版本：v1.8.0
// 最后更新：2023-12-15

// ===================== 全局配置常量 =====================
const PROXY_NAME = "代理模式"; // 主代理组名称
const ICON_BASE_URL = "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons"; // 图标库URL
const TEST_URL = "http://www.gstatic.com/generate_204"; // 延迟测试URL
const RULE_REPO_BASE = "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo"; // 规则仓库地址
const RULE_PATH_PREFIX = "./ruleset/RealSeek/Clash_Rule_DIY"; // 本地规则缓存路径

// 新增策略组类型常量
const RESIDENTIAL_GROUP = "家宽/原生"; // 家宽/原生线路组
const LOW_RATE_GROUP = "低倍率";     // 低倍率节点组
const CUSTOM_PROXY_GROUP = "自定义代理规则"; // 自定义代理规则组
const CUSTOM_DIRECT_GROUP = "自定义直连规则"; // 自定义直连规则组

// 自定义规则URL
const CUSTOM_PROXY_RULES_URL = "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnPROXYRules.list";
const CUSTOM_DIRECT_RULES_URL = "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnDIRECTRules.list";

/**
 * 主入口函数 - 处理Clash配置文件
 * @param {Object} params - 原始Clash配置对象
 * @returns {Object} 处理后的配置对象
 */
const main = (params) => {
    if (!params.proxies) return params; // 无代理节点时直接返回
    
    // 按顺序执行各模块配置
    overwriteBasicOptions(params);   // 基础设置
    overwriteSniffer(params);       // 流量嗅探设置
    overwriteProxyGroups(params);   // 代理组配置
    overwriteRules(params);         // 分流规则配置
    overwriteDns(params);           // DNS设置
    overwriteTunnel(params);        // TUN虚拟网卡设置
    
    return params;
};

// ===================== 基础设置模块 =====================
/**
 * 覆写基础选项配置
 */
function overwriteBasicOptions(params) {
    Object.assign(params, {
        "mixed-port": 7890,               // 混合代理端口
        "allow-lan": true,                // 允许局域网访问
        "unified-delay": true,            // 统一延迟显示
        "tcp-concurrent": true,           // 启用TCP并发
        "geodata-mode": true,             // 使用GeoIP数据库
        "fakeind-process-mode": "strict", // 严格处理模式
        "global-client-fingerprint": "chrome", // 伪装浏览器指纹
        profile: { 
            "store-selected": true,       // 保存节点选择
            "store-fake-ip": true         // 保存Fake-IP
        },
        ipv6: true,                       // 启用IPv6支持
        mode: "rule",                     // 规则模式
        "skip-auth-prefixes": ["127.0.0.1/32"], // 跳过认证的IP
        "lan-allowed-ips": ["0.0.0.0/0", "::/0"] // 允许的局域网IP
    });
}

// ===================== 流量嗅探设置 =====================
/**
 * 配置流量嗅探选项
 */
function overwriteSniffer(params) {
    params.sniffer = {
        enable: true,                    // 启用嗅探
        "force-dns-mapping": true,       // 强制DNS映射
        "parse-pure-ip": true,           // 解析纯IP
        "override-destination": false,    // 不覆盖目标地址
        sniff: {
            HTTP: { 
                ports: ["80", "443"],    // HTTP嗅探端口
                "override-destination": false
            },
            TLS: { 
                ports: ["443"]           // TLS嗅探端口
            }
        },
        // 跳过嗅探的域名（苹果推送服务）
        "skip-domain": ["+.push.apple.com"],
        // 跳过嗅探的目标地址（Telegram服务器）
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
 * 核心功能：创建代理组架构
 * 修复：策略组循环依赖问题
 */
function overwriteProxyGroups(params) {
    // 地区配置（支持：香港、台湾、新加坡、日本、美国）
    const COUNTRY_REGIONS = [
        { 
            code: "HK", name: "🇭🇰 香港", 
            icon: `${ICON_BASE_URL}/flags/hk.svg`,
            regex: /(香港|HK|Hong Kong|🇭🇰)/i
        },
        {
            code: "TW", name: "🇹🇼 台湾",
            icon: `${ICON_BASE_URL}/flags/tw.svg`,
            regex: /(台湾|TW|Taiwan|🇹🇼)/i
        },
        {
            code: "SG", name: "🇸🇬 新加坡",
            icon: `${ICON_BASE_URL}/flags/sg.svg`,
            regex: /(新加坡|狮城|SG|Singapore|🇸🇬)/i
        },
        {
            code: "JP", name: "🇯🇵 日本",
            icon: `${ICON_BASE_URL}/flags/jp.svg`,
            regex: /(日本|JP|Japan|🇯🇵)/i
        },
        {
            code: "US", name: "🇺🇸 美国",
            icon: `${ICON_BASE_URL}/flags/us.svg`,
            regex: /(美国|US|USA|United States|America|🇺🇸)/i
        },
        {
            name: "其它",  // 其他未分类节点
            regex: /(?!.*(?: 剩余 | 到期 | 主页 | 官网 | 游戏 | 关注))(.*)/
        }
    ];

    // 获取有效代理（过滤过期/流量节点）
    const PROXY_REGEX = /^(?!.*(?:自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire)).*$/;
    const allProxies = getProxiesByRegex(params, PROXY_REGEX);
    const availableRegions = new Set(); // 可用的地区集合
    
    // 新增节点过滤正则
    const RESIDENTIAL_REGEX = /(家宽|原生|residential|home)/i; // 家宽/原生节点
    const LOW_RATE_REGEX = /(低倍率|lowrate|low-rate|倍率)/i;   // 低倍率节点
    
    // 节点分类处理
    params.proxies.forEach(proxy => {
        const region = COUNTRY_REGIONS.find(r => r.regex.test(proxy.name));
        region ? availableRegions.add(region.name) : null;
    });

    // 创建地区自动选择组（fallback策略）
    const autoGroups = COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))
        .map(region => ({
            name: `${region.name} - 自动选择`,
            type: "fallback",
            url: TEST_URL,
            interval: 300,       // 测试间隔(秒)
            tolerance: 50,        // 延迟容忍(ms)
            proxies: getProxiesByRegex(params, region.regex),
            hidden: true           // 不在UI显示
        }))
        .filter(g => g.proxies.length > 0); // 过滤空组

    // 创建地区手动选择组
    const manualGroups = COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))
        .map(region => ({
            name: `${region.name} - 手动选择`,
            type: "select",       // 手动选择策略
            proxies: getProxiesByRegex(params, region.regex, ["手动选择"]),
            icon: region.icon,    // 地区图标
            hidden: false         // 在UI显示
        }))
        .filter(g => g.proxies.length > 0);

    // 获取家宽/原生节点
    const residentialProxies = getProxiesByRegex(params, RESIDENTIAL_REGEX);
    const hasResidential = residentialProxies.length > 0;
    
    // 获取低倍率节点
    const lowRateProxies = getProxiesByRegex(params, LOW_RATE_REGEX);
    const hasLowRate = lowRateProxies.length > 0;
    
    // 创建家宽/原生线路组
    const residentialGroup = hasResidential ? {
        name: RESIDENTIAL_GROUP,
        type: "select",
        icon: `${ICON_BASE_URL}/home.svg`, // 家宽图标
        proxies: residentialProxies,
        hidden: false
    } : null;
    
    // 创建低倍率节点组
    const lowRateGroup = hasLowRate ? {
        name: LOW_RATE_GROUP,
        type: "select",
        icon: `${ICON_BASE_URL}/battery.svg`, // 电池图标表示节省流量
        proxies: lowRateProxies,
        hidden: false
    } : null;
    
    // ===== 核心代理组配置 =====
    const coreGroups = [
        // 主策略组（修复循环依赖）
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
            icon: `${ICON_BASE_URL}/adjust.svg` // 调节图标
        }),
        
        // 延迟优选组（自动选择最低延迟节点）
        createProxyGroup("延迟优选", "url-test", {
            "exclude-filter": "自动选择|手动选择", // 排除特定组
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: `${ICON_BASE_URL}/speed.svg`,   // 速度图标
            hidden: true
        }),
        
        // 故障转移组（自动切换故障节点）
        createProxyGroup("故障转移", "fallback", {
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: `${ICON_BASE_URL}/ambulance.svg`, // 救护车图标
            hidden: true
        }),
        
        // 手动选择入口组
        createProxyGroup("手动选择", "select", {
            proxies: COUNTRY_REGIONS
                .filter(r => availableRegions.has(r.name))
                .flatMap(r => [`${r.name} - 自动选择`, `${r.name} - 手动选择`]),
            icon: `${ICON_BASE_URL}/link.svg` // 链接图标
        }),
        
        // 散列负载均衡（会话保持）
        createProxyGroup("负载均衡 (散列)", "load-balance", {
            strategy: "consistent-hashing", // 一致性哈希
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: `${ICON_BASE_URL}/balance.svg`, // 平衡图标
            hidden: true
        }),
        
        // 轮询负载均衡（均匀分配）
        createProxyGroup("负载均衡 (轮询)", "load-balance", {
            strategy: "round-robin", // 轮询策略
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies.length ? allProxies : ["DIRECT"],
            icon: `${ICON_BASE_URL}/merry_go.svg`, // 旋转图标
            hidden: true
        })
    ];

    // ===== 服务专用代理组 =====
    const serviceGroups = [
        // 每个服务组都包含完整策略选项
        createServiceGroup("电报消息", "telegram.svg", availableRegions, COUNTRY_REGIONS, true, true, hasResidential, hasLowRate, true),
        createServiceGroup("AI", "chatgpt.svg", availableRegions, COUNTRY_REGIONS, true, true, hasResidential, hasLowRate, true),
        createServiceGroup("流媒体", "youtube.svg", availableRegions, COUNTRY_REGIONS, true, true, hasResidential, hasLowRate, true),
        // 苹果服务不包含DIRECT选项
        createServiceGroup("苹果服务", "apple.svg", availableRegions, COUNTRY_REGIONS, false, false, hasResidential, hasLowRate, true),
        createServiceGroup("微软服务", "microsoft.svg", availableRegions, COUNTRY_REGIONS, true, false, hasResidential, hasLowRate, true),
        // GoogleFCM将DIRECT放在首位
        createServiceGroup("GoogleFCM", "google.svg", availableRegions, COUNTRY_REGIONS, true, true, hasResidential, hasLowRate, true),
        createServiceGroup("Steam地区", "steam.svg", availableRegions, COUNTRY_REGIONS, true, true, hasResidential, hasLowRate, true),
        // 漏网之鱼组（最终匹配规则）
        createProxyGroup("漏网之鱼", "select", {
            proxies: ["DIRECT", PROXY_NAME],
            icon: `${ICON_BASE_URL}/fish.svg` // 鱼图标
        })
    ];

    // ===== 自定义规则策略组（修复循环依赖）=====
    const customRuleGroups = [
        // 自定义代理规则策略组
        {
            name: CUSTOM_PROXY_GROUP,
            type: "select",
            icon: `${ICON_BASE_URL}/proxy-custom.svg`,
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
        // 自定义直连规则策略组
        {
            name: CUSTOM_DIRECT_GROUP,
            type: "select",
            icon: `${ICON_BASE_URL}/direct-custom.svg`,
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

    // 合并所有代理组（修复循环依赖）
    params["proxy-groups"] = [
        ...coreGroups,
        ...autoGroups,
        ...manualGroups,
        ...serviceGroups,
        ...customRuleGroups,
        ...(residentialGroup ? [residentialGroup] : []),
        ...(lowRateGroup ? [lowRateGroup] : [])
    ];
    
    // 存储策略组状态供规则模块使用
    params.__hasResidential = hasResidential;
    params.__hasLowRate = hasLowRate;
}

/**
 * 创建标准代理组（工厂函数）
 */
function createProxyGroup(name, type, options = {}) {
    const base = { 
        name, 
        type, 
        url: type !== "select" ? TEST_URL : undefined, 
        interval: type !== "select" ? 300 : undefined
    };
    // 设置负载均衡的通用参数
    if (type === "load-balance") {
        Object.assign(options, {
            "max-failed-times": 3, // 最大失败次数
            lazy: true             // 延迟检查
        });
    }
    return Object.assign(base, options);
}

/**
 * 创建服务专用代理组（增强版）
 */
function createServiceGroup(name, icon, availableRegions, regions, 
                           includeDirect = true, directFirst = false,
                           hasResidential = false, hasLowRate = false,
                           includeCustom = false) {
    const proxies = [PROXY_NAME];
    
    // 添加地区选择组
    regions.filter(r => availableRegions.has(r.name)).forEach(r => {
        proxies.push(`${r.name} - 自动选择`, `${r.name} - 手动选择`);
    });
    
    // 添加家宽/原生线路
    if (hasResidential) {
        proxies.push(RESIDENTIAL_GROUP);
    }
    
    // 添加低倍率节点
    if (hasLowRate) {
        proxies.push(LOW_RATE_GROUP);
    }
    
    // 添加自定义规则选项
    if (includeCustom) {
        proxies.push(CUSTOM_PROXY_GROUP, CUSTOM_DIRECT_GROUP);
    }
    
    // 添加直连选项
    if (includeDirect) {
        directFirst ? proxies.unshift("DIRECT") : proxies.push("DIRECT");
    }
    
    return createProxyGroup(name, "select", {
        proxies,
        icon: `${ICON_BASE_URL}/${icon}`
    });
}

// ===================== 规则配置模块 =====================
/**
 * 核心功能：配置分流规则
 */
function overwriteRules(params) {
    const customRules = [
        // 在此添加自定义规则（示例）：
        // "DOMAIN,baidu.com,DIRECT",
        // "DOMAIN-SUFFIX,google.com,代理模式"
    ];
    
    // 获取策略组状态
    const hasResidential = params.__hasResidential || false;
    const hasLowRate = params.__hasLowRate || false;
    const cdnProxy = hasLowRate ? LOW_RATE_GROUP : PROXY_NAME;
    const downloadProxy = hasLowRate ? LOW_RATE_GROUP : PROXY_NAME;
    const residentialProxy = hasResidential ? RESIDENTIAL_GROUP : PROXY_NAME;
    
    // 构建规则数组（顺序敏感！）
    const rules = [
        // === 广告拦截规则 ===
        "RULE-SET,Reject_no_ip,REJECT",         // 域名广告规则
        "RULE-SET,Reject_domainset,REJECT",     // 域名集广告规则
        "RULE-SET,Reject_no_ip_drop,REJECT-DROP", // 丢弃式广告拦截
        "RULE-SET,Reject_no_ip_no_drop,REJECT",  // 非丢弃式广告拦截
        
        // === 用户自定义规则 ===
        ...customRules,      // 用户自定义规则
        
        // === 自定义规则集 ===
        "RULE-SET,CustomProxyRules," + CUSTOM_PROXY_GROUP,  // 指向自定义代理策略组
        "RULE-SET,CustomDirectRules," + CUSTOM_DIRECT_GROUP, // 指向自定义直连策略组
        
        // === 非IP类规则 ===
        "RULE-SET,CustomProxy_no_ip," + PROXY_NAME, // 自定义代理
        "RULE-SET,GoogleFCM_no_ip,GoogleFCM",     // Google消息服务
        "RULE-SET,NetEaseMusic_no_ip,DIRECT",     // 网易云音乐
        "RULE-SET,SteamRegion_no_ip,Steam地区",    // Steam地区
        "RULE-SET,SteamCN_no_ip,DIRECT",           // 国区Steam
        "RULE-SET,Steam_no_ip," + PROXY_NAME,      // 国际Steam
        
        // === 流量优化规则 ===
        // CDN资源优先使用低倍率节点
        "RULE-SET,CDN_domainset," + cdnProxy,
        "RULE-SET,CDN_no_ip," + cdnProxy,
        
        // 下载服务优先使用低倍率节点
        "RULE-SET,Download_domainset," + downloadProxy,
        "RULE-SET,Download_no_ip," + downloadProxy,
        
        // 软件更新优先使用低倍率节点
        "RULE-SET,Update_no_ip," + downloadProxy,
        
        // === 质量敏感服务 ===
        // 流媒体服务优先使用家宽/原生节点
        "RULE-SET,Stream_no_ip,流媒体",
        
        // AI服务优先使用家宽/原生节点
        "RULE-SET,AI_no_ip," + residentialProxy,
        
        // === 其他规则 ===
        "RULE-SET,Telegram_no_ip,电报消息",        // Telegram
        "RULE-SET,AppleCDN_no_ip,DIRECT",          // 苹果国内CDN
        "RULE-SET,AppleCN_no_ip,DIRECT",           // 苹果中国服务
        "RULE-SET,MicrosoftCDN_no_ip,DIRECT",      // 微软国内CDN
        "RULE-SET,Apple_no_ip,苹果服务",           // 苹果国际服务
        "RULE-SET,Microsoft_no_ip,微软服务",       // 微软国际服务
        "RULE-SET,Global_no_ip," + PROXY_NAME,     // 国际通用服务
        "RULE-SET,Domestic_no_ip,DIRECT",          // 国内域名
        "RULE-SET,Direct_no_ip,DIRECT",            // 直连域名
        "RULE-SET,Lan_no_ip,DIRECT",               // 局域网域名
        
        // === IP类规则 ===
        "RULE-SET,GoogleFCM_ip,GoogleFCM",      // Google消息IP
        "RULE-SET,NetEaseMusic_ip,DIRECT",      // 网易云音乐IP
        "RULE-SET,SteamCN_ip,DIRECT",           // 国区Steam IP
        "RULE-SET,Reject_ip,REJECT",            // 广告IP
        "RULE-SET,Telegram_ip,电报消息",        // Telegram IP
        
        // 流媒体IP优先使用家宽/原生节点
        "RULE-SET,Stream_ip," + residentialProxy,
        
        "RULE-SET,Domestic_ip,DIRECT",          // 国内IP
        "RULE-SET,China_ip,DIRECT",             // 中国IP段
        "RULE-SET,Lan_ip,DIRECT",               // 局域网IP
        "GEOIP,CN,DIRECT",                      // 中国GeoIP
        "GEOSITE,cn,DIRECT",                    // 中国域名
        
        // === 最终匹配规则 ===
        "MATCH,漏网之鱼"
    ];
    
    params.rules = rules;
    params["rule-providers"] = createRuleProviders();
}

// ===================== 规则提供器配置 =====================
/**
 * 配置远程规则集
 */
function createRuleProviders() {
    return {
        // === 广告拦截规则集 ===
        Reject_ip: createRuleProvider("classical", "REJECT/ip/Reject_ip.yaml"),
        Reject_no_ip: createRuleProvider("classical", "REJECT/no_ip/Reject_no_ip.yaml"),
        Reject_domainset: createRuleProvider("domain", "REJECT/no_ip/Reject_domainset.yaml"),
        Reject_no_ip_drop: createRuleProvider("classical", "REJECT/no_ip/Reject_no_ip_drop.yaml"),
        Reject_no_ip_no_drop: createRuleProvider("classical", "REJECT/no_ip/Reject_no_ip_no_drop.yaml"),
        
        // === 直连规则集 ===
        China_ip: createRuleProvider("ip", "DIRECT/ip/China_ip.yaml"),
        Domestic_ip: createRuleProvider("classical", "DIRECT/ip/Domestic_ip.yaml"),
        GoogleFCM_ip: createRuleProvider("classical", "DIRECT/ip/GoogleFCM_ip.yaml"),
        Lan_ip: createRuleProvider("classical", "DIRECT/ip/Lan_ip.yaml"),
        NetEaseMusic_ip: createRuleProvider("classical", "DIRECT/ip/NetEaseMusic_ip.yaml"),
        SteamCN_ip: createRuleProvider("classical", "DIRECT/ip/SteamCN_ip.yaml"),
        AppleCDN_no_ip: createRuleProvider("domain", "DIRECT/no_ip/AppleCDN_no_ip.yaml"),
        AppleCN_no_ip: createRuleProvider("domain", "DIRECT/no_ip/AppleCN_no_ip.yaml"),
        Direct_no_ip: createRuleProvider("classical", "DIRECT/no_ip/Direct_no_ip.yaml"),
        Domestic_no_ip: createRuleProvider("classical", "DIRECT/no_ip/Domestic_no_ip.yaml"),
        GoogleFCM_no_ip: createRuleProvider("classical", "DIRECT/no_ip/GoogleFCM_no_ip.yaml"),
        Lan_no_ip: createRuleProvider("classical", "DIRECT/no_ip/Lan_no_ip.yaml"),
        MicrosoftCDN_no_ip: createRuleProvider("classical", "DIRECT/no_ip/MicrosoftCDN_no_ip.yaml"),
        NetEaseMusic_no_ip: createRuleProvider("classical", "DIRECT/no_ip/NetEaseMusic_no_ip.yaml"),
        SteamCN_no_ip: createRuleProvider("classical", "DIRECT/no_ip/SteamCN_no_ip.yaml"),
        SteamRegion_no_ip: createRuleProvider("classical", "DIRECT/no_ip/SteamRegion_no_ip.yaml"),
        
        // === 代理规则集 ===
        Stream_ip: createRuleProvider("classical", "PROXY/ip/Stream_ip.yaml"),
        Telegram_ip: createRuleProvider("classical", "PROXY/ip/Telegram_ip.yaml"),
        AI_no_ip: createRuleProvider("classical", "PROXY/no_ip/AI_no_ip.yaml"),
        Apple_no_ip: createRuleProvider("classical", "PROXY/no_ip/Apple_no_ip.yaml"),
        CDN_domainset: createRuleProvider("domain", "PROXY/no_ip/CDN_domainset.yaml"),
        CDN_no_ip: createRuleProvider("classical", "PROXY/no_ip/CDN_no_ip.yaml"),
        CustomProxy_no_ip: createRuleProvider("classical", "PROXY/no_ip/CustomProxy_no_ip.yaml"),
        Download_domainset: createRuleProvider("domain", "PROXY/no_ip/Download_domainset.yaml"),
        Download_no_ip: createRuleProvider("classical", "PROXY/no_ip/Download_no_ip.yaml"),
        Global_no_ip: createRuleProvider("classical", "PROXY/no_ip/Global_no_ip.yaml"),
        Microsoft_no_ip: createRuleProvider("classical", "PROXY/no_ip/Microsoft_no_ip.yaml"),
        Steam_no_ip: createRuleProvider("classical", "PROXY/no_ip/Steam_no_ip.yaml"),
        Stream_no_ip: createRuleProvider("classical", "PROXY/no_ip/Stream_no_ip.yaml"),
        Telegram_no_ip: createRuleProvider("classical", "PROXY/no_ip/Telegram_no_ip.yaml"),
        Update_no_ip: createRuleProvider("classical", "PROXY/no_ip/Update_no_ip.yaml"),
        
        // === 新增自定义规则集 ===
        CustomProxyRules: createCustomRuleProvider(CUSTOM_PROXY_RULES_URL, "./ruleset/OwnRules/OwnPROXYRules.yaml"),
        CustomDirectRules: createCustomRuleProvider(CUSTOM_DIRECT_RULES_URL, "./ruleset/OwnRules/OwnDIRECTRules.yaml")
    };
}

/**
 * 创建规则提供器（工厂函数）
 */
function createRuleProvider(type, relativePath) {
    const RULE_TYPES = {
        ip: { behavior: "ipcidr" },
        domain: { behavior: "domain" },
        classical: { behavior: "classical" }
    };
    
    return {
        type: "http",
        interval: 1800, // 更新间隔(秒)
        format: "yaml",
        ...RULE_TYPES[type],
        url: `${RULE_REPO_BASE}/${relativePath}`,
        path: `${RULE_PATH_PREFIX}/${relativePath}`
    };
}

/**
 * 创建自定义规则提供器
 */
function createCustomRuleProvider(url, path) {
    return {
        type: "http",
        behavior: "classical",
        format: "text",         // LIST格式规则文件
        interval: 86400,        // 24小时更新一次
        url: url,
        path: path
    };
}

// ===================== 实用工具函数 =====================
/**
 * 通过正则表达式获取代理节点名称
 */
function getProxiesByRegex(params, regex, fallback = ["DIRECT"]) {
    const matched = params.proxies
        .filter(e => regex.test(e.name))
        .map(e => e.name);
    return matched.length ? matched : fallback;
}

// ===================== DNS配置模块 =====================
/**
 * 配置DNS解析设置
 */
function overwriteDns(params) {
    params.dns = {
        enable: true,                     // 启用DNS服务
        listen: "0.0.0.0:1053",          // 监听地址和端口
        "enhanced-mode": "fake-ip",      // 增强模式：Fake-IP
        "fake-ip-range": "198.18.0.1/16", // Fake-IP范围
        "use-hosts": false,               // 不使用本地hosts
        "use-system-hosts": false,        // 不使用系统hosts
        ipv6: false,                      // 禁用IPv6解析
        // Fake-IP过滤列表（这些域名使用真实IP）
        "fake-ip-filter": [
            "*", "*.lan", "*.local",      // 本地域名
            "time.*.com", "ntp.*.com",    // 时间服务
            "*.market.xiaomi.com",        // 小米服务
            "localhost.ptlogin2.qq.com",  // QQ登录
            "localhost.sec.qq.com",       // QQ安全
            "*.qq.com", "*.tencent.com",  // 腾讯域名
            "*.msftconnecttest.com",      // 微软连接测试
            "*.msftncsi.com"              // 微软NCSI
        ],
        // 默认DNS服务器（TCP+TLS）
        "default-nameserver": ["tls://223.5.5.5"],
        // 常规DNS服务器（DOH）
        nameserver: [
            "https://dns.alidns.com/dns-query", // 阿里DNS
            "https://doh.pub/dns-query"         // 腾讯DNS
        ],
        // 代理DNS服务器（用于远程解析）
        "proxy-server-nameserver": [
            "https://doh.pub/dns-query",
            "https://dns.alidns.com/dns-query"
        ]
    };
}

// ===================== TUN配置模块 =====================
/**
 * 配置TUN虚拟网卡
 */
function overwriteTunnel(params) {
    params.tun = {
        enable: true,            // 启用TUN模式
        stack: "mixed",          // 混合协议栈
        device: "Mihomo",        // 设备名称
        "dns-hijack": ["any:53"], // DNS劫持端口
        "auto-route": true,      // 自动路由
        "auto-redirect": false,  // 禁用自动重定向
        "auto-detect-interface": true, // 自动检测接口
        "strict-route": false,    // 非严格路由
        "route-exclude-address": [], // 排除路由地址
        mtu: 1500                // MTU大小
    };
}
