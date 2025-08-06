// FL_Clash_Rule_DIY.js - 策略组优化版
// 优化：直接使用完整规则URL，便于维护
// 特点：所有规则集使用完整URL，图标使用完整URL
// 版本：v7.2.0
// 最后更新：2024-01-20

// ===================== 全局配置常量 =====================
// 定义网络连通性测试URL
const TEST_URL = "http://www.gstatic.com/generate_204";
// 定义不同地区专用的测试URL，提高测试准确性
const REGION_TEST_URLS = {
    HK: "http://www.gstatic.com/generate_204",  // 香港测试点
    SG: "http://www.gstatic.com/generate_204",  // 新加坡测试点
    JP: "http://www.gstatic.com/generate_204",  // 日本测试点
    US: "http://www.gstatic.com/generate_204"   // 美国测试点
};

// ===================== 策略组分类常量 =====================
// 定义策略组的分类，用于后续排序和管理
const GROUP_CATEGORY = {
  CORE: "核心路由",           // 核心路由策略组
  REGION_ENTRY: "地区选择",    // 地区选择入口策略组
  REGION: "具体地区",         // 具体地区策略组
  LINE_TYPE: "线路特性",      // 线路特性策略组
  SERVICE: "服务专用",        // 服务专用策略组
  TRAFFIC: "流量管理",        // 流量管理策略组
  CUSTOM: "自定义规则",       // 自定义规则策略组
  DEFAULT_ROUTE: "默认路由"   // 默认路由策略组
};

// ===================== 策略组命名常量 =====================
// 定义所有策略组的标准化名称，便于统一管理和维护
const GLOBAL_ROUTING = "代理模式";                    // 核心代理模式入口
const MANUAL_REGION_SELECT = "手动选择 (地区)";       // 手动选择地区入口
const AUTO_REGION_SELECT = "自动选择 (地区)";         // 自动选择地区入口
const RESIDENTIAL_LINE = "家宽/原生线路";             // 家宽/原生IP线路
const LOW_RATE_NODE = "低倍率节点";                  // 低倍率优惠节点
const INSTANT_MESSAGING = "即时通讯";                // 即时通讯服务
const AI_SERVICE = "AI服务";                         // AI相关服务
const PLATFORM_SERVICE = "平台服务";                 // 平台类服务
const AD_BLOCKING = "广告拦截";                      // 广告拦截服务（包含跟踪器和程序化广告）
const TRACKING_BLOCKING = "拦截跟踪";                // 跟踪器拦截服务
const PROGRAMMATIC_ADS = "程序化广告";               // 程序化广告拦截服务
const HIGH_TRAFFIC_CHANNEL = "大流量通道";           // 大流量传输通道
const OFFICE_SERVICE = "网络办公";                   // 网络办公服务（包含OneDrive和GitHub）
const VIDEO_SERVICE = "视频服务";                    // 视频流媒体服务
const GOOGLE_SERVICE = "谷歌服务";                   // 谷歌相关服务
const MICROSOFT_SERVICE = "微软服务";                // 微软相关服务
const GITHUB_SERVICE = "GitHub服务";                // GitHub相关服务（已并入网络办公）
const ONEDRIVE_SERVICE = "OneDrive服务";            // OneDrive云存储服务（已并入网络办公）
const UNREAL_ENGINE = "虚幻引擎";                    // 虚幻引擎相关服务
const CUSTOM_PROXY_RULE = "自定义代理规则";          // 用户自定义代理规则
const CUSTOM_DIRECT_RULE = "自定义直连规则";         // 用户自定义直连规则
const DOMESTIC_TRAFFIC = "国内流量";                 // 国内网络流量
const GLOBAL_TRAFFIC = "国际流量";                   // 国际网络流量

// ===================== 图标库URL常量 =====================
// 使用Koolson/Qure图标库
const ICON_BASE_URL = "https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/";

// 定义各策略组对应的图标
const ICONS = {
    // 核心路由图标
    GLOBAL_ROUTING: ICON_BASE_URL + "Proxy.png",        // 代理模式
    MANUAL_REGION: ICON_BASE_URL + "Global.png",        // 手动选择
    AUTO_REGION: ICON_BASE_URL + "Auto.png",            // 自动选择
    SPEED_TEST: ICON_BASE_URL + "Speedtest.png",        // 延迟优选
    FAILOVER: ICON_BASE_URL + "Final.png",              // 故障转移
    LOAD_BALANCE: ICON_BASE_URL + "Balance.png",        // 负载均衡
    HOME_NETWORK: ICON_BASE_URL + "VIP.png",           // 家宽线路
    LOW_RATE: ICON_BASE_URL + "Speedtest.png",          // 低倍率节点
    
    // 地区图标
    HK: ICON_BASE_URL + "Hong_Kong.png",                // 香港
    SG: ICON_BASE_URL + "Singapore.png",                // 新加坡
    JP: ICON_BASE_URL + "Japan.png",                    // 日本
    US: ICON_BASE_URL + "United_States.png",            // 美国
    GLOBAL: ICON_BASE_URL + "World_Map.png",            // 全球/其他地区
    
    // 服务专用图标
    OFFICE: ICON_BASE_URL + "Notion.png",               // 网络办公
    TELEGRAM: ICON_BASE_URL + "Telegram.png",           // 即时通讯
    AI: ICON_BASE_URL + "ChatGPT.png",                  // AI服务
    CLOUD: ICON_BASE_URL + "Server.png",                 // 平台服务
    VIDEO: ICON_BASE_URL + "YouTube.png",               // 视频服务
    GOOGLE: ICON_BASE_URL + "Google_Search.png",        // 谷歌服务
    MICROSOFT: ICON_BASE_URL + "Microsoft.png",         // 微软服务
    UNREAL: ICON_BASE_URL + "Download.png",             // 虚幻引擎
    
    // 广告拦截图标
    AD_BLOCK: ICON_BASE_URL + "Advertising.png",        // 广告拦截
    TRACKING: ICON_BASE_URL + "Reject.png",             // 拦截跟踪
    PROGRAMMATIC_ADS: ICON_BASE_URL + "Advertising.png", // 程序化广告
    
    // 流量管理图标
    DOWNLOAD: ICON_BASE_URL + "Download.png",           // 大流量通道
    
    // 自定义规则图标
    CUSTOM_PROXY: ICON_BASE_URL + "Proxy.png",          // 自定义代理规则
    CUSTOM_DIRECT: ICON_BASE_URL + "Direct.png",        // 自定义直连规则
    
    // 默认路由图标
    DOMESTIC: ICON_BASE_URL + "StreamingCN.png",        // 国内流量
    INTERNATIONAL: ICON_BASE_URL + "Streaming!CN.png"   // 国际流量
};

// ===================== 自定义规则URL =====================
// 定义用户自定义规则的远程URL地址
const CUSTOM_PROXY_RULES_URL = "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnPROXYRules.list";
const CUSTOM_DIRECT_RULES_URL = "https://raw.githubusercontent.com/toookamak/FL_ruleSet/refs/heads/main/OwnRules/OwnDIRECTRules.list";

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
    
    // 返回处理完成的配置对象
    return params;
};

// ===================== 基础设置模块 =====================
/**
 * 覆盖基础配置选项
 * @param {Object} params - 配置参数对象
 */
function overwriteBasicOptions(params) {
    // 使用Object.assign合并配置，保留原有配置并覆盖指定项
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
 * @param {Object} params - 配置参数对象
 */
function overwriteSniffer(params) {
    // 设置流量嗅探器配置
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
 * @param {Object} params - 配置参数对象
 */
function overwriteProxyGroups(params) {
    // 地区配置（移除台湾），定义支持的地区及其匹配规则
    const COUNTRY_REGIONS = [
        { 
            code: "HK",                         // 地区代码
            name: "香港",                        // 地区名称
            icon: ICONS.HK,                     // 使用图标库中的香港图标
            regex: /(香港|HK|Hong Kong|🇭🇰)/i    // 匹配该地区的正则表达式
        },
        {
            code: "SG", 
            name: "新加坡",
            icon: ICONS.SG,                     // 使用图标库中的新加坡图标
            regex: /(新加坡|狮城|SG|Singapore|🇸🇬)/i
        },
        {
            code: "JP", 
            name: "日本",
            icon: ICONS.JP,                     // 使用图标库中的日本图标
            regex: /(日本|JP|Japan|🇯🇵)/i
        },
        {
            code: "US", 
            name: "美国",
            icon: ICONS.US,                     // 使用图标库中的美国图标
            regex: /(美国|US|USA|United States|America|🇺🇸)/i
        }
    ];

    // 获取有效代理，过滤掉包含特定关键词的节点
    const PROXY_REGEX = /^(?!.*(?:自动|故障|流量|官网|套餐|机场|订阅|年|月|失联|频道|Traffic|Expire)).*$/;
    const allProxies = getProxiesByRegex(params, PROXY_REGEX);  // 获取所有有效代理
    const availableRegions = new Set();                         // 存储可用地区
    
    // 节点过滤正则表达式，用于识别特殊类型节点
    const RESIDENTIAL_REGEX = /(家宽|原生|residential|home)/i;   // 家宽/原生线路匹配
    const LOW_RATE_REGEX = /(低倍率|lowrate|low-rate|倍率)/i;    // 低倍率节点匹配
    
    // 节点分类处理，识别各地区可用节点
    params.proxies.forEach(proxy => {
        // 查找代理节点所属地区
        const region = COUNTRY_REGIONS.find(r => r.regex.test(proxy.name));
        // 如果找到匹配地区，则将该地区添加到可用地区集合中
        region ? availableRegions.add(region.name) : null;
    });

    // 创建地区自动选择组，为每个可用地区创建自动测试选择组
    const autoGroups = COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))  // 筛选有可用节点的地区
        .map(region => createProxyGroup(
            `${region.name} · 自动选择`,            // 策略组名称
            "url-test",                             // 策略组类型为URL测试
            {
                category: GROUP_CATEGORY.REGION,    // 分类为具体地区
                url: REGION_TEST_URLS[region.code] || TEST_URL,  // 使用地区专用测试URL
                interval: 300,                      // 测试间隔300秒
                tolerance: 50,                      // 延迟容忍度50ms
                proxies: getProxiesByRegex(params, region.regex),  // 该地区的代理节点
                hidden: true                        // 隐藏该策略组
            }
        ))
        .filter(g => g.proxies.length > 0);         // 过滤掉没有节点的组

    // 创建地区手动选择组，为每个可用地区创建手动选择组
    const manualGroups = COUNTRY_REGIONS
        .filter(r => availableRegions.has(r.name))  // 筛选有可用节点的地区
        .map(region => createProxyGroup(
            `${region.name} · 手动选择`,            // 策略组名称
            "select",                               // 策略组类型为手动选择
            {
                category: GROUP_CATEGORY.REGION,    // 分类为具体地区
                proxies: getProxiesByRegex(params, region.regex),  // 该地区的代理节点
                icon: region.icon,                  // 使用图标库中的地区图标
                hidden: false                       // 不隐藏该策略组
            }
        ))
        .filter(g => g.proxies.length > 0);         // 过滤掉没有节点的组

    // 获取其他地区节点（不属于上述地区的节点）
    const otherProxies = params.proxies
        .filter(proxy => 
            // 过滤条件：不属于任何已定义地区 且 不是家宽线路 且 不是低倍率节点
            !COUNTRY_REGIONS.some(region => region.regex.test(proxy.name)) &&
            !RESIDENTIAL_REGEX.test(proxy.name) &&
            !LOW_RATE_REGEX.test(proxy.name)
        )
        .map(proxy => proxy.name);                  // 提取节点名称
    
    const hasOtherProxies = otherProxies.length > 0;  // 判断是否存在其他地区节点
    
    // 其他地区组（自动选择和手动选择）
    const otherAutoGroup = hasOtherProxies ? createProxyGroup(
        "其他地区 · 自动选择",                       // 自动选择其他地区节点
        "url-test", 
        {
            category: GROUP_CATEGORY.REGION,
            url: TEST_URL,                          // 使用默认测试URL
            interval: 300,
            tolerance: 50,
            proxies: otherProxies,                  // 其他地区代理节点
            hidden: true
        }
    ) : null;
    
    const otherManualGroup = hasOtherProxies ? createProxyGroup(
        "其他地区 · 手动选择",                       // 手动选择其他地区节点
        "select", 
        {
            category: GROUP_CATEGORY.REGION,
            proxies: otherProxies,
            icon: ICONS.GLOBAL,                     // 使用图标库中的全球图标
            hidden: false
        }
    ) : null;

    // 获取家宽/原生节点
    const residentialProxies = getProxiesByRegex(params, RESIDENTIAL_REGEX);
    const hasResidential = residentialProxies.length > 0;  // 判断是否存在家宽节点
    
    // 获取低倍率节点
    const lowRateProxies = getProxiesByRegex(params, LOW_RATE_REGEX);
    const hasLowRate = lowRateProxies.length > 0;          // 判断是否存在低倍率节点
    
    // ===== 基础选项数组（避免循环引用）=====
    // 定义基础代理选项，避免策略组间的循环引用问题
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

    // ===== 核心路由策略组 =====
    // 核心路由策略组定义，作为整个配置的核心入口
    const coreGroups = [
        // 代理模式 - 总入口策略组
        createProxyGroup(GLOBAL_ROUTING, "select", {
            category: GROUP_CATEGORY.CORE,          // 核心路由分类
            proxies: [
                ...baseOptions,                     // 基础选项
                MANUAL_REGION_SELECT,               // 手动选择地区入口
                AUTO_REGION_SELECT                  // 自动选择地区入口
            ],
            icon: ICONS.GLOBAL_ROUTING              // 使用图标库中的代理模式图标
        }),
        
        // 延迟优选 - 根据延迟自动选择最优节点
        createProxyGroup("延迟优选", "url-test", {
            category: GROUP_CATEGORY.CORE,
            "exclude-filter": "自动选择|手动选择",    // 排除自动和手动选择组
            proxies: allProxies.length ? allProxies : ["DIRECT"],  // 所有代理或直连
            icon: ICONS.SPEED_TEST,                 // 使用图标库中的速度测试图标
            hidden: true                            // 隐藏该组
        }),
        
        // 故障转移 - 当主节点故障时自动切换到备选节点
        createProxyGroup("故障转移", "fallback", {
            category: GROUP_CATEGORY.CORE,
            "exclude-filter": "自动选择|手动选择",    // 排除自动和手动选择组
            proxies: allProxies.length ? allProxies : ["DIRECT"],  // 所有代理或直连
            icon: ICONS.FAILOVER,                   // 使用图标库中的故障转移图标
            hidden: true                            // 隐藏该组
        }),
        
        // 负载均衡 - 散列模式
        createProxyGroup("负载均衡 · 散列", "load-balance", {
            category: GROUP_CATEGORY.CORE,
            strategy: "consistent-hashing",         // 一致性哈希策略
            "exclude-filter": "自动选择|手动选择",    // 排除自动和手动选择组
            proxies: allProxies.length ? allProxies : ["DIRECT"],  // 所有代理或直连
            icon: ICONS.LOAD_BALANCE,               // 使用图标库中的负载均衡图标
            hidden: true                            // 隐藏该组
        }),
        
        // 负载均衡 - 轮询模式
        createProxyGroup("负载均衡 · 轮询", "load-balance", {
            category: GROUP_CATEGORY.CORE,
            strategy: "round-robin",                // 轮询策略
            "exclude-filter": "自动选择|手动选择",    // 排除自动和手动选择组
            proxies: allProxies.length ? allProxies : ["DIRECT"],  // 所有代理或直连
            icon: ICONS.LOAD_BALANCE,               // 使用图标库中的负载均衡图标
            hidden: true                            // 隐藏该组
        })
    ];

    // ===== 地区选择入口组 =====
    // 地区选择入口策略组，提供用户选择地区的统一入口
    const regionEntryGroups = [
        // 手动选择入口 - 用户手动选择具体地区的入口
        createProxyGroup(MANUAL_REGION_SELECT, "select", {
            category: GROUP_CATEGORY.REGION_ENTRY,  // 地区选择分类
            proxies: [
                ...manualGroups.map(g => g.name),   // 所有地区手动选择组
                ...(hasOtherProxies ? ["其他地区 · 手动选择"] : [])  // 其他地区手动选择（如果存在）
            ],
            icon: ICONS.MANUAL_REGION               // 使用图标库中的手动选择图标
        }),
        
        // 自动选择入口 - 系统自动选择最优地区的入口
        createProxyGroup(AUTO_REGION_SELECT, "select", {
            category: GROUP_CATEGORY.REGION_ENTRY,  // 地区选择分类
            proxies: [
                ...autoGroups.map(g => g.name),     // 所有地区自动选择组
                ...(hasOtherProxies ? ["其他地区 · 自动选择"] : [])  // 其他地区自动选择（如果存在）
            ],
            icon: ICONS.AUTO_REGION                 // 使用图标库中的自动选择图标
        })
    ];

    // ===== 地区自动选择组 =====
    // 具体地区的自动选择策略组
    const autoSelectGroups = autoGroups;
    
    // ===== 地区手动选择组 =====
    // 具体地区的手动选择策略组
    const manualSelectGroups = manualGroups;
    
    // ===== 线路特性策略组 =====
    // 特殊线路类型策略组
    const lineTypeGroups = [
        // 家宽/原生线路 - 提供更稳定、真实的IP线路
        hasResidential ? createProxyGroup(RESIDENTIAL_LINE, "select", {
            category: GROUP_CATEGORY.LINE_TYPE,     // 线路特性分类
            icon: ICONS.HOME_NETWORK,               // 使用图标库中的家庭网络图标
            proxies: residentialProxies,            // 家宽线路节点
            hidden: false                           // 不隐藏该组
        }) : null,
        
        // 低倍率节点 - 提供更经济的流量使用方案
        hasLowRate ? createProxyGroup(LOW_RATE_NODE, "select", {
            category: GROUP_CATEGORY.LINE_TYPE,     // 线路特性分类
            icon: ICONS.LOW_RATE,                   // 使用图标库中的低倍率图标
            proxies: lowRateProxies,                // 低倍率节点
            hidden: false                           // 不隐藏该组
        }) : null
    ].filter(Boolean);  // 过滤掉null值

    // ===== 服务专用策略组 =====
    // 针对特定服务优化的策略组
    const serviceGroups = [
        // 网络办公服务 - 为办公场景优化的路由策略（包含OneDrive和GitHub）
        createProxyGroup(OFFICE_SERVICE, "select", {
            category: GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: [GLOBAL_ROUTING, ...baseOptions, MANUAL_REGION_SELECT],  // 代理模式优先
            icon: ICONS.OFFICE                      // 使用图标库中的Office图标
        }),
        
        // 即时通讯 - 为即时通讯应用优化的路由
        createProxyGroup(INSTANT_MESSAGING, "select", {
            category: GROUP_CATEGORY.SERVICE,       // 服务专用分类
            proxies: [GLOBAL_ROUTING, ...baseOptions, MANUAL_REGION_SELECT],  // 代理模式优先
            icon: ICONS.TELEGRAM                    // 使用图标库中的Telegram图标
        }),
        
        // AI服务 - 为AI相关服务优化的路由
        createProxyGroup(AI_SERVICE, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: [GLOBAL_ROUTING, ...baseOptions, MANUAL_REGION_SELECT],  // 代理模式优先
            icon: ICONS.AI                          // 使用图标库中的AI图标
        }),
        
        // 平台服务 - 为各类平台服务优化的路由
        createProxyGroup(PLATFORM_SERVICE, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: [GLOBAL_ROUTING, ...baseOptions, MANUAL_REGION_SELECT],  // 代理模式优先
            icon: ICONS.CLOUD                       // 使用图标库中的云服务图标
        }),
        
        // 视频服务 - 为视频流媒体优化的路由
        createProxyGroup(VIDEO_SERVICE, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: [GLOBAL_ROUTING, ...baseOptions, MANUAL_REGION_SELECT],  // 代理模式优先
            icon: ICONS.VIDEO                       // 使用图标库中的视频图标
        }),
        
        // 谷歌服务 - 为谷歌相关服务优化的路由
        createProxyGroup(GOOGLE_SERVICE, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: [GLOBAL_ROUTING, ...baseOptions, MANUAL_REGION_SELECT],  // 代理模式优先
            icon: ICONS.GOOGLE                      // 使用图标库中的Google图标
        }),
        
        // 微软服务 - 为微软相关服务优化的路由
        createProxyGroup(MICROSOFT_SERVICE, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: [GLOBAL_ROUTING, ...baseOptions, MANUAL_REGION_SELECT],  // 代理模式优先
            icon: ICONS.MICROSOFT                   // 使用图标库中的Microsoft图标
        }),
        
        // 虚幻引擎 - 为虚幻引擎相关服务优化的路由
        createProxyGroup(UNREAL_ENGINE, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: [GLOBAL_ROUTING, ...baseOptions, MANUAL_REGION_SELECT],  // 代理模式优先
            icon: ICONS.UNREAL                      // 使用图标库中的虚幻引擎图标
        }),
        
        // 广告拦截 - 广告和跟踪内容的拦截策略（包含跟踪器和程序化广告）
        createProxyGroup(AD_BLOCKING, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: ["REJECT", "DIRECT"],          // 优先拒绝，备选直连
            icon: ICONS.AD_BLOCK                    // 使用图标库中的广告拦截图标
        }),
        
        // 拦截跟踪 - 专门用于拦截用户跟踪器
        createProxyGroup(TRACKING_BLOCKING, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: ["REJECT", "DIRECT"],          // 优先拒绝，备选直连
            icon: ICONS.TRACKING                    // 使用图标库中的跟踪器图标
        }),
        
        // 程序化广告 - 专门用于拦截程序化广告
        createProxyGroup(PROGRAMMATIC_ADS, "select", {
            category: GROUP_CATEGORY.SERVICE,
            proxies: ["REJECT", "DIRECT"],          // 优先拒绝，备选直连
            icon: ICONS.PROGRAMMATIC_ADS            // 使用图标库中的程序化广告图标
        })
    ];

    // ===== 流量管理策略组 =====
    // 流量管理相关的策略组
    const trafficGroups = [
        // 大流量通道 - 专门为大流量传输优化的通道
        createProxyGroup(HIGH_TRAFFIC_CHANNEL, "select", {
            category: GROUP_CATEGORY.TRAFFIC,       // 流量管理分类
            proxies: ["DIRECT", ...baseOptions, MANUAL_REGION_SELECT],  // 直连优先
            icon: ICONS.DOWNLOAD                    // 使用图标库中的下载图标
        })
    ];

    // ===== 自定义规则策略组 =====
    // 用户自定义规则的策略组
    const customRuleGroups = [
        // 自定义代理规则 - 用户自定义需要代理的规则
        createProxyGroup(CUSTOM_PROXY_RULE, "select", {
            category: GROUP_CATEGORY.CUSTOM,        // 自定义规则分类
            proxies: [GLOBAL_ROUTING, ...baseOptions, MANUAL_REGION_SELECT],  // 代理模式优先
            icon: ICONS.CUSTOM_PROXY                // 使用图标库中的自定义代理图标
        }),
        
        // 自定义直连规则 - 用户自定义需要直连的规则
        createProxyGroup(CUSTOM_DIRECT_RULE, "select", {
            category: GROUP_CATEGORY.CUSTOM,
            proxies: ["DIRECT", ...baseOptions, MANUAL_REGION_SELECT],  // 直连优先
            icon: ICONS.CUSTOM_DIRECT               // 使用图标库中的自定义直连图标
        })
    ];

    // ===== 默认路由策略组 =====
    // 最终默认路由策略组
    const defaultRouteGroups = [
        // 国内流量 - 国内网络流量的默认路由
        createProxyGroup(DOMESTIC_TRAFFIC, "select", {
            category: GROUP_CATEGORY.DEFAULT_ROUTE, // 默认路由分类
            proxies: ["DIRECT", "REJECT", MANUAL_REGION_SELECT],  // 直连优先，避免循环嵌套
            icon: ICONS.DOMESTIC                    // 使用图标库中的中国图标
        }),
        
        // 国际流量 - 国际网络流量的默认路由
        createProxyGroup(GLOBAL_TRAFFIC, "select", {
            category: GROUP_CATEGORY.DEFAULT_ROUTE,
            proxies: [GLOBAL_ROUTING, ...baseOptions, MANUAL_REGION_SELECT],  // 代理模式优先
            icon: ICONS.INTERNATIONAL               // 使用图标库中的全球图标
        })
    ];

    // ===== 合并所有代理组 =====
    // 将所有策略组合并到配置中
    params["proxy-groups"] = [
        ...coreGroups,              // 核心路由组
        ...regionEntryGroups,       // 地区选择入口组
        ...manualSelectGroups,      // 地区手动选择组
        ...autoSelectGroups,        // 地区自动选择组
        ...(otherManualGroup ? [otherManualGroup] : []),  // 其他地区手动选择组
        ...(otherAutoGroup ? [otherAutoGroup] : []),      // 其他地区自动选择组
        ...lineTypeGroups,          // 线路特性组
        ...serviceGroups,           // 服务专用组
        ...trafficGroups,           // 流量管理组
        ...customRuleGroups,        // 自定义规则组
        ...defaultRouteGroups       // 默认路由组
    ];
    
    // 按分类排序，确保策略组按逻辑顺序排列
    params["proxy-groups"].sort((a, b) => {
        const order = Object.values(GROUP_CATEGORY);  // 获取分类顺序
        return order.indexOf(a.category) - order.indexOf(b.category);  // 按分类排序
    });
    
    // 存储策略组状态，供后续规则使用
    params.__hasResidential = hasResidential;
    params.__hasLowRate = hasLowRate;
}

// ===================== 规则配置模块 =====================
/**
 * 覆盖规则配置
 * @param {Object} params - 配置参数对象
 */
function overwriteRules(params) {
    // $$$$ 自定义规则添加区域 $$$$
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
        // === 广告拦截规则 ===
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
        
        // === 跟踪器拦截规则 ===
        // 跟踪器IP拦截规则
        `RULE-SET,Tracking_ip,${TRACKING_BLOCKING}`,
        // 跟踪器域名拦截规则
        `RULE-SET,Tracking_domainset,${TRACKING_BLOCKING}`,
        // 跟踪器无IP拦截规则
        `RULE-SET,Tracking_no_ip,${TRACKING_BLOCKING}`,
        
        // === 程序化广告拦截规则 ===
        // 程序化广告IP拦截规则（并入广告拦截策略组）
        `RULE-SET,ProgrammaticAds_ip,${AD_BLOCKING}`,
        // 程序化广告域名拦截规则（并入广告拦截策略组）
        `RULE-SET,ProgrammaticAds_domainset,${AD_BLOCKING}`,
        // 程序化广告无IP拦截规则（并入广告拦截策略组）
        `RULE-SET,ProgrammaticAds_no_ip,${AD_BLOCKING}`,
        
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
        // OneDrive服务规则（并入网络办公）
        `GEOSITE,onedrive,${OFFICE_SERVICE}`,
        // GitHub服务规则（并入网络办公）
        `GEOSITE,github,${OFFICE_SERVICE}`,
        // Grazie AI服务规则
        "DOMAIN-SUFFIX,grazie.ai,AI服务",
        // Grazie AWS服务规则
        "DOMAIN-SUFFIX,grazie.aws.intellij.net,AI服务",
        // AI服务规则集
        `RULE-SET,ai,${AI_SERVICE}`,
        // YouTube视频服务规则
        `GEOSITE,youtube,${VIDEO_SERVICE}`,
        // Telegram即时通讯IP规则
        `GEOIP,telegram,${INSTANT_MESSAGING}`,
        // 谷歌服务规则
        `GEOSITE,google,${GOOGLE_SERVICE}`,
        // 国内微软服务规则
        `GEOSITE,microsoft@cn,${DOMESTIC_TRAFFIC}`,
        // 国际微软服务规则
        `GEOSITE,microsoft,${MICROSOFT_SERVICE}`,
        // Epic游戏下载规则
        `RULE-SET,epicDownload,${HIGH_TRAFFIC_CHANNEL}`,
        // 虚幻引擎规则
        `RULE-SET,UnrealRules,${UNREAL_ENGINE}`,
        
        // === 基础路由规则 ===
        // 私有网络直连规则
        "GEOSITE,private,DIRECT",
        // 私有IP直连规则（不解析）
        "GEOIP,private,DIRECT,no-resolve",
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
 * @return {Object} 规则提供器配置对象
 */
function createRuleProviders() {
    // 返回规则提供器配置对象
    return {
        // === 广告拦截规则集 ===
        // 基于IP的广告拦截规则
        Reject_ip: {
            type: "http",                           // HTTP类型规则集
            behavior: "classical",                  // 经典规则行为
            format: "yaml",                         // YAML格式
            interval: 1800,                         // 30分钟更新间隔
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/ip/Reject_ip.yaml",  // 规则URL
            path: "./ruleset/toookamak/Reject_ip.yaml"  // 本地存储路径
        },
        // 无IP的广告拦截规则
        Reject_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip.yaml",
            path: "./ruleset/toookamak/Reject_no_ip.yaml"
        },
        // 域名集广告拦截规则
        Reject_domainset: {
            type: "http",
            behavior: "domain",                     // 域名规则行为
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_domainset.yaml",
            path: "./ruleset/toookamak/Reject_domainset.yaml"
        },
        // 需要丢弃的无IP广告拦截规则
        Reject_no_ip_drop: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_drop.yaml",
            path: "./ruleset/toookamak/Reject_no_ip_drop.yaml"
        },
        // 不需要丢弃的无IP广告拦截规则
        Reject_no_ip_no_drop: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Reject_no_ip_no_drop.yaml",
            path: "./ruleset/toookamak/Reject_no_ip_no_drop.yaml"
        },
        
        // === 跟踪器拦截规则集 ===
        // 跟踪器IP拦截规则
        Tracking_ip: {
            type: "http",
            behavior: "ipcidr",                     // IP CIDR规则行为
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/ip/Tracking_ip.yaml",
            path: "./ruleset/toookamak/Tracking_ip.yaml"
        },
        // 跟踪器域名集拦截规则
        Tracking_domainset: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Tracking_domainset.yaml",
            path: "./ruleset/toookamak/Tracking_domainset.yaml"
        },
        // 跟踪器无IP拦截规则
        Tracking_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/Tracking_no_ip.yaml",
            path: "./ruleset/toookamak/Tracking_no_ip.yaml"
        },
        
        // === 程序化广告拦截规则集 ===
        // 程序化广告IP拦截规则
        ProgrammaticAds_ip: {
            type: "http",
            behavior: "ipcidr",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/ip/ProgrammaticAds_ip.yaml",
            path: "./ruleset/toookamak/ProgrammaticAds_ip.yaml"
        },
        // 程序化广告域名集拦截规则
        ProgrammaticAds_domainset: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/ProgrammaticAds_domainset.yaml",
            path: "./ruleset/toookamak/ProgrammaticAds_domainset.yaml"
        },
        // 程序化广告无IP拦截规则
        ProgrammaticAds_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/REJECT/no_ip/ProgrammaticAds_no_ip.yaml",
            path: "./ruleset/toookamak/ProgrammaticAds_no_ip.yaml"
        },
        
        // === 直连规则集 ===
        // 中国IP直连规则
        China_ip: {
            type: "http",
            behavior: "ipcidr",                     // IP CIDR规则行为
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/China_ip.yaml",
            path: "./ruleset/toookamak/China_ip.yaml"
        },
        // 国内IP直连规则
        Domestic_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Domestic_ip.yaml",
            path: "./ruleset/toookamak/Domestic_ip.yaml"
        },
        // Google FCM IP直连规则
        GoogleFCM_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/GoogleFCM_ip.yaml",
            path: "./ruleset/toookamak/GoogleFCM_ip.yaml"
        },
        // 局域网IP直连规则
        Lan_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/Lan_ip.yaml",
            path: "./ruleset/toookamak/Lan_ip.yaml"
        },
        // 网易音乐IP直连规则
        NetEaseMusic_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/NetEaseMusic_ip.yaml",
            path: "./ruleset/toookamak/NetEaseMusic_ip.yaml"
        },
        // 国内Steam IP直连规则
        SteamCN_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/ip/SteamCN_ip.yaml",
            path: "./ruleset/toookamak/SteamCN_ip.yaml"
        },
        // Apple CDN无IP直连规则
        AppleCDN_no_ip: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/AppleCDN_no_ip.yaml",
            path: "./ruleset/toookamak/AppleCDN_no_ip.yaml"
        },
        // 国内Apple无IP直连规则
        AppleCN_no_ip: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/AppleCN_no_ip.yaml",
            path: "./ruleset/toookamak/AppleCN_no_ip.yaml"
        },
        // 通用直连无IP规则
        Direct_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Direct_no_ip.yaml",
            path: "./ruleset/toookamak/Direct_no_ip.yaml"
        },
        // 国内无IP直连规则
        Domestic_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Domestic_no_ip.yaml",
            path: "./ruleset/toookamak/Domestic_no_ip.yaml"
        },
        // Google FCM无IP直连规则
        GoogleFCM_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/GoogleFCM_no_ip.yaml",
            path: "./ruleset/toookamak/GoogleFCM_no_ip.yaml"
        },
        // 局域网无IP直连规则
        Lan_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/Lan_no_ip.yaml",
            path: "./ruleset/toookamak/Lan_no_ip.yaml"
        },
        // 微软CDN无IP直连规则
        MicrosoftCDN_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/MicrosoftCDN_no_ip.yaml",
            path: "./ruleset/toookamak/MicrosoftCDN_no_ip.yaml"
        },
        // 网易音乐无IP直连规则
        NetEaseMusic_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/NetEaseMusic_no_ip.yaml",
            path: "./ruleset/toookamak/NetEaseMusic_no_ip.yaml"
        },
        // 国内Steam无IP直连规则
        SteamCN_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/SteamCN_no_ip.yaml",
            path: "./ruleset/toookamak/SteamCN_no_ip.yaml"
        },
        // Steam地区无IP直连规则
        SteamRegion_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/DIRECT/no_ip/SteamRegion_no_ip.yaml",
            path: "./ruleset/toookamak/SteamRegion_no_ip.yaml"
        },
        
        // === 代理规则集 ===
        // 流媒体IP代理规则
        Stream_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Stream_ip.yaml",
            path: "./ruleset/toookamak/Stream_ip.yaml"
        },
        // Telegram IP代理规则
        Telegram_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/Telegram_ip.yaml",
            path: "./ruleset/toookamak/Telegram_ip.yaml"
        },
        // AI无IP代理规则
        AI_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/AI_no_ip.yaml",
            path: "./ruleset/toookamak/AI_no_ip.yaml"
        },
        // Apple无IP代理规则
        Apple_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Apple_no_ip.yaml",
            path: "./ruleset/toookamak/Apple_no_ip.yaml"
        },
        // CDN域名集代理规则
        CDN_domainset: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_domainset.yaml",
            path: "./ruleset/toookamak/CDN_domainset.yaml"
        },
        // CDN无IP代理规则
        CDN_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CDN_no_ip.yaml",
            path: "./ruleset/toookamak/CDN_no_ip.yaml"
        },
        // 自定义代理无IP规则
        CustomProxy_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/CustomProxy_no_ip.yaml",
            path: "./ruleset/toookamak/CustomProxy_no_ip.yaml"
        },
        // 下载域名集代理规则
        Download_domainset: {
            type: "http",
            behavior: "domain",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_domainset.yaml",
            path: "./ruleset/toookamak/Download_domainset.yaml"
        },
        // 下载无IP代理规则
        Download_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Download_no_ip.yaml",
            path: "./ruleset/toookamak/Download_no_ip.yaml"
        },
        // 全球无IP代理规则
        Global_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Global_no_ip.yaml",
            path: "./ruleset/toookamak/Global_no_ip.yaml"
        },
        // 微软无IP代理规则
        Microsoft_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Microsoft_no_ip.yaml",
            path: "./ruleset/toookamak/Microsoft_no_ip.yaml"
        },
        // Steam无IP代理规则
        Steam_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Steam_no_ip.yaml",
            path: "./ruleset/toookamak/Steam_no_ip.yaml"
        },
        // Telegram无IP代理规则
        Telegram_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Telegram_no_ip.yaml",
            path: "./ruleset/toookamak/Telegram_no_ip.yaml"
        },
        // 更新无IP代理规则
        Update_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Update_no_ip.yaml",
            path: "./ruleset/toookamak/Update_no_ip.yaml"
        },
        // Steam地区IP代理规则
        SteamRegion_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/ip/SteamRegion_ip.yaml",
            path: "./ruleset/toookamak/SteamRegion_ip.yaml"
        },
        
        // === 新增规则集 ===
        // Office无IP代理规则
        Office_no_ip: {
            type: "http",
            behavior: "classical",
            format: "yaml",
            interval: 1800,
            url: "https://raw.githubusercontent.com/RealSeek/Clash_Rule_DIY/refs/heads/mihomo/PROXY/no_ip/Office_no_ip.yaml",
            path: "./ruleset/toookamak/Office_no_ip.yaml"
        },
        
        // === 新增 Figma 规则集 ===
        // Figma IP代理规则
        Figma_ip: {
            type: "http",
            behavior: "ipcidr",
            format: "text",
            interval: 86400,  // 24小时更新间隔
            url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/privateip.txt",  // Figma规则URL
            path: "./ruleset/toookamak/Figma_ip.list"
        },
        
        // === 自定义规则集 ===
        // 用户自定义代理规则
        CustomProxyRules: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: 86400,
            url: CUSTOM_PROXY_RULES_URL,  // 自定义代理规则URL
            path: "./ruleset/toookamak/OwnPROXYRules.yaml"
        },
        // 用户自定义直连规则
        CustomDirectRules: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: 86400,
            url: CUSTOM_DIRECT_RULES_URL,  // 自定义直连规则URL
            path: "./ruleset/toookamak/OwnDIRECTRules.yaml"
        },
        
        // === 应用规则集 ===
        // 应用程序规则集
        applications: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: 86400,
            url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/applications.txt",  // 应用规则URL
            path: "./ruleset/toookamak/applications.yaml"
        },
        
        // === Epic下载规则集 ===
        // Epic游戏下载规则集
        epicDownload: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: 86400,
            url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/epic.txt",  // Epic下载规则URL
            path: "./ruleset/toookamak/epicDownload.yaml"
        },
        
        // === 虚幻引擎规则集 ===
        // 虚幻引擎规则集
        UnrealRules: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: 86400,
            url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/unreal.txt",  // 虚幻引擎规则URL
            path: "./ruleset/toookamak/UnrealRules.yaml"
        },
        
        // === AI规则集 ===
        // AI服务规则集
        ai: {
            type: "http",
            behavior: "classical",
            format: "text",
            interval: 86400,
            url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/ai.txt",  // AI规则URL
            path: "./ruleset/toookamak/ai.yaml"
        }
    };
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
    // 创建基础策略组对象
    const base = { 
        name,                                       // 策略组名称
        type,                                       // 策略组类型
        category: options.category || "未分类",      // 策略组分类
        url: type !== "select" ? TEST_URL : undefined,  // 测试URL（非选择类型）
        interval: type !== "select" ? 300 : undefined   // 测试间隔（非选择类型）
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
 * 创建自定义策略组
 * @param {string} name - 策略组名称
 * @param {string} icon - 策略组图标URL
 * @param {Array} proxies - 代理节点数组
 * @param {string} category - 策略组分类
 * @return {Object} 策略组对象
 */
function createCustomGroup(name, icon, proxies, category) {
    // 返回自定义策略组对象
    return {
        name,                                       // 策略组名称
        type: "select",                             // 策略组类型为选择类型
        category: category || "未分类",              // 策略组分类
        icon: icon,                                 // 策略组图标
        proxies: [...proxies],                      // 代理节点数组
        hidden: false                               // 不隐藏该策略组
    };
}

/**
 * 根据正则表达式获取代理节点
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
