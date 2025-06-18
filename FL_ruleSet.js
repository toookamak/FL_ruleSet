/*** 
 * Clash Verge Rev 全局扩展脚本（懒人配置）/ Mihomo Party 覆写脚本
 * URL: https://github.com/dahaha-365/YaNet/
 * https://github.com/toookamak/FL_ruleSet
 * 
 * 本脚本用于自动生成Clash/Mihomo配置，提供强大的分流功能和节点管理
 * 主要功能：
 * 1. 按地区自动分组代理节点
 * 2. 支持多种服务分流（如苹果服务、谷歌服务等）
 * 3. 提供手动选择策略组
 * 4. 智能DNS配置
 * 5. 广告过滤和隐私保护
 */

/**
 * 总开关 - 控制整个脚本是否启用
 * true = 启用脚本功能
 * false = 禁用脚本功能（直接返回原始配置）
 */
const enable = true;

/**
 * 分流规则配置 - 控制各种服务的分流策略
 * 遵循"最小，可用"原则，禁用不需要的规则提高效率
 * true = 启用该服务的分流
 * false = 禁用该服务的分流
 */
const ruleOptions = {
  // 开启的服务
  apple: true,         // 苹果服务
  microsoft: true,     // 微软服务
  github: true,        // Github服务
  google: true,        // Google服务
  openai: true,        // 国外AI和GPT
  notion: true,        // Notion
  Onedrive: true,      // OneDrive
  GameStore: true,     // 游戏平台
  epicDownload: true,  // Epic下载
  youtube: true,       // YouTube
  telegram: true,      // Telegram
  tracker: true,       // 网络跟踪
  BanAD: true,         // 广告拦截
  BanProgramAD: true,  // 应用净化
  
  // 关闭的服务（按需启用）
  spotify: false,      // Spotify
  bahamut: false,      // 巴哈姆特/动画疯
  netflix: false,      // Netflix网飞
  tiktok: false,       // 国际版抖音
  disney: false,       // 迪士尼
  pixiv: false,        // Pixiv
  hbo: false,          // HBO
  biliintl: false,     // 哔哩哔哩东南亚
  tvb: false,          // TVB
  hulu: false,         // Hulu
  primevideo: false,   // 亚马逊prime video
  line: false,         // Line通讯软件
  whatsapp: false,     // Whatsapp
  games: false,        // 游戏策略组
  japan: false,        // 日本网站策略组
};

/**
 * 前置规则 - 优先处理的规则
 * 可添加需要前置处理的自定义规则
 */
const rules = [
  'RULE-SET,applications,下载软件',  // 应用下载规则集
  'PROCESS-NAME,SunloginClient,DIRECT',      // 向日葵客户端直连
  'PROCESS-NAME,SunloginClient.exe,DIRECT',  // Windows版向日葵直连
  'PROCESS-NAME,AnyDesk,DIRECT',             // AnyDesk直连
  'PROCESS-NAME,AnyDesk.exe,DIRECT',         // Windows版AnyDesk直连
];

/**
 * 地区节点配置 - 按节点名称自动分组
 * regex: 用于匹配节点名称的正则表达式
 * ratioLimit: 允许的最大倍率（过滤高倍率节点）
 * icon: 策略组图标URL
 */
const regionOptions = {
  excludeHighPercentage: true,  // 是否排除高倍率节点
  regions: [
    {
      name: 'HK香港',
      regex: /港|🇭🇰|hk|hongkong|hong kong/i,
      ratioLimit: 2,  // 最大允许2倍率
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Hong_Kong.png',
    },
    {
      name: 'US美国',
      regex: /美|🇺🇸|us|united state|america/i,
      ratioLimit: 2,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/United_States.png',
    },
    {
      name: 'JP日本',
      regex: /日本|🇯🇵|jp|japan/i,
      ratioLimit: 2,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Japan.png',
    },
    {
      name: 'SG新加坡',
      regex: /新加坡|🇸🇬|sg|singapore/i,
      ratioLimit: 2,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Singapore.png',
    },
    {
      name: 'TW台湾省',
      regex: /台湾|🇹🇼|tw|taiwan|tai wan/i,
      ratioLimit: 2,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/China.png',
    },
    // 新增原生IP/家宽线路
    {
      name: '原生IP/家宽',
      regex: /原生|家宽|住宅|home|residential/i,
      ratioLimit: 100, // 高倍率限制确保不会被过滤
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Home.png',
    },
    // 新增低倍率线路
    {
      name: '低倍率',
      regex: /低倍率|0\.2|0.5|ratio|倍率低/i,
      ratioLimit: 0.2, // 设置低倍率阈值
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Speedtest.png',
    },
  ],
};

/**
 * DNS配置
 * 国内流量使用国内DNS，国外流量使用国外DNS
 * 两组DNS足够使用，避免过多DNS降低效率
 */
const defaultDNS = ['tls://223.5.5.5'];  // 默认DNS
const chinaDNS = ['119.29.29.29', '223.5.5.5'];  // 国内DNS
const foreignDNS = ['https://120.53.53.53/dns-query', 'https://223.5.5.5/dns-query'];  // 国外DNS

/**
 * DNS配置对象
 * 智能分流：国内域名使用国内DNS，其他使用国外DNS
 */
const dnsConfig = {
  enable: true,            // 启用DNS功能
  listen: ':1053',         // DNS监听端口
  ipv6: true,              // 启用IPv6支持
  'prefer-h3': true,       // 优先使用HTTP/3
  'use-hosts': true,       // 使用本地hosts文件
  'use-system-hosts': true,// 使用系统hosts
  'respect-rules': true,   // 尊重规则分流
  'enhanced-mode': 'fake-ip',  // 使用fake-ip模式
  'fake-ip-range': '198.18.0.1/16',  // fake-ip范围
  'fake-ip-filter': ['*', '+.lan', '+.local', '+.market.xiaomi.com'],  // fake-ip过滤列表
  nameserver: [...foreignDNS],  // 默认使用国外DNS
  'proxy-server-nameserver': [...foreignDNS],  // 代理服务器使用的DNS
  
  /**
   * DNS策略分流
   * 国内域名使用国内DNS解析
   */
  'nameserver-policy': {
    'geosite:private': 'system',  // 私有域名使用系统DNS
    // 国内相关域名使用国内DNS
    'geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn': chinaDNS,
  },
};

// 规则集通用配置
const ruleProviderCommon = {
  type: 'http',       // 规则类型（HTTP远程获取）
  format: 'yaml',     // 规则格式（YAML）
  interval: 86400,    // 更新间隔（秒）- 24小时
};

// 代理组通用配置
const groupBaseOption = {
  interval: 300,            // 节点测试间隔（秒）
  timeout: 3000,            // 超时时间（毫秒）
  url: 'http://cp.cloudflare.com/generate_204',  // 测试URL
  lazy: true,               // 启用延迟加载
  'max-failed-times': 3,    // 最大失败次数
  hidden: false,            // 是否隐藏组
};

// 规则提供者集合
const ruleProviders = new Map();
// 添加应用规则集
ruleProviders.set('applications', {
  ...ruleProviderCommon,
  behavior: 'classical',  // 行为模式
  format: 'text',         // 格式为文本列表
  url: 'https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@clash-ruleset/applications.list',
  path: './ruleset/DustinWin/applications.list',  // 本地缓存路径
});

/**
 * 主函数 - 配置生成入口
 * @param {Object} config - 原始配置文件
 * @returns {Object} - 修改后的配置文件
 */
const main = (config) => {
  // 检查代理节点是否存在
  const proxyCount = config?.proxies?.length ?? 0;
  const proxyProviderCount = 
    typeof config?.['proxy-providers'] === 'object' 
      ? Object.keys(config['proxy-providers']).length 
      : 0;
  if (proxyCount === 0 && proxyProviderCount === 0) {
    throw new Error('配置文件中未找到任何代理');
  }

  // 初始化变量
  let regionProxyGroups = [];  // 地区策略组
  let otherProxyGroups = config.proxies.map(b => b.name);  // 其他节点列表

  // === 基础配置覆盖 ===
  config['allow-lan'] = true;      // 允许局域网访问
  config['bind-address'] = '*';    // 绑定所有地址
  config['mode'] = 'rule';         // 使用规则模式
  config['dns'] = dnsConfig;       // 应用DNS配置
  
  // 性能相关配置
  config['profile'] = {
    'store-selected': true,    // 存储选中节点
    'store-fake-ip': true,     // 存储fake-ip
  };
  config['unified-delay'] = true;      // 统一延迟显示
  config['tcp-concurrent'] = true;     // TCP并发处理
  config['keep-alive-interval'] = 1800; // 保活间隔（省电优化）
  config['find-process-mode'] = 'strict';  // 严格进程匹配模式
  config['geodata-mode'] = true;       // 启用地理数据模式
  config['geodata-loader'] = 'memconservative';  // 小内存优化模式
  config['geo-auto-update'] = true;    // 自动更新地理数据
  config['geo-update-interval'] = 24;  // 更新间隔（小时）

  // 域名嗅探配置（用于日志记录）
  config['sniffer'] = {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': false,
    'override-destination': true,
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, '8080-8880'] },
      QUIC: { ports: [443, 8443] },
    },
    'skip-src-address': [  // 跳过嗅探的源地址
      '127.0.0.0/8', '192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'
    ],
    'force-domain': [  // 强制嗅探的域名
      '+.google.com', '+.googleapis.com', '+.googleusercontent.com',
      '+.youtube.com', '+.facebook.com', '+.messenger.com',
      '+.fbcdn.net', 'fbcdn-a.akamaihd.net'
    ],
    'skip-domain': ['Mijia Cloud', '+.oray.com'],  // 跳过的域名
  };

  // NTP时间同步配置
  config['ntp'] = {
    enable: true,
    'write-to-system': false,  // 避免修改系统时间
    server: 'cn.ntp.org.cn',   // 国内NTP服务器
  };

  // 地理数据源配置
  config['geox-url'] = {
    geoip: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat',
    geosite: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat',
    mmdb: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb',
    asn: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb',
  };
  
  // 总开关关闭时直接返回原配置
  if (!enable) return config;

  // === 按地区分组代理节点 ===
  regionOptions.regions.forEach(region => {
    // 过滤符合地区要求且倍率在限制内的节点
    const proxies = config.proxies
      .filter(a => {
        // 从节点名称中提取倍率信息
        const multiplierMatch = /(?<=[xX✕✖⨉倍率])([1-9]+(\.\d+)*|0{1}\.\d+)(?=[xX✕✖⨉倍率])*/i.exec(a.name);
        const multiplier = multiplierMatch ? parseFloat(multiplierMatch[1] || '0') : 0;
        
        return (
          a.name.match(region.regex) &&  // 匹配地区名称
          multiplier <= region.ratioLimit  // 倍率在限制范围内
        );
      })
      .map(b => b.name);  // 提取节点名称

    // 如果有符合要求的节点，创建策略组
    if (proxies.length > 0) {
      regionProxyGroups.push({
        ...groupBaseOption,
        name: region.name,  // 策略组名称（如"HK香港"）
        type: 'url-test',    // 类型：延迟测试
        tolerance: 50,       // 容忍度（毫秒）
        icon: region.icon,   // 图标URL
        proxies: proxies,    // 包含的节点
      });
    }

    // 从未分组节点中移除已分组的节点
    otherProxyGroups = otherProxyGroups.filter(x => !proxies.includes(x));
  });

  // 获取所有地区策略组名称
  const proxyGroupsRegionNames = regionProxyGroups.map(value => value.name);

  // 如果有未分组的节点，添加"其他节点"组
  if (otherProxyGroups.length > 0) {
    proxyGroupsRegionNames.push('其他节点');
  }

  // === 创建手动选择策略组 ===
  // 包含所有代理节点（排除直连和REJECT）
  const manualSelectGroup = {
    ...groupBaseOption,
    name: '手动选择',
    type: 'select',  // 类型：手动选择
    proxies: [
      ...config.proxies
        .filter(p => p.type !== 'direct' && p.type !== 'reject')
        .map(p => p.name)
    ],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Global.png',
  };

  // === 构建核心策略组 ===
  config['proxy-groups'] = [
    // 代理模式选择组（主策略组）
    {
      ...groupBaseOption,
      name: '代理模式',
      type: 'select',
      proxies: [
        '手动选择',       // 手动选择节点
        '延迟优选',       // 自动选择低延迟节点
        '故障转移',       // 故障自动转移
        ...proxyGroupsRegionNames,  // 所有地区组
        '直连'           // 直连模式
      ],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Proxy.png',
    },
    
    // 手动选择组
    manualSelectGroup,
    
    // 延迟优选组（自动选择最佳节点）
    {
      ...groupBaseOption,
      name: '延迟优选',
      type: 'url-test',
      tolerance: 50,
      proxies: [...proxyGroupsRegionNames],  // 测试所有地区节点
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Speedtest.png',
    },
    
    // 故障转移组
    {
      ...groupBaseOption,
      name: '故障转移',
      type: 'fallback',
      proxies: [...proxyGroupsRegionNames],  // 故障转移节点池
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Final.png',
    },
  ];

  // 添加直连节点（如果不存在）
  if (!config.proxies.some(p => p.name === '直连')) {
    config.proxies.push({
      name: '直连',
      type: 'direct',
      udp: true,
    });
  }

  // === 按需添加服务策略组 ===
  // Notion办公服务
  if (ruleOptions.notion) {
    rules.push('RULE-SET,notion,Notion办公');
    rules.push('RULE-SET,figma_in_notion,Notion办公');

    ruleProviders.set('notion', {
      ...ruleProviderCommon,
      behavior: 'classical',
      format: 'text',
      url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Notion/Notion.list',
      path: './ruleset/toookamak/notion.list',
    });

    ruleProviders.set('figma_in_notion', {
      ...ruleProviderCommon,
      behavior: 'classical',
      format: 'text',
      url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Figma/Figma.list',
      path: './ruleset/toookamak/figma.list',
    });

    config['proxy-groups'].push({
      ...groupBaseOption,
      name: 'Notion办公',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Notion.png',
    });
  }

  // 国外AI服务
  if (ruleOptions.openai) {
    rules.push(
      'DOMAIN-SUFFIX,grazie.ai,国外AI',
      'DOMAIN-SUFFIX,grazie.aws.intellij.net,国外AI',
      'RULE-SET,ai,国外AI'
    );
    ruleProviders.set('ai', {
      ...ruleProviderCommon,
      behavior: 'classical',
      format: 'text',
      url: 'https://github.com/dahaha-365/YaNet/raw/refs/heads/dist/rulesets/mihomo/ai.list',
      path: './ruleset/YaNet/ai.list',
    });
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: '国外AI',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
      url: 'https://chat.openai.com/cdn-cgi/trace',  // 测试URL
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/ChatGPT.png',
    });
  }

  // YouTube服务
  if (ruleOptions.youtube) {
    rules.push('GEOSITE,youtube,YouTube');
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: 'YouTube',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
      url: 'https://www.youtube.com/s/desktop/494dd881/img/favicon.ico',
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/YouTube.png',
    });
  }

  // Telegram服务
  if (ruleOptions.telegram) {
    rules.push('GEOIP,telegram,Telegram');
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: 'Telegram',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
      url: 'http://www.telegram.org/img/website_icon.svg',
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Telegram.png',
    });
  }

  // 游戏专用策略组
  if (ruleOptions.games) {
    rules.push(
      'GEOSITE,category-games@cn,国内网站',
      'GEOSITE,category-games,游戏专用'
    );
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: '游戏专用',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Game.png',
    });
  }

  // 跟踪分析拦截
  if (ruleOptions.tracker) {
    rules.push('GEOSITE,tracker,跟踪分析');
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: '跟踪分析',
      type: 'select',
      proxies: ['REJECT', '直连', '代理模式'],  // 可选择拒绝或直连
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Reject.png',
    });
  }

  // 广告过滤
  if (ruleOptions.BanAD) {
    rules.push('GEOSITE,category-ads-all,广告过滤');
    rules.push('RULE-SET,adblockmihomo,广告过滤');
    ruleProviders.set('adblockmihomo', {
      ...ruleProviderCommon,
      behavior: 'domain',  // 域名匹配模式
      format: 'mrs',       // MRS格式
      url: 'https://github.com/217heidai/adblockfilters/raw/refs/heads/main/rules/adblockmihomo.mrs',
      path: './ruleset/adblockfilters/adblockmihomo.mrs',
    });
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: '广告过滤',
      type: 'select',
      proxies: ['REJECT', '直连', '代理模式'],  // 可选择拒绝广告
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Advertising.png',
    });
  }

  // 苹果服务
  if (ruleOptions.apple) {
    rules.push('GEOSITE,apple-cn,苹果服务');
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: '苹果服务',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
      url: 'http://www.apple.com/library/test/success.html',
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Apple_2.png',
    });
  }

  // 谷歌服务
  if (ruleOptions.google) {
    rules.push('GEOSITE,google,谷歌服务');
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: '谷歌服务',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
      url: 'http://www.google.com/generate_204',
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Google_Search.png',
    });
  }

  // 微软服务
  if (ruleOptions.microsoft) {
    rules.push('GEOSITE,microsoft@cn,国内网站', 'GEOSITE,microsoft,微软服务');
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: '微软服务',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
      url: 'http://www.msftconnecttest.com/connecttest.txt',
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Microsoft.png',
    });
  }

  // GitHub服务
  if (ruleOptions.Github) {
    rules.push('GEOSITE,github,Github');
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: 'Github',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
      url: 'https://github.com/robots.txt',
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/GitHub.png',
    });
  }

  // Epic下载服务
  if (ruleOptions.epicDownload) {
    rules.push('RULE-SET,epicDownload,虚幻引擎');
    ruleProviders.set('epicDownload', {
      ...ruleProviderCommon,
      behavior: 'classical',
      format: 'text',
      url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Epic/Epic.list',
      path: './ruleset/blackmatrix7/Epic.list',
    });
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: '虚幻引擎',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Download.png',
    });
  }

  // === 添加基础规则 ===
  rules.push(
    'GEOSITE,private,DIRECT',      // 私有网络直连
    'GEOIP,private,DIRECT,no-resolve',  // 私有IP直连
    'GEOSITE,cn,国内网站',          // 国内网站
    'GEOIP,cn,国内网站,no-resolve', // 国内IP
    'MATCH,其他外网'                // 其他所有流量
  );

  // === 添加基础策略组 ===
  config['proxy-groups'].push(
    // 下载软件策略组
    {
      ...groupBaseOption,
      name: '下载软件',
      type: 'select',
      proxies: ['直连', 'REJECT', '代理模式', '国内网站', ...proxyGroupsRegionNames],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Download.png',
    },
    // 其他外网策略组
    {
      ...groupBaseOption,
      name: '其他外网',
      type: 'select',
      proxies: ['代理模式', '国内网站', ...proxyGroupsRegionNames],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Streaming!CN.png',
    },
    // 国内网站策略组
    {
      ...groupBaseOption,
      name: '国内网站',
      type: 'select',
      proxies: ['直连', '代理模式', ...proxyGroupsRegionNames],
      url: 'http://wifi.vivo.com.cn/generate_204',  // 国内测试URL
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/StreamingCN.png',
    }
  );

  // 添加地区策略组到总策略组列表
  config['proxy-groups'] = config['proxy-groups'].concat(regionProxyGroups);

  // 覆盖原始规则和规则提供者
  config['rules'] = rules;
  config['rule-providers'] = Object.fromEntries(ruleProviders);

  // 添加其他节点策略组（如果有未分组节点）
  if (otherProxyGroups.length > 0) {
    config['proxy-groups'].push({
      ...groupBaseOption,
      name: '其他节点',
      type: 'select',
      proxies: otherProxyGroups,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/World_Map.png',
    });
  }

  // 返回最终配置
  return config;
};
