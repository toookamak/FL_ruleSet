// FL_ClashRuleDIY_1124.js
// FL_Clash_Rule_DIY.js - 策略组优化版
// 优化：直接使用完整规则URL，便于维护
// 特点：所有规则集使用完整URL，图标使用完整URL
// 版本：v8.2.2
// 最后更新：2025-11-24  |  修复变量未定义和循环引用问题
// 更新内容：
// 1. 修复地区策略组不显示问题
// 2. 优化节点分类逻辑：地区组只显示普通节点，家宽/低倍率组包含所有地区节点
// 3. 修复策略组循环引用和变量未定义问题
// 4. 简化策略组结构，提高性能和用户体验
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

// ===================== 关键词配置 =====================
/**
 * 统一关键词配置 - 集中管理所有过滤关键词
 * 说明：
 * - 将所有需要排除的关键词集中管理，便于维护
 * - 修改关键词时只需在此处调整
 * - 支持中英文关键词混合配置
 */
const KEYWORDS_CONFIG = {
    // 通知类关键词 - 用于识别通知节点
    NOTIFICATION: "自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire|剩余|激励|分享|到期|续费|充值",
    
    // 家宽节点关键词 - 用于识别家宽/原生IP节点
    RESIDENTIAL: "家宽|原生|residential|home",
    
    // 低倍率节点关键词 - 用于识别低倍率优惠节点
    LOW_RATE: "低倍率|lowrate|低-rate|倍率"
};

/**
 * 构建正则表达式工具函数
 * 说明：根据关键词字符串构建正则表达式
 * @param {string} keywords - 管道符分隔的关键词字符串
 * @param {string} flags - 正则表达式标志
 * @return {RegExp} 构建的正则表达式
 */
function buildRegex(keywords, flags = 'i') {
    return new RegExp(`(${keywords})`, flags);
}

/**
 * 构建排除正则表达式工具函数
 * 说明：构建用于排除匹配项的负向前瞻正则表达式
 * @param {string} keywords - 管道符分隔的关键词字符串
 * @param {string} flags - 正则表达式标志
 * @return {RegExp} 构建的排除正则表达式
 */
function buildExcludeRegex(keywords, flags = 'i') {
    return new RegExp(`^(?!.*(?:${keywords})).*$`, flags);
}

// 预构建常用正则表达式（在脚本初始化时执行一次）
const REGEX_PATTERNS = {
    // 通知节点正则表达式
    NOTIFICATION: buildRegex(KEYWORDS_CONFIG.NOTIFICATION),
    NOTIFICATION_CHECK: buildRegex(KEYWORDS_CONFIG.NOTIFICATION),
    NOTIFICATION_EXCLUDE: buildExcludeRegex(KEYWORDS_CONFIG.NOTIFICATION),
    
    // 家宽节点正则表达式
    RESIDENTIAL: buildRegex(KEYWORDS_CONFIG.RESIDENTIAL),
    RESIDENTIAL_CHECK: buildRegex(KEYWORDS_CONFIG.RESIDENTIAL),
    
    // 低倍率节点正则表达式
    LOW_RATE: buildRegex(KEYWORDS_CONFIG.LOW_RATE),
    LOW_RATE_CHECK: buildRegex(KEYWORDS_CONFIG.LOW_RATE)
};

// ===================== 策略组命名常量 =====================
/**
 * 所有策略组名称定义，便于统一管理和维护
 * 修改建议：
 * - 可以根据个人喜好修改策略组中文名称
 * - 不建议修改英文常量名，会影响代码逻辑
 */
const GLOBAL_ROUTING = "🧭 代理模式";                    // 核心代理模式入口
const ALL_NODES_GROUP = "🌍 全部节点";                // 显示所有节点线路
const RESIDENTIAL_LINE = "🏠 家宽/原生线路";             // 家宽/原生IP线路
const LOW_RATE_NODE = "💰 低倍率节点";                  // 低倍率优惠节点
const NOTIFICATION_GROUP = "📢 机场通知";              // 机场通知信息组
const OFFICE_MESSAGING = "办公通讯";                  // 合并策略组：即时通讯+网络办公
const AI_SERVICE = "AI服务";                         // AI相关服务
const AD_BLOCKING = "广告拦截";                      // 广告拦截服务（包含跟踪器）
const HIGH_TRAFFIC_CHANNEL = "大流量通道";           // 大流量传输通道
const GOOGLE_SERVICE = "谷歌服务";                   // 谷歌相关服务（包含YouTube）
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
/*     // 核心路由图标
    GLOBAL_ROUTING: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Proxy.png",          // 代理模式
    ALL_NODES: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "World_Map.png",           // 全部节点
    SPEED_TEST: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Speedtest.png",          // 延迟优选
    FAILOVER: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Final.png",                // 故障转移
    LOAD_BALANCE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Balance.png",          // 负载均衡
    HOME_NETWORK: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "VIP.png",              // 家宽线路
    LOW_RATE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Speedtest.png",            // 低倍率节点
    NOTIFICATION: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Apple_Mail.png",             // 通知信息
    
    // 地区图标
    HK: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Hong_Kong.png",                  // 香港
    SG: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Singapore.png",                  // 新加坡
    JP: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Japan.png",                      // 日本
    US: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "United_States.png",              // 美国
    GLOBAL: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "World_Map.png",              // 全球/其他地区
    
    // 服务专用图标
    OFFICE: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Notion.png",                 // 办公通讯
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
    INTERNATIONAL: CONFIG_MANAGER.CDN_SOURCES.PRIMARY + "Streaming!CN.png"     // 国际流量 */
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
    // 检 查缓存，如果已有结果则直接使用
    if (CACHE.proxyGroups) {
        params["proxy-groups"] = CACHE.proxyGroups;
        params.__hasResidential = CACHE.residentialProxies && CACHE.residentialProxies.length > 0;
        params.__hasLowRate = CACHE.lowRateProxies && CACHE.lowRateProxies.length > 0;
        return;
    }
    
    // 地区分组配置
    const COUNTRY_REGIONS = createRegionalConfig();
    
    // 获取有效代理和节点分类
    const { allProxies, availableRegions, residentialProxies, lowRateProxies, hasResidential, hasLowRate, hasOtherProxies, notificationProxies, hasNotifications } = 
        processProxyNodes(params, COUNTRY_REGIONS);
    
    // 存储全局变量供后续使用
    params.__hasResidential = hasResidential;
    params.__hasLowRate = hasLowRate;
    params.__hasNotifications = hasNotifications;
    
    // 存储到缓存
    CACHE.residentialProxies = residentialProxies;
    CACHE.lowRateProxies = lowRateProxies;
    
    // 创建各类策略组
    const coreGroups = createCoreGroups(allProxies, COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasNotifications);
    const manualSelectGroups = createRegionalGroups(params, COUNTRY_REGIONS, availableRegions, hasNotifications, notificationProxies);
    const lineTypeGroups = createLineTypeGroups(hasResidential, residentialProxies, hasLowRate, lowRateProxies);
    const notificationGroups = createNotificationGroups(hasNotifications, notificationProxies);
    const serviceGroups = createServiceGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications);
    const trafficGroups = createTrafficGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications);
    const customRuleGroups = createCustomRuleGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications);
    const defaultRouteGroups = createDefaultRouteGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications);
    
    // 合并所有代理组 - 按照优化后的顺序排列
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
    
    // 存储到缓存和参数
    CACHE.proxyGroups = allGroups;
    params["proxy-groups"] = allGroups;
}

/**
 * 创建地区配置
 * 说明：定义支持的地区及其匹配规则
 * 修改建议：
 * - 可以添加或删除支持的地区
 * - regex: 修改正则表达式以适配不同的节点命名规则
 */
function createRegionalConfig() {
    return [
        { 
            code: "HK",                         // 地区代码
            name: "🇭🇰 香港",                        // 地区名称
            icon: ICONS.HK,                     // 地区图标
            regex: /(香港|HK|Hong Kong|🇭🇰)/i    // 匹配正则表达式
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
 * 处理代理节点分类（优化版）
 * 说明：对所有代理节点进行分类和筛选，优化节点分组逻辑
 */
function processProxyNodes(params, COUNTRY_REGIONS) {
    // 使用预构建的排除正则表达式
    const PROXY_REGEX = REGEX_PATTERNS.NOTIFICATION_EXCLUDE;
    const allProxies = getProxiesByRegex(params, PROXY_REGEX);
    
    // 正确识别可用地区
    const availableRegions = new Set();
    params.proxies.forEach(proxy => {
        const region = COUNTRY_REGIONS.find(r => r.regex.test(proxy.name));
        if (region) {
            availableRegions.add(region.name);
        }
    });
    
    // 获取特殊节点（不分地区）
    const residentialProxies = getProxiesByRegex(params, REGEX_PATTERNS.RESIDENTIAL);
    const lowRateProxies = getProxiesByRegex(params, REGEX_PATTERNS.LOW_RATE);
    const hasResidential = residentialProxies.length > 0;
    const hasLowRate = lowRateProxies.length > 0;
    
    // 检查是否有其他地区节点
    const otherProxies = params.proxies
        .filter(proxy => 
            !COUNTRY_REGIONS.some(region => region.regex.test(proxy.name)) &&
            !REGEX_PATTERNS.RESIDENTIAL_CHECK.test(proxy.name) &&
            !REGEX_PATTERNS.LOW_RATE_CHECK.test(proxy.name) &&
            !REGEX_PATTERNS.NOTIFICATION_CHECK.test(proxy.name)
        )
        .map(proxy => proxy.name);
    const hasOtherProxies = otherProxies.length > 0;
    
    // 获取通知类节点
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
 * 创建基础选项数组（避免循环引用）
 */
function createBaseOptions(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasNotifications, hasOtherProxies = false) {
    const baseOptions = [
        ...COUNTRY_REGIONS.filter(r => availableRegions.has(r.name)).map(r => `${r.name}`),  // 各地区策略组
        ...(hasOtherProxies ? ["🌐 其他地区"] : []),                                         // 其他地区
        ALL_NODES_GROUP,                                                                     // 全部节点
        "⚡ 延迟优选",                                                                       // 延迟优选
        "🚧 故障转移",                                                                       // 故障转移
        ...(hasResidential ? [RESIDENTIAL_LINE] : []),                                       // 家宽线路
        ...(hasLowRate ? [LOW_RATE_NODE] : []),                                              // 低倍率节点
        ...(hasNotifications ? [NOTIFICATION_GROUP] : []),                                   // 通知信息组
        "⚖️ 负载均衡 · 散列",                                                                // 散列负载均衡
        "🔁 负载均衡 · 轮询",                                                                // 轮询负载均衡
        "DIRECT",                                                                            // 直连
        "REJECT"                                                                             // 拒绝连接
    ];
    
    return baseOptions;
}

/**
 * 创建核心策略组
 * 说明：创建核心路由策略组，作为整个配置的核心入口
 */
function createCoreGroups(allProxies, COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasNotifications) {
    const baseOptions = createBaseOptions(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasNotifications, true);
    
    return [
        // 代理模式 - 总入口策略组（不能包含自己）
        createProxyGroup(GLOBAL_ROUTING, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            proxies: baseOptions,
            icon: ICONS.GLOBAL_ROUTING
        }),
        
        // 延迟优选 - 根据延迟自动选择最优节点
        createProxyGroup("⚡ 延迟优选", "url-test", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies,
            icon: ICONS.SPEED_TEST,
            hidden: true
        }),
        
        // 故障转移 - 当主节点故障时自动切换到备选节点
        createProxyGroup("🚧 故障转移", "fallback", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies,
            icon: ICONS.FAILOVER,
            hidden: true
        }),
        
        // 负载均衡 - 散列模式
        createProxyGroup("⚖️ 负载均衡 · 散列", "load-balance", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            strategy: "consistent-hashing",
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies,
            icon: ICONS.LOAD_BALANCE,
            hidden: true
        }),
        
        // 负载均衡 - 轮询模式
        createProxyGroup("🔁 负载均衡 · 轮询", "load-balance", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            strategy: "round-robin",
            "exclude-filter": "自动选择|手动选择",
            proxies: allProxies,
            icon: ICONS.LOAD_BALANCE,
            hidden: true
        }),

        // 全部节点 - 显示所有有效节点
        createProxyGroup(ALL_NODES_GROUP, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CORE,
            proxies: allProxies,
            icon: ICONS.ALL_NODES,
            hidden: false 
        }),
    ];
}

/**
 * 创建地区策略组（优化版）
 * 说明：创建具体地区的策略组，只包含该地区的普通节点（剔除家宽和低倍率节点）
 */
function createRegionalGroups(params, COUNTRY_REGIONS, availableRegions, hasNotifications, notificationProxies) {
    const manualGroups = [];
    
    COUNTRY_REGIONS.forEach(region => {
        if (availableRegions.has(region.name)) {
            // 获取该地区所有节点，但剔除家宽和低倍率节点
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
                        icon: region.icon,
                        hidden: false
                    }
                ));
            }
        }
    });
    
    // 创建其他地区策略组
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
                icon: ICONS.GLOBAL,
                hidden: false
            }
        ));
    }
    
    return manualGroups;
}

/**
 * 创建线路特性策略组
 * 说明：创建特殊线路类型策略组，家宽和低倍率节点不分地区
 */
function createLineTypeGroups(hasResidential, residentialProxies, hasLowRate, lowRateProxies) {
    const groups = [];
    
    // 家宽/原生线路 - 包含所有地区的家宽节点
    if (hasResidential) {
        groups.push(createProxyGroup(RESIDENTIAL_LINE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.LINE_TYPE,
            icon: ICONS.HOME_NETWORK,
            proxies: residentialProxies,
            hidden: false
        }));
    }
    
    // 低倍率节点 - 包含所有地区的低倍率节点
    if (hasLowRate) {
        groups.push(createProxyGroup(LOW_RATE_NODE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.LINE_TYPE,
            icon: ICONS.LOW_RATE,
            proxies: lowRateProxies,
            hidden: false
        }));
    }
    
    return groups;
}

/**
 * 创建通知策略组
 * 说明：创建用于显示机场通知信息的策略组
 */
function createNotificationGroups(hasNotifications, notificationProxies) {
    const groups = [];
    
    if (hasNotifications) {
        groups.push(createProxyGroup(NOTIFICATION_GROUP, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CUSTOM,
            icon: ICONS.NOTIFICATION,
            proxies: notificationProxies,
            hidden: false
        }));
    }
    
    return groups;
}

/**
 * 创建服务策略组（完整版）
 * 说明：创建针对特定服务优化的策略组，添加完整选项
 */
function createServiceGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications) {
    // 创建完整选项（不包含代理模式本身，避免循环引用）
    const serviceOptions = [
        GLOBAL_ROUTING,       // <- 新增代理模式入口以便应用层面也能做全局控制
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
            icon: ICONS.OFFICE
        }),
        createProxyGroup(AI_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: ICONS.AI
        }),
        createProxyGroup(GOOGLE_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: ICONS.GOOGLE
        }),
        createProxyGroup(MICROSOFT_SERVICE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: ICONS.MICROSOFT
        }),
        createProxyGroup(UNREAL_ENGINE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: serviceOptions,
            icon: ICONS.UNREAL
        }),
        createProxyGroup(AD_BLOCKING, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.SERVICE,
            proxies: ["REJECT", "DIRECT"],
            icon: ICONS.AD_BLOCK
        })
    ];
}

/**
 * 创建流量管理策略组（完整版）
 */
function createTrafficGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications) {
    const trafficOptions = [
        GLOBAL_ROUTING,         // <- 新增代理模式入口统一控制
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
            icon: ICONS.DOWNLOAD
        })
    ];
}

/**
 * 创建自定义规则策略组（完整版）
 */
function createCustomRuleGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications) {
    const customOptions = [
        GLOBAL_ROUTING,         // <- 新增代理模式入口统一控制
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
            icon: ICONS.CUSTOM_PROXY
        }),
        createProxyGroup(CUSTOM_DIRECT_RULE, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.CUSTOM,
            proxies: ["DIRECT", ...customOptions],
            icon: ICONS.CUSTOM_DIRECT
        })
    ];
}

/**
 * 创建默认路由策略组（完整版）
 */
function createDefaultRouteGroups(COUNTRY_REGIONS, availableRegions, hasResidential, hasLowRate, hasOtherProxies, hasNotifications) {
    const defaultOptions = [
        GLOBAL_ROUTING,         // <- 新增代理模式入口统一控制
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
            icon: ICONS.DOMESTIC
        }),
        createProxyGroup(GLOBAL_TRAFFIC, "select", {
            category: CONFIG_MANAGER.GROUP_CATEGORY.DEFAULT_ROUTE,
            proxies: defaultOptions,
            icon: ICONS.INTERNATIONAL
        })
    ];
}

// ===================== 规则配置模块 =====================
/**
 * 覆盖规则配置
 * 说明：配置规则匹配顺序和对应策略组
 * @param {Object} params - 配置参数对象
 */
function overwriteRules(params) {
    const customRules = [];
    const hasResidential = params.__hasResidential || false;
    const hasLowRate = params.__hasLowRate || false;
    
    const rules = [
        // 广告拦截规则
        `RULE-SET,Reject_no_ip,${AD_BLOCKING}`,
        `RULE-SET,Reject_domainset,${AD_BLOCKING}`,
        `RULE-SET,Reject_no_ip_drop,${AD_BLOCKING}`,
        `RULE-SET,Reject_no_ip_no_drop,${AD_BLOCKING}`,
        `RULE-SET,Reject_ip,${AD_BLOCKING}`,
        `RULE-SET,CustomRejectRules,${AD_BLOCKING}`,

        
        // 直连规则
        "GEOSITE,cn,DIRECT",
        "GEOIP,cn,DIRECT,no-resolve",
        `RULE-SET,Lan_ip,DIRECT`,
        `RULE-SET,Domestic_no_ip,DIRECT`,
        
        // 用户自定义规则
        ...customRules,
        
        // 应用规则集
        `RULE-SET,applications,${HIGH_TRAFFIC_CHANNEL}`,
        
        // 自定义规则集
        `RULE-SET,CustomProxyRules,${CUSTOM_PROXY_RULE}`,
        `RULE-SET,CustomDirectRules,${CUSTOM_DIRECT_RULE}`,
        
        // 服务专用规则
        `RULE-SET,Figma_ip,${OFFICE_MESSAGING}`,
        `RULE-SET,Notion_ip,${OFFICE_MESSAGING}`,
        `RULE-SET,Github,${OFFICE_MESSAGING}`,
        `RULE-SET,OneDrive,${OFFICE_MESSAGING}`,
        `RULE-SET,Dropbox,${OFFICE_MESSAGING}`,
        `RULE-SET,Telegram_ip,${OFFICE_MESSAGING}`,
        `RULE-SET,Telegram_no_ip,${OFFICE_MESSAGING}`,
        
        // AI服务规则集
        `RULE-SET,OpenAI,${AI_SERVICE}`,
        `RULE-SET,AI_no_ip,${AI_SERVICE}`,
        `RULE-SET,Gemini,${AI_SERVICE}`,
        `RULE-SET,YouTube,${GOOGLE_SERVICE}`,
        `RULE-SET,GoogleFCM_ip,${GOOGLE_SERVICE}`,
        `RULE-SET,Google,${GOOGLE_SERVICE}`,
        `RULE-SET,GoogleFCM_no_ip,${GOOGLE_SERVICE}`,
        `RULE-SET,Microsoft_no_ip,${MICROSOFT_SERVICE}`,
        
        // 下载通道
        `RULE-SET,MicrosoftCDN_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,CDN_domainset,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,CDN_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,Download_domainset,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,Download_no_ip,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,GameDownload,${HIGH_TRAFFIC_CHANNEL}`,
        `RULE-SET,Stream_ip,${HIGH_TRAFFIC_CHANNEL}`,
        
        // 虚幻引擎规则
        `RULE-SET,UnrealRules,${UNREAL_ENGINE}`,
        
        // 最终匹配规则
        `GEOIP,CN,${DOMESTIC_TRAFFIC}`,
        `MATCH,${GLOBAL_TRAFFIC}`
    ];
    
    params.rules = rules;
    params["rule-providers"] = createRuleProviders();
}

// ===================== 规则提供器配置 =====================
/**
 * 创建规则提供器配置
 * @return {Object} 规则提供器配置对象
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
        // 广告拦截规则集
        Reject_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/ip/Reject_ip.yaml",
            "./ruleset/toookamak/Reject_ip.yaml"
        ), // 引用：RULE-SET,Reject_ip -> 广告拦截 (AD_BLOCKING)
        Reject_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip.yaml", 
            "./ruleset/toookamak/Reject_no_ip.yaml"
        ), // 引用：RULE-SET,Reject_no_ip -> 广告拦截 (AD_BLOCKING)
        Reject_domainset: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_domainset.yaml",
            "./ruleset/toookamak/Reject_domainset.yaml"
        ), // 引用：RULE-SET,Reject_domainset -> 广告拦截 (AD_BLOCKING)
        Reject_no_ip_drop: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_drop.yaml",
            "./ruleset/toookamak/Reject_no_ip_drop.yaml"
        ), // 引用：RULE-SET,Reject_no_ip_drop -> 广告拦截 (AD_BLOCKING)
        Reject_no_ip_no_drop: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_no_drop.yaml",
            "./ruleset/toookamak/Reject_no_ip_no_drop.yaml"
        ), // 引用：RULE-SET,Reject_no_ip_no_drop -> 广告拦截 (AD_BLOCKING)
        
        // 直连规则集

        GoogleFCM_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/GoogleFCM_ip.yaml",
            "./ruleset/toookamak/GoogleFCM_ip.yaml"
        ), // 引用：RULE-SET,GoogleFCM_ip -> 谷歌服务 (GOOGLE_SERVICE)
        Lan_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Lan_ip.yaml",
            "./ruleset/toookamak/Lan_ip.yaml"
        ), // 直连引用
        SteamCN_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/SteamCN_ip.yaml",
            "./ruleset/toookamak/SteamCN_ip.yaml"
        ), // 未被 rules 引用
        Domestic_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Domestic_no_ip.yaml",
            "./ruleset/toookamak/Domestic_no_ip.yaml"
        ), // 直连引用
        GoogleFCM_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/GoogleFCM_no_ip.yaml",
            "./ruleset/toookamak/GoogleFCM_no_ip.yaml"
        ), // 引用：RULE-SET,GoogleFCM_no_ip -> 谷歌服务 (GOOGLE_SERVICE)
        MicrosoftCDN_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/MicrosoftCDN_no_ip.yaml",
            "./ruleset/toookamak/MicrosoftCDN_no_ip.yaml"
        ), // 引用：RULE-SET,MicrosoftCDN_no_ip -> 大流量通道 (HIGH_TRAFFIC_CHANNEL)
        
        // 代理规则集
        Stream_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Stream_ip.yaml",
            "./ruleset/toookamak/Stream_ip.yaml"
        ), // 下载通道引用
        Telegram_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Telegram_ip.yaml",
            "./ruleset/toookamak/Telegram_ip.yaml"
        ), // 引用：RULE-SET,Telegram_ip -> 办公通讯 (OFFICE_MESSAGING)
        AI_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/AI_no_ip.yaml",
            "./ruleset/toookamak/AI_no_ip.yaml"
        ), // 引用：RULE-SET,AI_no_ip -> AI服务 (AI_SERVICE)
        CDN_domainset: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_domainset.yaml",
            "./ruleset/toookamak/CDN_domainset.yaml"
        ), // 引用：RULE-SET,CDN_domainset -> 大流量通道 (HIGH_TRAFFIC_CHANNEL)
        CDN_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_no_ip.yaml",
            "./ruleset/toookamak/CDN_no_ip.yaml"
        ), // 引用：RULE-SET,CDN_no_ip -> 大流量通道 (HIGH_TRAFFIC_CHANNEL)
        Download_domainset: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_domainset.yaml",
            "./ruleset/toookamak/Download_domainset.yaml"
        ), // 引用：RULE-SET,Download_domainset -> 大流量通道 (HIGH_TRAFFIC_CHANNEL)
        Download_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_no_ip.yaml",
            "./ruleset/toookamak/Download_no_ip.yaml"
        ), // 引用：RULE-SET,Download_no_ip -> 大流量通道 (HIGH_TRAFFIC_CHANNEL)
        Microsoft_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Microsoft_no_ip.yaml",
            "./ruleset/toookamak/Microsoft_no_ip.yaml"
        ), // 引用：RULE-SET,Microsoft_no_ip -> 微软服务 (MICROSOFT_SERVICE)
        Telegram_no_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Telegram_no_ip.yaml",
            "./ruleset/toookamak/Telegram_no_ip.yaml"
        ), // 引用：RULE-SET,Telegram_no_ip -> 办公通讯 (OFFICE_MESSAGING)

        // 新增规则集
        Figma_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Figma/Figma.yaml",
            "./ruleset/toookamak/Figma_ip.yaml"
        ), // 引用：RULE-SET,Figma_ip -> 办公通讯 (OFFICE_MESSAGING)
        Notion_ip: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Notion/Notion.yaml",
            "./ruleset/toookamak/Notion_ip.yaml"
        ), // 引用：RULE-SET,Notion_ip -> 办公通讯 (OFFICE_MESSAGING)
        Github: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/GitHub/GitHub.yaml",
            "./ruleset/toookamak/Github.yaml"
        ), // 引用：RULE-SET,Github -> 办公通讯 (OFFICE_MESSAGING)
        OneDrive: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/OneDrive/OneDrive.yaml",
            "./ruleset/toookamak/OneDrive.yaml"
        ), // 引用：RULE-SET,OneDrive -> 办公通讯 (OFFICE_MESSAGING)
        YouTube: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/YouTube/YouTube.yaml",
            "./ruleset/toookamak/YouTube.yaml"
        ), // 引用：RULE-SET,YouTube -> 谷歌服务 (GOOGLE_SERVICE)
        Google: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Google/Google.yaml",
            "./ruleset/toookamak/Google.yaml"
        ), // 引用：RULE-SET,Google -> 谷歌服务 (GOOGLE_SERVICE)
        Gemini: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Gemini/Gemini.yaml",
            "./ruleset/toookamak/Gemini.yaml"
        ), // 引用：RULE-SET,Gemini -> AI服务 (AI_SERVICE)
        OpenAI: createRuleProviderConfig(   
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/OpenAI/OpenAI.yaml",
            "./ruleset/toookamak/OpenAI.yaml"
        ), // 引用：RULE-SET,OpenAI -> AI服务 (AI_SERVICE)
        GameDownload: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Game/GameDownload/GameDownload.yaml",
            "./ruleset/toookamak/GameDownload.yaml"
        ), // 引用：RULE-SET,GameDownload -> 大流量通道 (HIGH_TRAFFIC_CHANNEL)
        UnrealRules: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Epic/Epic.yaml",
            "./ruleset/toookamak/UnrealRules.yaml"
        ), // 引用：RULE-SET,UnrealRules -> 虚幻引擎 (UNREAL_ENGINE)
        Dropbox: createRuleProviderConfig(
            "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/Clash/Dropbox/Dropbox.yaml",
            "./ruleset/toookamak/Dropbox.yaml"
        ), // 引用：RULE-SET,Dropbox -> 办公通讯 (OFFICE_MESSAGING)

        // 自定义规则集
        CustomProxyRules: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
            url: CONFIG_MANAGER.CUSTOM_RULES.PROXY_URL,
            path: "./ruleset/toookamak/OwnPROXYRules.yaml"
        }, // 引用：RULE-SET,CustomProxyRules -> 自定义代理规则 (CUSTOM_PROXY_RULE)
        CustomDirectRules: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
            url: CONFIG_MANAGER.CUSTOM_RULES.DIRECT_URL,
            path: "./ruleset/toookamak/OwnDIRECTRules.yaml"
        }, // 引用：RULE-SET,CustomDirectRules -> 自定义直连规则 (CUSTOM_DIRECT_RULE)
        CustomRejectRules: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
            url: CONFIG_MANAGER.CUSTOM_RULES.REJECT_URL,
            path: "./ruleset/toookamak/OwnREJECTRules.yaml"
        }, // 拒绝连接

        // 应用规则集
        applications: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: CONFIG_MANAGER.UPDATE_INTERVALS.STATIC,
            url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/applications.txt",
            path: "./ruleset/toookamak/applications.yaml"
        } // 引用：RULE-SET,applications -> 大流量通道 (HIGH_TRAFFIC_CHANNEL)
    };
    
    CACHE.ruleProviders = providers;
    return providers;
}

// ===================== 辅助函数 =====================
/**
 * 创建代理组
 * @param {string} name - 策略组名称
 * @param {string} type - 策略组类型
 * @param {Object} options - 策略组选项
 * @return {Object} 策略组对象
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
    
    return Object.assign(base, options);
}

/**
 * 根据正则表达式获取代理节点
 * @param {Object} params - 配置参数对象
 * @param {RegExp} regex - 匹配正则表达式
 * @param {Array} fallback - 备选节点数组
 * @return {Array} 匹配的代理节点名称数组
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
 * @param {Object} params - 配置参数对象
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
          'https://1.1.1.1/dns-query',
          'https://223.5.5.5/dns-query'
        ],
        "nameserver-policy": {
            'geosite:private': 'system',
            'geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn': ['119.29.29.29', '223.5.5.5']
        }
    };
}

// ===================== TUN配置模块 =====================
/**
 * 覆盖TUN配置
 * @param {Object} params - 配置参数对象
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
