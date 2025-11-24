// FL_ClashRuleDIY_0909.js
// FL_Clash_Rule_DIY.js - 策略组优化版
// 优化：直接使用完整规则URL，便于维护
// 特点：所有规则集使用完整URL，图标使用完整URL
// 版本：v8.1.1
// 最后更新：2025-11-24  |  精简了地区手动策略组
// ===================== 待       办 =====================
//
// 1.优化了规则集顺序，补充精简规则集
// 2.GEO的优化
// 3.DNS设置的优化
// ===================== 配置管理中心 =====================
/**
 * 统一配置管理器 - 集中管理所有可配置参数
 * 修改建议：
 * - UPDATE_INTERVALS：更新间隔，数值越大更新越慢但节省流量
 *   - 改小(如3600)：规则更新更频繁，但消耗更多网络资源
 *   - 改大(如172800)：规则更新较慢，但节省网络流量
 * - TEST_URL：延迟测试URL，可修改为其他稳定测试点
 * - CDN_SOURCES：图标CDN源，可添加自定义CDN地址
 */
const CONFIG_MANAGER = {
    // 基础配置常量
    TEST_URL: "http://www.gstatic.com/generate_204", // 延迟测试URL，用于策略组自动选择节点
    REGION_TEST_URLS: {
        HK: "http://www.gstatic.com/generate_204",   // 香港地区测试URL
        SG: "http://www.gstatic.com/generate_204",   // 新加坡地区测试URL
        JP: "http://www.gstatic.com/generate_204",   // 日本地区测试URL
        US: "http://www.gstatic.com/generate_204"    // 美国地区测试URL
    },
    
    // 更新间隔配置（统一设置为24小时）
    UPDATE_INTERVALS: {
        DEFAULT: 172800,   // 默认更新间隔：24小时(86400秒)
        CRITICAL: 86400,  // 关键规则更新间隔：24小时
        STATIC: 86400     // 静态规则更新间隔：24小时
    },
    
    // 策略组分类配置
    GROUP_CATEGORY: {
        CORE: "核心路由",        // 核心路由策略组
        REGION_ENTRY: "地区选择", // 地区选择入口策略组
        REGION: "具体地区",      // 具体地区策略组
        LINE_TYPE: "线路特性",   // 线路特性策略组
        SERVICE: "服务专用",     // 服务专用策略组
        TRAFFIC: "流量管理",     // 流量管理策略组
        CUSTOM: "自定义规则",    // 自定义规则策略组
        DEFAULT_ROUTE: "默认路由" // 默认路由策略组
    },
    
    // 自定义规则URL配置
    CUSTOM_RULES: {
        PROXY_URL: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnPROXYRules.list", // 自定义代理规则URL
        DIRECT_URL: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnDIRECTRules.list",  // 自定义直连规则URL
        REJECT_URL: "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnREJECTRules.list"   // 自定义拒绝规则URL
    },
    
    // CDN源配置（动态图标加载支持）
    CDN_SOURCES: {
        PRIMARY: "https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/",  // 主CDN源
        BACKUP: "https://ghproxy.com/https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/", // 备用CDN源
        LOCAL: "./icons/"  // 本地图标路径
    }
};

// ===================== 策略组命名常量 =====================
/**
 * 所有策略组名称定义，便于统一管理和维护
 * 修改建议：
 * - 可以根据个人喜好修改策略组中文名称
 * - 不建议修改英文常量名，会影响代码逻辑
 */
const GLOBAL_ROUTING = "代理模式";                    // 核心代理模式入口
const RESIDENTIAL_LINE = "家宽/原生线路";             // 家宽/原生IP线路
const LOW_RATE_NODE = "低倍率节点";                  // 低倍率优惠节点
const INSTANT_MESSAGING = "即时通讯";                // 即时通讯服务
const AI_SERVICE = "AI服务";                         // AI相关服务
const PLATFORM_SERVICE = "平台服务";                 // 平台类服务
const AD_BLOCKING = "广告拦截";                      // 广告拦截服务（包含跟踪器）
//const TRACKING_BLOCKING = "拦截跟踪";                // 跟踪器拦截服务
const HIGH_TRAFFIC_CHANNEL = "大流量通道";           // 大流量传输通道
const OFFICE_SERVICE = "网络办公";                   // 网络办公服务（包含OneDrive和GitHub）
const VIDEO_SERVICE = "视频服务";                    // 视频流媒体服务
const GOOGLE_SERVICE = "谷歌服务";                   // 谷歌相关服务
const MICROSOFT_SERVICE = "微软服务";                // 微软相关服务
const UNREAL_ENGINE = "虚幻引擎";                    // 虚幻引擎相关服务
const CUSTOM_PROXY_RULE = "自定义代理规则";          // 用户自定义代理规则
const CUSTOM_DIRECT_RULE = "自定义直连规则";         // 用户自定义直连规则
const DOMESTIC_TRAFFIC = "国内流量";                 // 国内网络流量
const GLOBAL_TRAFFIC = "国际流量";                   // 国际网络流量

// ===================== 缓存管理 =====================
/**
 * 全局缓存对象，用于提高性能，避免重复计算
 * 说明：
 * - proxyGroups: 策略组配置缓存
 * - availableRegions: 可用地区缓存
 * - residentialProxies: 家宽节点缓存
 * - lowRateProxies: 低倍率节点缓存
 * - ruleProviders: 规则提供器配置缓存
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
 * 策略组图标配置，支持多CDN源动态加载
 * 修改建议：
 * - 可以替换为其他图标库的URL
 * - 图标文件名需确保与图标库中文件名一致
 * - 建议保持相同的图标风格以保证视觉一致性
 */
const ICONS = {
    // 核心路由图标
    GLOBAL_ROUTING: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Proxy.png",          // 代理模式
    SPEED_TEST: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Speedtest.png",          // 延迟优选
    FAILOVER: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Final.png",                // 故障转移
    LOAD_BALANCE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Balance.png",          // 负载均衡
    HOME_NETWORK: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "VIP.png",              // 家宽线路
    LOW_RATE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Speedtest.png",            // 低倍率节点
    
    // 地区图标
    HK: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Hong_Kong.png",                  // 香港
    SG: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Singapore.png",                  // 新加坡
    JP: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Japan.png",                      // 日本
    US: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "United_States.png",              // 美国
    GLOBAL: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "World_Map.png",              // 全球/其他地区
    
    // 服务专用图标
    OFFICE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Notion.png",                 // 网络办公
    TELEGRAM: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Telegram.png",             // 即时通讯
    AI: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "ChatGPT.png",                    // AI服务
    CLOUD: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Server.png",                  // 平台服务
    VIDEO: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "YouTube.png",                 // 视频服务
    GOOGLE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Google_Search.png",          // 谷歌服务
    MICROSOFT: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Microsoft.png",           // 微软服务
    UNREAL: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Download.png",               // 虚幻引擎
    
    // 广告拦截图标
    AD_BLOCK: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Advertising.png",          // 广告拦截
    TRACKING: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Reject.png",               // 拦截跟踪
    
    // 流量管理图标
    DOWNLOAD: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Download.png",             // 大流量通道
    
    // 自定义规则图标  
    CUSTOM_PROXY: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Proxy.png",            // 自定义代理规则
    CUSTOM_DIRECT: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Direct.png",          // 自定义直连规则
    
    // 默认路由图标
    DOMESTIC: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "StreamingCN.png",          // 国内流量
    INTERNATIONAL: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Streaming!CN.png"     // 国际流量
};

/**
 * 主入口函数 - 处理Clash配置文件
 * @param {Object} params - Clash配置参数对象
 * @return {Object} 处理后的配置参数对象
 */
const main = (params) => {
    // 检查配置中是否包含代理信息，如果没有则直接返回原配置
    if (!params.proxies) return params;
    
    // 依次应用各项配置覆盖
    overwriteBasicOptions(params);      // 覆盖基础配置
    overwriteSniffer(params);           // 覆盖流量嗅探配置
    overwriteProxyGroups(params);       // 覆盖代理组配置
    overwriteRules(params);             // 覆盖规则配置
    overwriteDns(params);               // 覆盖DNS配置
    overwriteTunnel(params);            // 覆盖TUN配置
    
    // 清理缓存，释放内存
    clearCache();
    
    // 返回处理完成的配置对象
    return params;
};

// ===================== 缓存管理函数 =====================
/**
 * 清理缓存函数
 * 说明：每次执行完配置处理后清理缓存，防止内存泄漏
 * 修改建议：一般不需要修改
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
 * 说明：设置Clash核心运行参数
 * 修改建议：
 * - mixed-port: 可修改为其他端口号，避免端口冲突
 * - allow-lan: 设为false可禁止局域网设备使用代理
 * - tcp-concurrent: 设为false可降低资源消耗但可能影响性能
 * @param {Object} params - 配置参数对象
 */
function overwriteBasicOptions(params) {
    Object.assign(params, {
        "mixed-port": 7890,                     // 混合端口，支持HTTP和SOCKS代理
        "allow-lan": true,                      // 允许局域网访问
        "unified-delay": true,                  // 启用统一延迟计算
        "tcp-concurrent": true,                 // 启用TCP并发连接
        "geodata-mode": true,                   // 启用地理数据模式
        "geox-url": {                           // 地理数据文件下载URL
            "geoip": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat",
            "geosite": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat"
        },
        "fakeind-process-mode": "strict",       // 严格模式处理虚假指标
        "global-client-fingerprint": "chrome",  // 全局客户端指纹模拟为Chrome浏览器
        profile: {                              // 配置文件相关设置
            "store-selected": true,             // 存储用户选择的策略组
            "store-fake-ip": true               // 存储虚假IP映射
        },
        ipv6: true,                             // 启用IPv6支持
        mode: "rule",                           // 运行模式为规则模式
        "skip-auth-prefixes": ["127.0.0.1/32"], // 跳过认证的IP前缀
        "lan-allowed-ips": ["0.0.0.0/0", "::/0"] // 允许访问的局域网IP范围
    });
}

// ===================== 流量嗅探设置 =====================
/**
 * 覆盖流量嗅探配置
 * 说明：设置流量嗅探器参数，用于自动识别和处理加密流量
 * 修改建议：
 * - enable: 设为false可关闭流量嗅探功能
 * - ports: 可添加或删除需要嗅探的端口
 * - skip-domain: 可添加需要跳过嗅探的域名
 * @param {Object} params - 配置参数对象
 */
function overwriteSniffer(params) {
    params.sniffer = {
        enable: true,                           // 启用流量嗅探
        "force-dns-mapping": true,              // 强制DNS映射
        "parse-pure-ip": true,                  // 解析纯IP流量
        "override-destination": false,          // 不覆盖目标地址
        sniff: {                                // 嗅探协议配置
            HTTP: {                             // HTTP协议嗅探
                ports: ["80", "443"],           // 监听80和443端口
                "override-destination": false   // 不覆盖HTTP目标
            },
            TLS: {                              // TLS协议嗅探
                ports: ["443"]                  // 监听443端口
            }
        },
        "skip-domain": ["+.push.apple.com"],    // 跳过嗅探的域名
        "skip-dst-address": [                   // 跳过嗅探的目标IP地址段
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
 * 说明：核心策略组配置函数，构建完整的代理组结构
 * 修改建议：
 * - 一般不需要修改此函数逻辑
 * - 如需添加新的策略组，请修改相关子函数
 * @param {Object} params - 配置参数对象
 */
function overwriteProxyGroups(params) {
    // 检查缓存，如果已有结果则直接使用
    if (CACHE.proxyGroups) {
        params["proxy-groups"] = CACHE.proxyGroups;
        params.__hasResidential = CACHE.residentialProxies && CACHE.residentialProxies.length > 0;
        params.__hasLowRate = CACHE.lowRateProxies && CACHE.lowRateProxies.length > 0;
        return;
    }
    
    // 地区分组配置
    const COUNTRY_REGIONS = createRegionalConfig();
    
    // 获取有效代理和节点分类
    const { allProxies, availableRegions, residentialProxies, lowRateProxies, hasResidential, hasLowRate, hasOtherProxies } = 
        processProxyNodes(params, COUNTRY_REGIONS);
    
    // 存储到缓存
    CACHE.residentialProxies = residentialProxies;
    CACHE.lowRateProxies = lowRateProxies;
    
    // 创建各类策略组
    const coreGroups = createCoreGroups(allProxies, COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate);
    const { autoSelectGroups, manualSelectGroups, otherAutoGroup, otherManualGroup } = 
        createRegionalGroups(params, COUNTRY_REGIONS, availableRegions);
    const lineTypeGroups = createLineTypeGroups(hasResidential, residentialProxies, hasLowRate, lowRateProxies);
    const serviceGroups = createServiceGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies); // 增强服务策略组
    const trafficGroups = createTrafficGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies);
    const customRuleGroups = createCustomRuleGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies);
    const defaultRouteGroups = createDefaultRouteGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies);
    
    // 合并所有代理组 - 按照优化后的顺序排列（服务策略组靠前，地区策略组靠后）
    const allGroups = [
        ...coreGroups,
        ...serviceGroups,           // 服务策略组靠前
        ...lineTypeGroups,
        ...trafficGroups, 
        ...customRuleGroups,
        ...defaultRouteGroups,
        ...autoSelectGroups,        // 地区自动选择组
        ...manualSelectGroups,      // 地区手动选择组
        ...(otherManualGroup ? [otherManualGroup] : []),
        ...(otherAutoGroup ? [otherAutoGroup] : [])
    ];
    
    // 存储到缓存和参数（保持原有分类排序逻辑以确保规则执行顺序）
    CACHE.proxyGroups = allGroups;
    params["proxy-groups"] = allGroups;
    params.__hasResidential = hasResidential;
    params.__hasLowRate = hasLowRate;
}

/**
 * 创建地区配置
 * 说明：定义支持的地区及其匹配规则
 * 修改建议：
 * - 可以添加或删除支持的地区
 * - regex: 修改正则表达式以适配不同的节点命名规则
 * - ratioLimit: 修改倍率限制值以调整筛选严格程度
 */
function createRegionalConfig() {
    return [
        { 
            code: "HK",                         // 地区代码
            name: "香港",                        // 地区名称
            icon: ICONS.HK,                     // 地区图标
            regex: /(香港|HK|Hong Kong|🇭🇰)/i    // 匹配正则表达式
        },
        {
            code: "SG", 
            name: "新加坡",
            icon: ICONS.SG,
            regex: /(新加坡|狮城|SG|Singapore|🇸🇬)/i
        },
        {
            code: "JP", 
            name: "日本",
            icon: ICONS.JP,
            regex: /(日本|JP|Japan|🇯🇵)/i
        },
        {
            code: "US", 
            name: "美国", 
            icon: ICONS.US,
            regex: /(美国|US|USA|United States|America|🇺🇸)/i
        }
    ];
}

/**
 * 处理代理节点分类
 * 说明：对所有代理节点进行分类和筛选
 * 修改建议：
 * - PROXY_REGEX: 可修改正则表达式以排除不需要的节点
 * - RESIDENTIAL_REGEX: 可修改家宽节点匹配规则
 * - LOW_RATE_REGEX: 可修改低倍率节点匹配规则
 */
function processProxyNodes(params, COUNTRY_REGIONS) {
    const PROXY_REGEX = /^(?!.*(?:自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire)).*$/; // 有效代理筛选正则
    const allProxies = getProxiesByRegex(params, PROXY_REGEX);  // 获取所有有效代理
    const availableRegions = new Set();                         // 存储可用地区集合
    const RESIDENTIAL_REGEX = /(家宽|原生|residential|home)/i;   // 家宽节点匹配正则
    const LOW_RATE_REGEX = /(低倍率|lowrate|低-rate|倍率)/i;    // 低倍率节点匹配正则
    
    // 遍历所有代理节点，识别归属地区
    params.proxies.forEach(proxy => {
        const region = COUNTRY_REGIONS.find(r => r.regex.test(proxy.name));
        region ? availableRegions.add(region.name) : null;
    });
    
    // 获取家宽节点和低倍率节点
    const residentialProxies = getProxiesByRegex(params, RESIDENTIAL_REGEX);
    const lowRateProxies = getProxiesByRegex(params, LOW_RATE_REGEX);
    const hasResidential = residentialProxies.length > 0;  // 是否存在家宽节点
    const hasLowRate = lowRateProxies.length > 0;          // 是否存在低倍率节点
    
    // 检查是否有其他地区节点
    const RESIDENTIAL_REGEX_CHECK = /(家宽|原生|residential|home)/i;
    const LOW_RATE_REGEX_CHECK = /(低倍率|lowrate|低-rate|倍率)/i;
    const otherProxies = params.proxies
        .filter(proxy => 
            !COUNTRY_REGIONS.some(region => region.regex.test(proxy.name)) &&
            !RESIDENTIAL_REGEX_CHECK.test(proxy.name) &&
            !LOW_RATE_REGEX_CHECK.test(proxy.name)
        )
        .map(proxy => proxy.name);
    const hasOtherProxies = otherProxies.length > 0;
    
    return {
        allProxies,
        availableRegions,
        residentialProxies,
        lowRateProxies,
        hasResidential,
        hasLowRate,
        hasOtherProxies
    };
}

/**
 * 创建基础选项数组
 * 说明：创建基础代理选项，避免策略组间的循环引用
 * 修改建议：
 * - 可根据需要调整基础选项内容
 * - 确保不会造成逻辑死循环
 */
function createBaseOptions(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies = false) {
    const baseOptions = [
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 自动选择`),
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 手动选择`),
        "延迟优选",                                   // 延迟优选策略组
        "故障转移",                                   // 故障转移策略组
        ...(hasResidential ? [RESIDENTIAL_LINE] : []), // 家宽线路（如果存在）
        ...(hasLowRate ? [LOW_RATE_NODE] : []),        // 低倍率节点（如果存在）
        "负载均衡 · 散列",                            // 散列负载均衡
        "负载均衡 · 轮询",                            // 轮询负载均衡
        "DIRECT",                                     // 直连
        "REJECT"                                      // 拒绝连接
    ];
    
    // 如果有其他地区节点，添加其他地区手动选择
    if (hasOtherProxies) {
        baseOptions.splice(COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).length * 2 + 2, 0, "其他地区 · 手动选择");
    }
    
    return baseOptions;
}

/**
 * 创建核心策略组
 * 说明：创建核心路由策略组，作为整个配置的核心入口
 * 修改建议：
 * - proxies: 可调整策略组优先级顺序
 * - icon: 可更换图标文件
 */
function createCoreGroups(allProxies, COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate) {
    const baseOptions = createBaseOptions(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate);
    
    return [
        // 代理模式 - 总入口策略组
        createProxyGroup(GLOBAL_ROUTING, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,          // 核心路由分类
            proxies: baseOptions,                     // 基础选项
            icon: ICONS.GLOBAL_ROUTING              // 代理模式图标
        }),
        
        // 延迟优选 - 根据延迟自动选择最优节点
        createProxyGroup("延迟优选", "url-test", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,         // 核心路由分类
            "exclude-filter": "自动选择|手动选择",    // 排除自动和手动选择组
            proxies: allProxies.length ? allProxies : ["DIRECT"],  // 所有代理或直连
            icon: ICONS.SPEED_TEST,                 // 延迟优选图标
            hidden: true                            // 隐藏该组
        }),
        
        // 故障转移 - 当主节点故障时自动切换到备选节点
        createProxyGroup("故障转移", "fallback", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,         // 核心路由分类
            "exclude-filter": "自动选择|手动选择",    // 排除自动和手动选择组
            proxies: allProxies.length ? allProxies : ["DIRECT"],  // 所有代理或直连
            icon: ICONS.FAILOVER,                   // 故障转移图标
            hidden: true                            // 隐藏该组
        }),
        
        // 负载均衡 - 散列模式
        createProxyGroup("负载均衡 · 散列", "load-balance", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,         // 核心路由分类
            strategy: "consistent-hashing",         // 一致性哈希策略
            "exclude-filter": "自动选择|手动选择",    // 排除自动和手动选择组
            proxies: allProxies.length ? allProxies : ["DIRECT"],  // 所有代理或直连
            icon: ICONS.LOAD_BALANCE,               // 负载均衡图标
            hidden: true                            // 隐藏该组
        }),
        
        // 负载均衡 - 轮询模式
        createProxyGroup("负载均衡 · 轮询", "load-balance", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,         // 核心路由分类
            strategy: "round-robin",                // 轮询策略
            "exclude-filter": "自动选择|手动选择",    // 排除自动和手动选择组
            proxies: allProxies.length ? allProxies : ["DIRECT"],  // 所有代理或直连
            icon: ICONS.LOAD_BALANCE,               // 负载均衡图标
            hidden: true                            // 隐藏该组
        })
    ];
}

/**
 * 创建地区策略组
 * 说明：创建具体地区的策略组，包括自动选择和手动选择
 * 修改建议：
 * - url: 可修改为地区专用测试URL以提高准确性
 * - interval: 可调整测试间隔（秒），改小提高响应速度但增加资源消耗
 * - tolerance: 可调整延迟容忍度（毫秒），改大减少切换频率
 */
function createRegionalGroups(params, COUNTRY_REGIONS, availableRegions) {
    const RESIDENTIAL_REGEX = /(家宽|原生|residential|home)/i;
    const LOW_RATE_REGEX = /(低倍率|lowrate|低倍率|倍率)/i;
    
    const otherProxies = params.proxies
        .filter(proxy => 
            !COUNTRY_REGIONS.some(region => region.regex.test(proxy.name)) &&
            !RESIDENTIAL_REGEX.test(proxy.name) &&
            !LOW_RATE_REGEX.test(proxy.name)
        )
        .map(proxy => proxy.name);
    
    const hasOtherProxies = otherProxies.length > 0;
    
    // 创建地区自动选择组
    const autoGroups = COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))
        .map(region => createProxyGroup(
            `${region.name} · 自动选择`,            // 策略组名称
            "url-test",                             // 策略组类型为URL测试
            {
                category: CONFIG_MANAGER.GROUP_CATEGORY.REGION,    // 具体地区分类
                url: CONFIG_MANAGER.REGION_TEST_URLS[region.code] || CONFIG_MANAGER.TEST_URL,  // 地区专用测试URL
                interval: 3600,                      // 测试间隔600秒（省电优化）
                tolerance: 50,                      // 延迟容忍度50ms
                proxies: getProxiesByRegex(params, region.regex),  // 该地区的代理节点
                hidden: true                        // 隐藏该策略组
            }
        ))
        .filter(g => g.proxies.length > 0);
    
    // 创建地区手动选择组
    const manualGroups = COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))
        .map(region => createProxyGroup(
            `${region.name} · 手动选择`,            // 策略组名称
            "select",                               // 策略组类型为手动选择
            {
                category: CONFIG_MANAGER.GROUP_CATEGORY.REGION,    // 具体地区分类
                proxies: getProxiesByRegex(params, region.regex),  // 该地区的代理节点
                icon: region.icon,                  // 地区图标
                hidden: true                       // 不隐藏该策略组
            }
        ))
        .filter(g => g.proxies.length > 0);
    
    // 其他地区组（自动选择和手动选择）
    const otherAutoGroup = hasOtherProxies ? createProxyGroup(
        "其他地区 · 自动选择",                       // 自动选择其他地区节点
        "url-test", 
        {
            category: CONFIG_MANAGER.GROUP_CATEGORY.REGION,
            url: CONFIG_MANAGER.TEST_URL,           // 使用默认测试URL
            interval: 3600,                          // 测试间隔600秒（省电优化）
            tolerance: 50,                          // 延迟容忍度50ms
            proxies: otherProxies,                  // 其他地区代理节点
            hidden: true
        }
    ) : null;
    
    const otherManualGroup = hasOtherProxies ? createProxyGroup(
        "其他地区 · 手动选择",                       // 手动选择其他地区节点
        "select", 
        {
            category: CONFIG_MANAGER.GROUP_CATEGORY.REGION,
            proxies: otherProxies,
            icon: ICONS.GLOBAL,                     // 全球图标
            hidden: false
        }
    ) : null;
    
    return { autoSelectGroups: autoGroups, manualSelectGroups: manualGroups, otherAutoGroup, otherManualGroup };
}

/**
 * 创建线路特性策略组
 * 说明：创建特殊线路类型策略组，如家宽线路、低倍率节点等
 * 修改建议：
 * - proxies: 可调整线路节点的筛选条件
 * - icon: 可更换图标文件
 */
function createLineTypeGroups(hasResidential, residentialProxies, hasLowRate, lowRateProxies) {
    const groups = [];
    
    // 家宽/原生线路 - 提供更稳定、真实的IP线路
    if (hasResidential) {
        groups.push(createProxyGroup(RESIDENTIAL_LINE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.LINE_TYPE,     // 线路特性分类
            icon: ICONS.HOME_NETWORK,               // 家宽线路图标
            proxies: residentialProxies,            // 家宽线路节点
            hidden: false                           // 不隐藏该组
        }));
    }
    
    // 低倍率节点 - 提供更经济的流量使用方案
    if (hasLowRate) {
        groups.push(createProxyGroup(LOW_RATE_NODE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.LINE_TYPE,     // 线路特性分类
            icon: ICONS.LOW_RATE,                   // 低倍率节点图标
            proxies: lowRateProxies,                // 低倍率节点
            hidden: false                           // 不隐藏该组
        }));
    }
    
    return groups;
}

/**
 * 创建服务策略组（完整版）
 * 说明：创建针对特定服务优化的策略组，添加完整选项
 * 修改建议：
 * - proxies: 可调整服务策略的优先级顺序
 * - icon: 可更换图标文件
 */
function createServiceGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies) {
    // 创建完整选项，包含所有地区自动选择、手动选择和其他地区选项
    const serviceOptions = [
        GLOBAL_ROUTING,                             // 代理模式优先
        "延迟优选",                                   // 延迟优选
        "故障转移",                                   // 故障转移
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 自动选择`),
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 手动选择`),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []), // 家宽线路
        ...(hasLowRate ? [LOW_RATE_NODE] : []),        // 低倍率节点
        ...(hasOtherProxies ? ["其他地区 · 手动选择"] : []), // 添加其他地区手动选择
        "DIRECT",                                   // 直连
        "REJECT"                                    // 拒绝连接
    ];
    
    return [
        // 网络办公服务 - 为办公场景优化的路由策略
        createProxyGroup(OFFICE_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: serviceOptions,                // 完整选项
            icon: ICONS.OFFICE                      // 网络办公图标
        }),
        
        // 即时通讯 - 为即时通讯应用优化的路由
        createProxyGroup(INSTANT_MESSAGING, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: serviceOptions,                // 完整选项
            icon: ICONS.TELEGRAM                    // 即时通讯图标
        }),
        
        // AI服务 - 为AI相关服务优化的路由
        createProxyGroup(AI_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: serviceOptions,                // 完整选项
            icon: ICONS.AI                          // AI服务图标
        }),
        
        // 平台服务 - 为各类平台服务优化的路由
        createProxyGroup(PLATFORM_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: serviceOptions,                // 完整选项
            icon: ICONS.CLOUD                       // 平台服务图标
        }),
        
        // 视频服务 - 为视频流媒体优化的路由
        createProxyGroup(VIDEO_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: serviceOptions,                // 完整选项
            icon: ICONS.VIDEO                       // 视频服务图标
        }),
        
        // 谷歌服务 - 为谷歌相关服务优化的路由
        createProxyGroup(GOOGLE_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: serviceOptions,                // 完整选项
            icon: ICONS.GOOGLE                      // 谷歌服务图标
        }),
        
        // 微软服务 - 为微软相关服务优化的路由
        createProxyGroup(MICROSOFT_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: serviceOptions,                // 完整选项
            icon: ICONS.MICROSOFT                   // 微软服务图标
        }),
        
        // 虚幻引擎 - 为虚幻引擎相关服务优化的路由
        createProxyGroup(UNREAL_ENGINE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: serviceOptions,                // 完整选项
            icon: ICONS.UNREAL                      // 虚幻引擎图标
        }),
        
        // 广告拦截 - 广告和跟踪内容的拦截策略
        createProxyGroup(AD_BLOCKING, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: ["REJECT", "DIRECT"],          // 固定为拒绝和直连
            icon: ICONS.AD_BLOCK                    // 广告拦截图标
        })
    ];
}

/**
 * 创建流量管理策略组（完整版）
 * 说明：创建流量管理相关的策略组，包含完整选项
 * 修改建议：
 * - proxies: 可调整流量策略的优先级顺序
 * - icon: 可更换图标文件
 */
function createTrafficGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies) {
    // 创建流量管理用的完整选项
    const trafficOptions = [
        "DIRECT",                                   // 直连优先
        GLOBAL_ROUTING,                             // 代理模式
        "延迟优选",                                   // 延迟优选
        "故障转移",                                   // 故障转移
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 自动选择`),
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 手动选择`),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []), // 家宽线路
        ...(hasLowRate ? [LOW_RATE_NODE] : []),        // 低倍率节点
        ...(hasOtherProxies ? ["其他地区 · 手动选择"] : []), // 添加其他地区手动选择
        "REJECT"                                    // 拒绝连接
    ];
    
    return [
        // 大流量通道 - 专门为大流量传输优化的通道
        createProxyGroup(HIGH_TRAFFIC_CHANNEL, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.TRAFFIC,       // 流量管理分类
            proxies: trafficOptions,                // 完整选项
            icon: ICONS.DOWNLOAD                    // 大流量通道图标
        })
    ];
}

/**
 * 创建自定义规则策略组（完整版）
 * 说明：创建用户自定义规则的策略组，包含完整选项
 * 修改建议：
 * - proxies: 可调整自定义规则的优先级顺序
 * - icon: 可更换图标文件
 */
function createCustomRuleGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies) {
    // 创建自定义规则用的完整选项
    const customOptions = [
        GLOBAL_ROUTING,                             // 代理模式优先
        "延迟优选",                                   // 延迟优选
        "故障转移",                                   // 故障转移
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 自动选择`),
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 手动选择`),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []), // 家宽线路
        ...(hasLowRate ? [LOW_RATE_NODE] : []),        // 低倍率节点
        ...(hasOtherProxies ? ["其他地区 · 手动选择"] : []), // 添加其他地区手动选择
        "DIRECT",                                   // 直连
        "REJECT"                                    // 拒绝连接
    ];
    
    return [
        // 自定义代理规则 - 用户自定义需要代理的规则
        createProxyGroup(CUSTOM_PROXY_RULE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CUSTOM,        // 自定义规则分类
            proxies: customOptions,                 // 完整选项
            icon: ICONS.CUSTOM_PROXY                // 自定义代理规则图标
        }),
        
        // 自定义直连规则 - 用户自定义需要直连的规则
        createProxyGroup(CUSTOM_DIRECT_RULE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CUSTOM,        // 自定义规则分类
            proxies: ["DIRECT", ...customOptions],  // 完整选项，直连优先
            icon: ICONS.CUSTOM_DIRECT               // 自定义直连规则图标
        })
    ];
}

/**
 * 创建默认路由策略组（完整版）
 * 说明：创建最终默认路由策略组，包含完整选项
 * 修改建议：
 * - proxies: 可调整默认路由的优先级顺序
 * - icon: 可更换图标文件
 */
function createDefaultRouteGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies) {
    // 创建默认路由用的完整选项
    const defaultOptions = [
        "DIRECT",                                   // 直连优先
        "REJECT",                                   // 拒绝连接
        GLOBAL_ROUTING,                             // 代理模式
        "延迟优选",                                   // 延迟优选
        "故障转移",                                   // 故障转移
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 自动选择`),
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name} · 手动选择`),
        ...(hasResidential ? [RESIDENTIAL_LINE] : []), // 家宽线路
        ...(hasLowRate ? [LOW_RATE_NODE] : []),        // 低倍率节点
        ...(hasOtherProxies ? ["其他地区 · 手动选择"] : [])  // 添加其他地区手动选择
    ];
    
    return [
        // 国内流量 - 国内网络流量的默认路由
        createProxyGroup(DOMESTIC_TRAFFIC, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.DEFAULT_ROUTE, // 默认路由分类
            proxies: defaultOptions,                // 完整选项
            icon: ICONS.DOMESTIC                    // 国内流量图标
        }),
        
        // 国际流量 - 国际网络流量的默认路由
        createProxyGroup(GLOBAL_TRAFFIC, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.DEFAULT_ROUTE, // 默认路由分类
            proxies: defaultOptions,                // 完整选项
            icon: ICONS.INTERNATIONAL               // 国际流量图标
        })
    ];
}

// ===================== 规则配置模块 =====================
/**
 * 覆盖规则配置
 * 说明：配置规则匹配顺序和对应策略组
 * 修改建议：
 * - 可在customRules区域添加自定义规则
 * - 规则顺序很重要，靠前的规则优先匹配
 * @param {Object} params - 配置参数对象
 */
function overwriteRules(params) {
    // 自定义规则添加区域
    // 格式: "规则类型,规则值,策略组"
    // 示例: 
    //   "DOMAIN-SUFFIX,example.com,平台服务"
    //   "IP-CIDR,192.168.1.0/24,DIRECT"
    const customRules = [
        // "DOMAIN-SUFFIX,custom-domain.com,平台服务"  // 用户自定义规则示例
    ]; 
    
    // 获取策略组状态
    const hasResidential = params.__hasResidential || false;
    const hasLowRate = params.__hasLowRate || false;
    
    // 构建规则数组，按优先级顺序排列
    const rules = [
        // ========= 广告拦截规则 =========
        // 基于IP的广告拦截规则
        `RULE-SET,Reject_no_ip,${AD_BLOCKING}`,
        // 基于域名的广告拦截规则
        `RULE-SET,Reject_domainset,${AD_BLOCKING}`,
        // 需要丢弃的广告拦截规则
        `RULE-SET,Reject_no_ip_drop,${AD_BLOCKING}`,
        // 不需要丢弃的广告拦截规则
        `RULE-SET,Reject_no_ip_no_drop,${AD_BLOCKING}`,
        // IP广告拦截规则
        `RULE-SET,Reject_ip,${AD_BLOCKING}`,
        
        // ========= 直连规则 =========
        "GEOSITE,cn,DIRECT",
        // 国内IP直连规则（不解析）
        "GEOIP,cn,DIRECT,no-resolve",
        //"GEOIP,China_ip,DIRECT",




        
        // === 程序化广告拦截规则（已并入广告拦截）===
        
        // $$$$ 用户自定义规则区域 $$$$  
        ...customRules,  // 用户自定义规则插入点
        
        // === 应用规则集 ===
        // 应用程序规则集，指向大流量通道
        `RULE-SET,applications,${HIGH_TRAFFIC_CHANNEL}`,
        
        // === 自定义规则集 ===
        // 用户自定义代理规则集
        `RULE-SET,CustomProxyRules,${CUSTOM_PROXY_RULE}`,
        // 用户自定义直连规则集
        `RULE-SET,CustomDirectRules,${CUSTOM_DIRECT_RULE}`,
        
        // === 服务专用规则 ===
        `RULE-SET,Figma_ip,${OFFICE_SERVICE}`,
        `RULE-SET,Notion_ip,${OFFICE_SERVICE}`,
        `RULE-SET,Github,${OFFICE_SERVICE}`,
        `RULE-SET,OneDrive,${OFFICE_SERVICE}`,
        `RULE-SET,Dropbox,${OFFICE_SERVICE}`,

        // AI服务规则集
        `RULE-SET,OpenAI,${AI_SERVICE}`,
        `RULE-SET,AI_no_ip,${AI_SERVICE}`,
        `RULE-SET,Gemini,${AI_SERVICE}`,
        // YouTube视频服务规则
        `RULE-SET,YouTube,${VIDEO_SERVICE}`,
        // Telegram即时通讯IP规则
        `RULE-SET,Telegram_ip,${INSTANT_MESSAGING}`,
        `RULE-SET,Telegram_no_ip,${INSTANT_MESSAGING}`,
        // 谷歌服务规则
        `RULE-SET,GoogleFCM_ip,${GOOGLE_SERVICE}`,
        `RULE-SET,Google,${GOOGLE_SERVICE}`,
        `RULE-SET,GoogleFCM_no_ip,${GOOGLE_SERVICE}`,
        // 微软服务规则
        `RULE-SET,Microsoft_no_ip,${MICROSOFT_SERVICE}`,

        // 下载通道
        `RULE-SET,MicrosoftCDN_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,CDN_domainset,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,CDN_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,Download_domainset,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,Download_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,GameDownload,${HIGH_TRAFFIC_CHANNEL}`,


        // 虚幻引擎规则
        `RULE-SET,UnrealRules,${UNREAL_ENGINE}`,
        
        // === 基础路由规则 ===
        // 私有网络直连规则
        //"RULE-SET,private,DIRECT",
        // 私有IP直连规则（不解析）
        //"GEOIP,private,DIRECT,no-resolve",
        // 国内域名直连规则
        "GEOSITE,cn,DIRECT",
        // 国内IP直连规则（不解析）
        "GEOIP,cn,DIRECT,no-resolve",
        
        // === 最终匹配规则 ===
        // 国内IP流量走国内流量策略组
        `GEOIP,CN,${DOMESTIC_TRAFFIC}`,
        // 未匹配流量走国际流量策略组
        `MATCH,${GLOBAL_TRAFFIC}`
    ];
    
    // 将规则数组应用到配置中
    params.rules = rules;
    // 配置规则提供器
    params["rule-providers"] = createRuleProviders();
}

// ===================== 规则提供器配置 =====================
/**
 * 创建规则提供器配置
 * 说明：配置所有规则集的来源和更新设置
 * 修改建议：
 * - url: 可修改为其他规则源URL
 * - path: 可修改为本地存储路径
 * - interval: 可修改更新间隔（秒）
 * @return {Object} 规则提供器配置对象
 */
function createRuleProviders() {
    // 检查缓存
    if (CACHE.ruleProviders) {
        return CACHE.ruleProviders;
    }
    
    /**
     * 创建规则提供器配置的辅助函数
     * @param {string} url - 规则集URL
     * @param {string} path - 本地存储路径
     * @param {number} interval - 更新间隔（秒）
     * @return {Object} 规则提供器配置
     */
    function createRuleProviderConfig(url, path, interval = CONFIG_MANAGER.UPDATE_INTERVALS.DEFAULT) {
        return {
            type: "http",                           // HTTP类型规则集
            behavior: "classical",                  // 经典规则行为
            format: "yaml",                         // YAML格式
            interval: interval,                     // 更新间隔
            url: url,                               // 规则URL
            path: path                              // 本地存储路径
        };
    }
    
    const providers = {
        // === 广告拦截规则集 ===
        // 基于IP的广告拦截规则
        Reject_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/ip/Reject_ip.yaml",
            "./ruleset/toookamak/Reject_ip.yaml"
        ),
        // 无IP的广告拦截规则
        Reject_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip.yaml", 
            "./ruleset/toookamak/Reject_no_ip.yaml"
        ),
        // 域名集广告拦截规则
        Reject_domainset: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_domainset.yaml",
            "./ruleset/toookamak/Reject_domainset.yaml"
        ),
        // 需要丢弃的无IP广告拦截规则
        Reject_no_ip_drop: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_drop.yaml",
            "./ruleset/toookamak/Reject_no_ip_drop.yaml"
        ),
        // 不需要丢弃的无IP广告拦截规则
        Reject_no_ip_no_drop: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_no_drop.yaml",
            "./ruleset/toookamak/Reject_no_ip_no_drop.yaml"
        ),
        
        // === 跟踪器拦截规则集 ===
        // 跟踪器IP拦截规则



        // === 程序化广告拦截规则集（已并入广告拦截）===
        // 程序化广告IP拦截规则




        
        // === 直连规则集 ===
        // 中国IP直连规则
        China_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/China_ip.yaml",
            "./ruleset/toookamak/China_ip.yaml"
        ),
        // 国内IP直连规则
        Domestic_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Domestic_ip.yaml",
            "./ruleset/toookamak/Domestic_ip.yaml"
        ),
        // Google FCM IP直连规则
        GoogleFCM_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/GoogleFCM_ip.yaml",
            "./ruleset/toookamak/GoogleFCM_ip.yaml"
        ),
        // 局域网IP直连规则
        Lan_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Lan_ip.yaml",
            "./ruleset/toookamak/Lan_ip.yaml"
        ),

        // 国内Steam IP直连规则
        SteamCN_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/SteamCN_ip.yaml",
            "./ruleset/toookamak/SteamCN_ip.yaml"
        ),
        // Apple CDN无IP直连规则
        AppleCDN_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/AppleCDN_no_ip.yaml",
            "./ruleset/toookamak/AppleCDN_no_ip.yaml"
        ),
        // 国内Apple无IP直连规则
        AppleCN_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/AppleCN_no_ip.yaml",
            "./ruleset/toookamak/AppleCN_no_ip.yaml"
        ),
        // 通用直连无IP规则
        Direct_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Direct_no_ip.yaml",
            "./ruleset/toookamak/Direct_no_ip.yaml"
        ),
        // 国内无IP直连规则
        Domestic_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Domestic_no_ip.yaml",
            "./ruleset/toookamak/Domestic_no_ip.yaml"
        ),
        // Google FCM无IP直连规则
        GoogleFCM_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/GoogleFCM_no_ip.yaml",
            "./ruleset/toookamak/GoogleFCM_no_ip.yaml"
        ),
        // 局域网无IP直连规则

        // 微软CDN无IP直连规则
        MicrosoftCDN_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/MicrosoftCDN_no_ip.yaml",
            "./ruleset/toookamak/MicrosoftCDN_no_ip.yaml"
        ),
        // 网易音乐无IP直连规则

        // 国内Steam无IP直连规则
        SteamCN_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/SteamCN_no_ip.yaml",
            "./ruleset/toookamak/SteamCN_no_ip.yaml"
        ),
        // Steam地区无IP直连规则
        SteamRegion_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/SteamRegion_no_ip.yaml",
            "./ruleset/toookamak/SteamRegion_no_ip.yaml"
        ),
        
        // === 代理规则集 ===
        // 流媒体IP代理规则
        Stream_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Stream_ip.yaml",
            "./ruleset/toookamak/Stream_ip.yaml"
        ),
        // Telegram IP代理规则
        Telegram_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Telegram_ip.yaml",
            "./ruleset/toookamak/Telegram_ip.yaml"
        ),
        // AI无IP代理规则
        AI_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/AI_no_ip.yaml",
            "./ruleset/toookamak/AI_no_ip.yaml"
        ),
        // Apple无IP代理规则
        Apple_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Apple_no_ip.yaml",
            "./ruleset/toookamak/Apple_no_ip.yaml"
        ),
        // CDN域名集代理规则
        CDN_domainset: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_domainset.yaml",
            "./ruleset/toookamak/CDN_domainset.yaml"
        ),
        // CDN无IP代理规则
        CDN_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_no_ip.yaml",
            "./ruleset/toookamak/CDN_no_ip.yaml"
        ),
        // 自定义代理无IP规则

        // 下载域名集代理规则
        Download_domainset: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_domainset.yaml",
            "./ruleset/toookamak/Download_domainset.yaml"
        ),
        // 下载无IP代理规则
        Download_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_no_ip.yaml",
            "./ruleset/toookamak/Download_no_ip.yaml"
        ),
        // 微软无IP代理规则
        Microsoft_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Microsoft_no_ip.yaml",
            "./ruleset/toookamak/Microsoft_no_ip.yaml"
        ),
        // Steam无IP代理规则
        Steam_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Steam_no_ip.yaml",
            "./ruleset/toookamak/Steam_no_ip.yaml"
        ),
        // Telegram无IP代理规则
        Telegram_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Telegram_no_ip.yaml",
            "./ruleset/toookamak/Telegram_no_ip.yaml"
        ),

        
        // === 新增规则集 ===

        // === 新增 Figma 规则集 ===
        // Figma IP代理规则
        Figma_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Figma/Figma.yaml",
            "./ruleset/toookamak/Figma_ip.yaml"
        ),
                // Notion IP代理规则
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


        // === 自定义规则集 ===
        // 用户自定义代理规则
        CustomProxyRules: {
            type: "http",                           // HTTP类型规则集
            behavior: "classical",                  // 经典规则行为
            format: "text",                         // 文本格式
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,  // 24小时更新间隔
            url: CONFIG_MANAGER.CUSTOM_RULES.PROXY_URL,  // 自定义代理规则URL
            path: "./ruleset/toookamak/OwnPROXYRules.yaml"  // 本地存储路径
        },
        // 用户自定义直连规则
        CustomDirectRules: {
            type: "http",                           // HTTP类型规则集
            behavior: "classical",                  // 经典规则行为
            format: "text",                         // 文本格式
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,  // 24小时更新间隔
            url: CONFIG_MANAGER.CUSTOM_RULES.DIRECT_URL,  // 自定义直连规则URL
            path: "./ruleset/toookamak/OwnDIRECTRules.yaml"  // 本地存储路径
        },
        // 用户自定义拒绝规则
        CustomRejectRules: {
            type: "http",                           // HTTP类型规则集
            behavior: "classical",                  // 经典规则行为
            format: "text",                         // 文本格式
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,  // 24小时更新间隔
            url: CONFIG_MANAGER.CUSTOM_RULES.REJECT_URL,  // 自定义直连规则URL
            path: "./ruleset/toookamak/OwnREJECTRules.yaml"  // 本地存储路径
        },

        
        // === 应用规则集 ===
        // 应用程序规则集
        applications: {
            type: "http",                           // HTTP类型规则集
            behavior: "classical",                  // 经典规则行为
            format: "text",                         // 文本格式
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,  // 24小时更新间隔
            url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/applications.txt",  // 应用规则URL
            path: "./ruleset/toookamak/applications.yaml"  // 本地存储路径
        },
        
        // === AI规则集 ===

    };
    
    // 存储到缓存
    CACHE.ruleProviders = providers;
    return providers;
}

// ===================== 辅助函数 =====================
/**
 * 创建代理组
 * 说明：策略组工厂方法，统一创建策略组
 * 修改建议：
 * - 一般不需要修改此函数
 * - 如需添加特殊参数，可以在此函数中扩展
 * @param {string} name - 策略组名称
 * @param {string} type - 策略组类型
 * @param {Object} options - 策略组选项
 * @return {Object} 策略组对象
 */
function createProxyGroup(name, type, options = {}) {
    // 创建基础策略组对象
    const base = { 
        name,                                       // 策略组名称
        type,                                       // 策略组类型
        category: options.category || "未分类",      // 策略组分类
        url: type !== "select" ? CONFIG_MANAGER.TEST_URL : undefined,  // 测试URL（非选择类型）
        interval: type !== "select" ? 600 : undefined   // 测试间隔（非选择类型，优化为600秒省电）
    };
    
    // 针对负载均衡类型做特殊处理
    if (type === "load-balance") {
        // 合并负载均衡特有的选项
        Object.assign(options, {
            "max-failed-times": 3,                  // 最大失败次数
            lazy: true                              // 懒加载模式
        });
    }
    
    // 返回合并后的策略组对象
    return Object.assign(base, options);
}

/**
 * 根据正则表达式获取代理节点
 * 说明：根据正则表达式筛选匹配的代理节点
 * 修改建议：
 * - regex: 可修改正则表达式以适配不同的节点命名规则
 * - fallback: 可修改备选节点数组
 * @param {Object} params - 配置参数对象
 * @param {RegExp} regex - 匹配正则表达式
 * @param {Array} fallback - 备选节点数组
 * @return {Array} 匹配的代理节点名称数组
 */
function getProxiesByRegex(params, regex, fallback = ["DIRECT"]) {
    // 过滤匹配正则表达式的代理节点并提取名称
    const matched = params.proxies
        .filter(e => regex.test(e.name))            // 筛选匹配的节点
        .map(e => e.name);                          // 提取节点名称
    // 如果有匹配节点则返回，否则返回备选节点
    return matched.length ? matched : fallback;
}

// ===================== DNS配置模块 =====================
/**
 * 覆盖DNS配置
 * 说明：配置DNS解析相关参数
 * 修改建议：
 * - nameserver: 可修改为其他DNS服务器
 * - fake-ip-filter: 可添加需要跳过fake-ip的域名
 * @param {Object} params - 配置参数对象
 */
function overwriteDns(params) {
    // 设置DNS配置
    params.dns = {
        enable: true,                               // 启用DNS功能
        listen: "0.0.0.0:1053",                     // 监听地址和端口
        "enhanced-mode": "fake-ip",                 // 增强模式为虚假IP
        "fake-ip-range": "198.18.0.1/16",           // 虚假IP范围
        "use-hosts": false,                         // 不使用hosts文件
        "use-system-hosts": false,                  // 不使用系统hosts文件
        ipv6: false,                                // 禁用IPv6 DNS解析
        "fake-ip-filter": [                         // 虚假IP过滤列表
            "*.lan", "*.local",                     // 局域网域名
            "time.*.com", "ntp.*.com",              // 时间同步域名
            "*.market.xiaomi.com",                  // 小米市场域名
            "localhost.ptlogin2.qq.com",            // QQ登录域名
            "localhost.sec.qq.com",                 // QQ安全域名
            "*.qq.com", "*.tencent.com",            // QQ和腾讯域名
            "*.msftconnecttest.com",                // 微软连接测试域名
            "*.msftncsi.com"                        // 微软网络连接状态域名
        ],
        "default-nameserver": ["tls://223.5.5.5"],  // 默认DNS服务器（TLS加密）
        nameserver: [                               // 主要DNS服务器
            "https://dns.alidns.com/dns-query",     // 阿里DNS
            "https://doh.pub/dns-query"             // DNSPod DNS
        ],
        "proxy-server-nameserver": [                // 代理服务器DNS
          'https://1.1.1.1/dns-query',              // Cloudflare DNS
          'https://223.5.5.5/dns-query'             // 阿里DNS
        ],
        "nameserver-policy": {                      // DNS策略
            'geosite:private': 'system',            // 私有域名使用系统DNS
            'geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn': ['119.29.29.29', '223.5.5.5']  // 国内域名使用国内DNS
        }
    };
}

// ===================== TUN配置模块 =====================
/**
 * 覆盖TUN配置
 * 说明：配置TUN隧道相关参数
 * 修改建议：
 * - enable: 设为false可禁用TUN功能
 * - stack: 可修改为其他协议栈（如gvisor）
 * - mtu: 可调整最大传输单元大小
 * @param {Object} params - 配置参数对象
 */
function overwriteTunnel(params) {
    // 设置TUN隧道配置
    params.tun = {
        enable: true,                               // 启用TUN功能
        stack: "mixed",                             // 混合协议栈
        device: "Mihomo",                           // TUN设备名称
        "dns-hijack": ["any:53"],                   // DNS劫持配置
        "auto-route": true,                         // 自动路由
        "auto-redirect": false,                     // 不自动重定向
        "auto-detect-interface": true,              // 自动检测网络接口
        "strict-route": false,                      // 不使用严格路由
        "route-exclude-address": [],                // 路由排除地址列表
        mtu: 1500                                   // 最大传输单元
    };
}
