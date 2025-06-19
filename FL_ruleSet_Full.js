/*** 
 * 优化增强版 - 修复规则集缺失问题
 */
const enable = true;

const ruleOptions = {
  apple: true, microsoft: true, github: true, google: true, openai: true,
  notion: true, Onedrive: true, GameStore: true, epicDownload: true,
  youtube: true, telegram: true, tracker: true, BanAD: true, BanProgramAD: true,games: false, 
/*   spotify: false, bahamut: false, netflix: false, tiktok: false, disney: false,
  pixiv: false, hbo: false, biliintl: false, tvb: false, hulu: false,
  primevideo: false, line: false, whatsapp: false, games: false, japan: false */
};

const rules = [
  'RULE-SET,applications,下载软件',
  'PROCESS-NAME,SunloginClient,DIRECT',
  'PROCESS-NAME,SunloginClient.exe,DIRECT',
  'PROCESS-NAME,AnyDesk,DIRECT',
  'PROCESS-NAME,AnyDesk.exe,DIRECT'
];

const regionOptions = {
  excludeHighPercentage: true,
  regions: [
    { name: 'HK香港', regex: /港|🇭🇰|hk|hongkong|hong kong/i, ratioLimit: 2, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Hong_Kong.png' },
    { name: 'US美国', regex: /美|🇺🇸|us|united state|america/i, ratioLimit: 2, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/United_States.png' },
    { name: 'JP日本', regex: /日本|🇯🇵|jp|japan/i, ratioLimit: 2, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Japan.png' },
    { name: 'SG新加坡', regex: /新加坡|🇸🇬|sg|singapore/i, ratioLimit: 2, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Singapore.png' },
    { name: 'TW台湾省', regex: /台湾|🇹🇼|tw|taiwan|tai wan/i, ratioLimit: 2, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/China.png' },
    { name: '原生IP/家宽', regex: /原生|家宽|住宅|home|residential/i, ratioLimit: 100, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Home.png' },
    { name: '低倍率', regex: /低倍率|0\.2|0.5|ratio|倍率低/i, ratioLimit: 0.5, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Speedtest.png' }
  ]
};

// 优化DNS配置结构
const dnsConfig = {
  enable: true,
  listen: ':1053',
  ipv6: true,
  'prefer-h3': true,
  'use-hosts': true,
  'use-system-hosts': true,
  'respect-rules': true,
  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.1/16',
  'fake-ip-filter': ['*', '+.lan', '+.local', '+.market.xiaomi.com'],
  nameserver: ['https://120.53.53.53/dns-query', 'https://223.5.5.5/dns-query'],
  'proxy-server-nameserver': ['https://120.53.53.53/dns-query', 'https://223.5.5.5/dns-query'],
  'nameserver-policy': {
    'geosite:private': 'system',
    'geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn': ['119.29.29.29', '223.5.5.5']
  }
};

// 提取通用配置为常量
const RULE_PROVIDER_COMMON = {
  type: 'http',
  format: 'yaml',
  interval: 86400
};

const GROUP_BASE_OPTION = {
  interval: 300,
  timeout: 3000,
  url: 'http://cp.cloudflare.com/generate_204',
  lazy: true,
  'max-failed-times': 3,
  hidden: false
};

// 创建规则提供者映射
const createRuleProviders = () => {
  const providers = new Map();
  providers.set('applications', {
    ...RULE_PROVIDER_COMMON,
    behavior: 'classical',
    format: 'text',
    url: 'https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@clash-ruleset/applications.list',
    path: './ruleset/toookamak/applications.list'
  });
  return providers;
};

// 创建策略组
const createProxyGroup = (name, type, proxies, options = {}) => ({
  ...GROUP_BASE_OPTION,
  name,
  type,
  proxies,
  ...options
});

// 主函数逻辑重构
const main = (config) => {
  if (!config?.proxies?.length && !config?.['proxy-providers']) {
    throw new Error('配置文件中未找到任何代理');
  }

  // === 基础配置覆盖 ===
  Object.assign(config, {
    'allow-lan': true,
    'bind-address': '*',
    mode: 'rule',
    dns: dnsConfig,
    profile: { 'store-selected': true, 'store-fake-ip': true },
    'unified-delay': true,
    'tcp-concurrent': true,
    'keep-alive-interval': 1800,
    'find-process-mode': 'strict',
    'geodata-mode': true,
    'geodata-loader': 'memconservative',
    'geo-auto-update': true,
    'geo-update-interval': 24,
    sniffer: {
      enable: true,
      'force-dns-mapping': true,
      'parse-pure-ip': false,
      'override-destination': true,
      sniff: {
        TLS: { ports: [443, 8443] },
        HTTP: { ports: [80, '8080-8880'] },
        QUIC: { ports: [443, 8443] }
      },
      'skip-src-address': ['127.0.0.0/8', '192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'],
      'force-domain': [
        '+.google.com', '+.googleapis.com', '+.googleusercontent.com',
        '+.youtube.com', '+.facebook.com', '+.messenger.com',
        '+.fbcdn.net', 'fbcdn-a.akamaihd.net'
      ],
      'skip-domain': ['Mijia Cloud', '+.oray.com']
    },
    ntp: {
      enable: true,
      'write-to-system': false,
      server: 'cn.ntp.org.cn'
    },
    'geox-url': {
      geoip: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat',
      geosite: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat',
      mmdb: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb',
      asn: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb'
    }
  });

  if (!enable) return config;

  // === 按地区分组代理节点 ===
  const regionProxyGroups = [];
  let otherProxyGroups = config.proxies.map(p => p.name);

  regionOptions.regions.forEach(region => {
    const proxies = config.proxies
      .filter(proxy => {
        const multiplierMatch = /(?<=[xX✕✖⨉倍率])([1-9]+(\.\d+)*|0{1}\.\d+)(?=[xX✕✖⨉倍率])*/i.exec(proxy.name);
        const multiplier = multiplierMatch ? parseFloat(multiplierMatch[1] || '0') : 0;
        return proxy.name.match(region.regex) && multiplier <= region.ratioLimit;
      })
      .map(p => p.name);

    if (proxies.length) {
      regionProxyGroups.push(createProxyGroup(
        region.name,
        'url-test',
        proxies,
        { tolerance: 50, icon: region.icon }
      ));
      otherProxyGroups = otherProxyGroups.filter(name => !proxies.includes(name));
    }
  });

  const proxyGroupsRegionNames = regionProxyGroups.map(g => g.name);
  if (otherProxyGroups.length) proxyGroupsRegionNames.push('其他节点');

  // === 核心策略组 ===
  config['proxy-groups'] = [
    createProxyGroup('代理模式', 'select', [
      '手动选择', '延迟优选', '故障转移', ...proxyGroupsRegionNames, '直连'
    ], { icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Proxy.png' }),
    
    createProxyGroup('手动选择', 'select', 
      config.proxies
        .filter(p => p.type !== 'direct' && p.type !== 'reject')
        .map(p => p.name),
      { icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Global.png' }
    ),
    
    createProxyGroup('延迟优选', 'url-test', proxyGroupsRegionNames, {
      tolerance: 50,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Speedtest.png'
    }),
    
    createProxyGroup('故障转移', 'fallback', proxyGroupsRegionNames, {
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Final.png'
    })
  ];

  // 确保存在直连节点
  if (!config.proxies.some(p => p.name === '直连')) {
    config.proxies.push({ name: '直连', type: 'direct', udp: true });
  }

  // === 按需添加服务策略组 ===
  const ruleProviders = createRuleProviders();
  
  // 修复：添加缺失的规则集提供者
  const addRuleProvider = (key, config) => {
    ruleProviders.set(key, {
      ...RULE_PROVIDER_COMMON,
      ...config
    });
  };

  // 服务策略组生成器（添加缺失规则集）
  const createServiceGroup = (name, ruleKey, icon, ruleProviderConfig) => {
    if (!ruleOptions[ruleKey]) return;
    
    // 添加规则集提供者（如果配置存在）
    if (ruleProviderConfig) {
      addRuleProvider(ruleKey, ruleProviderConfig);
      rules.push(`RULE-SET,${ruleKey},${name}`);
    }
    
    // 添加策略组
    config['proxy-groups'].push(createProxyGroup(
      name,
      'select',
      ['代理模式', ...proxyGroupsRegionNames, '直连'],
      { icon }
    ));
  };

  // 添加各服务组（包含缺失的规则集配置）
  createServiceGroup('Notion办公', 'notion', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Notion.png', {
    behavior: 'classical',
    format: 'text',
    url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Notion/Notion.list',
    path: './ruleset/toookamak/notion.list'
  });

  createServiceGroup('国外AI', 'openai', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/ChatGPT.png', {
    behavior: 'classical',
    format: 'text',
    url: 'https://github.com/dahaha-365/YaNet/raw/refs/heads/dist/rulesets/mihomo/ai.list',
    path: './ruleset/toookamak/ai.list'
  });

  createServiceGroup('广告过滤', 'BanAD', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Advertising.png', {
    behavior: 'domain',
    format: 'mrs',
    url: 'https://github.com/217heidai/adblockfilters/raw/refs/heads/main/rules/adblockmihomo.mrs',
    path: './ruleset/toookamak/adblockmihomo.mrs'
  });

  // 添加不需要规则集的服务
  const addBasicServiceGroup = (name, ruleKey, icon) => {
    if (!ruleOptions[ruleKey]) return;
    config['proxy-groups'].push(createProxyGroup(
      name,
      'select',
      ['代理模式', ...proxyGroupsRegionNames, '直连'],
      { icon }
    ));
  };

  addBasicServiceGroup('YouTube', 'youtube', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/YouTube.png');
  addBasicServiceGroup('Telegram', 'telegram', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Telegram.png');
  addBasicServiceGroup('游戏专用', 'games', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Game.png');
  addBasicServiceGroup('跟踪分析', 'tracker', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Reject.png');
  addBasicServiceGroup('苹果服务', 'apple', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Apple_2.png');
  addBasicServiceGroup('谷歌服务', 'google', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Google_Search.png');
  addBasicServiceGroup('微软服务', 'microsoft', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Microsoft.png');
  addBasicServiceGroup('Github', 'github', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/GitHub.png');
  addBasicServiceGroup('虚幻引擎', 'epicDownload', 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Download.png');

  // === 基础规则 ===
  rules.push(
    'GEOSITE,private,DIRECT',
    'GEOIP,private,DIRECT,no-resolve',
    'GEOSITE,cn,国内网站',
    'GEOIP,cn,国内网站,no-resolve',
    'MATCH,其他外网'
  );

  // === 基础策略组 ===
  config['proxy-groups'].push(
    createProxyGroup('下载软件', 'select', ['直连', 'REJECT', '代理模式', '国内网站', ...proxyGroupsRegionNames], {
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Download.png'
    }),
    createProxyGroup('其他外网', 'select', ['代理模式', '国内网站', ...proxyGroupsRegionNames], {
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Streaming!CN.png'
    }),
    createProxyGroup('国内网站', 'select', ['直连', '代理模式', ...proxyGroupsRegionNames], {
      url: 'http://wifi.vivo.com.cn/generate_204',
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/StreamingCN.png'
    })
  );

  // 添加地区组和其他节点组
  config['proxy-groups'].push(...regionProxyGroups);
  if (otherProxyGroups.length) {
    config['proxy-groups'].push(createProxyGroup('其他节点', 'select', otherProxyGroups, {
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/World_Map.png'
    }));
  }

  // 最终配置
  config.rules = rules;
  config['rule-providers'] = Object.fromEntries(ruleProviders);
  return config;
};
