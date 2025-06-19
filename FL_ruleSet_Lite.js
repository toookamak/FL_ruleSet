/*** 
 * 精简版 - 保留新加坡地区、应用净化、Telegram和AI服务
 */
const enable = true;

// 精简规则选项，保留所需功能
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
  'PROCESS-NAME,SunloginClient.exe,DIRECT',
  'PROCESS-NAME,AnyDesk.exe,DIRECT'
];

// 地区分组 - 保留新加坡
const regionOptions = {
  excludeHighPercentage: true,
  regions: [
    { name: 'HK香港', regex: /港|🇭🇰|hk|hongkong|hong kong/i, ratioLimit: 2, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Hong_Kong.png' },
    { name: 'US美国', regex: /美|🇺🇸|us|united state|america/i, ratioLimit: 2, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/United_States.png' },
    { name: 'JP日本', regex: /日本|🇯🇵|jp|japan/i, ratioLimit: 2, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Japan.png' },
    { name: 'SG新加坡', regex: /新加坡|🇸🇬|sg|singapore/i, ratioLimit: 2, icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Singapore.png' } // 保留新加坡
  ]
};

// 简化DNS配置
const dnsConfig = {
  enable: true,
  listen: ':1053',
  ipv6: true,
  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.1/16',
  nameserver: ['119.29.29.29', '223.5.5.5'],
  'fake-ip-filter': ['*', '+.lan', '+.local']
};

// 基础配置常量
const GROUP_BASE_OPTION = {
  interval: 300,
  timeout: 3000,
  url: 'http://cp.cloudflare.com/generate_204',
  lazy: true
};

// 主函数精简
const main = (config) => {
  if (!config?.proxies?.length && !config?.['proxy-providers']) {
    throw new Error('配置文件中未找到任何代理');
  }

  // === 精简基础配置 ===
  Object.assign(config, {
    'allow-lan': true,
    'bind-address': '*',
    mode: 'rule',
    dns: dnsConfig,
    profile: { 'store-selected': true },
    'keep-alive-interval': 1800,
    'geodata-mode': true
  });

  if (!enable) return config;

  // === 按地区分组代理节点 ===
  const regionProxyGroups = [];
  let otherProxyGroups = config.proxies.map(p => p.name);

  regionOptions.regions.forEach(region => {
    const proxies = config.proxies
      .filter(proxy => proxy.name.match(region.regex))
      .map(p => p.name);

    if (proxies.length) {
      regionProxyGroups.push({
        ...GROUP_BASE_OPTION,
        name: region.name,
        type: 'url-test',
        tolerance: 50,
        icon: region.icon,
        proxies
      });
      otherProxyGroups = otherProxyGroups.filter(name => !proxies.includes(name));
    }
  });

  const proxyGroupsRegionNames = regionProxyGroups.map(g => g.name);
  if (otherProxyGroups.length) proxyGroupsRegionNames.push('其他节点');

  // === 核心策略组精简 ===
  config['proxy-groups'] = [
    {
      ...GROUP_BASE_OPTION,
      name: '代理模式',
      type: 'select',
      proxies: ['手动选择', '延迟优选', ...proxyGroupsRegionNames, '直连'],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Proxy.png'
    },
    {
      ...GROUP_BASE_OPTION,
      name: '手动选择',
      type: 'select',
      proxies: config.proxies
        .filter(p => p.type !== 'direct' && p.type !== 'reject')
        .map(p => p.name),
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Global.png'
    },
    {
      ...GROUP_BASE_OPTION,
      name: '延迟优选',
      type: 'url-test',
      tolerance: 50,
      proxies: proxyGroupsRegionNames,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Speedtest.png'
    }
  ];

  // 确保直连节点存在
  if (!config.proxies.some(p => p.name === '直连')) {
    config.proxies.push({ name: '直连', type: 'direct', udp: true });
  }

  // === 添加必需的规则提供者 ===
  config['rule-providers'] = {
    applications: {
      type: 'http',
      behavior: 'classical',
      format: 'text',
      url: 'https://fastly.jsdelivr.net/gh/DustinWin/ruleset_geodata@clash-ruleset/applications.list',
      path: './ruleset/toookamak/applications.list',
      interval: 86400
    },
    // 为AI服务添加规则提供者
    openai: {
      type: 'http',
      behavior: 'classical',
      format: 'text',
      url: 'https://github.com/dahaha-365/YaNet/raw/refs/heads/dist/rulesets/mihomo/ai.list',
      path: './ruleset/toookamak/ai.list',
      interval: 86400
    },
    // 为Telegram添加规则提供者
    telegram: {
      type: 'http',
      behavior: 'classical',
      format: 'text',
      url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Telegram/Telegram.list',
      path: './ruleset/toookamak/telegram.list',
      interval: 86400
    }
  };

  // === 添加基础策略组 ===
  const baseProxyGroups = [
    // 下载软件策略组
    {
      ...GROUP_BASE_OPTION,
      name: '下载软件',
      type: 'select',
      proxies: ['直连', 'REJECT', '代理模式', '国内网站', ...proxyGroupsRegionNames],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Download.png'
    },
    // 国内网站策略组
    {
      ...GROUP_BASE_OPTION,
      name: '国内网站',
      type: 'select',
      proxies: ['直连', '代理模式', ...proxyGroupsRegionNames],
      url: 'http://wifi.vivo.com.cn/generate_204',
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/StreamingCN.png'
    },
    // 其他外网策略组
    {
      ...GROUP_BASE_OPTION,
      name: '其他外网',
      type: 'select',
      proxies: ['代理模式', ...proxyGroupsRegionNames],
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Streaming!CN.png'
    }
  ];

  config['proxy-groups'] = config['proxy-groups'].concat(baseProxyGroups);

  // === 添加服务策略组 - 包含AI和Telegram ===
  const BASIC_SERVICES = [
    { name: '苹果服务', key: 'apple', icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Apple_2.png' },
    { name: '谷歌服务', key: 'google', icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Google_Search.png' },
    { name: '微软服务', key: 'microsoft', icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Microsoft.png' },
    { name: 'Github', key: 'github', icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/GitHub.png' },
    { name: '广告过滤', key: 'BanAD', icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Advertising.png' },
    // 添加Telegram服务
    { name: 'Telegram', key: 'telegram', icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Telegram.png' },
    // 添加AI服务
    { name: '国外AI', key: 'openai', icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/ChatGPT.png' }
  ];

  BASIC_SERVICES.forEach(service => {
    if (ruleOptions[service.key]) {
      config['proxy-groups'].push({
        ...GROUP_BASE_OPTION,
        name: service.name,
        type: 'select',
        proxies: ['代理模式', ...proxyGroupsRegionNames, '直连'],
        icon: service.icon
      });
      
      // 为AI和Telegram添加规则
      if (service.key === 'openai') {
        rules.push(`RULE-SET,openai,国外AI`);
      } else if (service.key === 'telegram') {
        rules.push(`RULE-SET,telegram,Telegram`);
      }
    }
  });

  // === 基础规则精简 ===
  config.rules = [
    ...rules,
    'GEOSITE,private,DIRECT',
    'GEOIP,private,DIRECT,no-resolve',
    'GEOSITE,cn,国内网站',
    'GEOIP,cn,国内网站,no-resolve',
    'MATCH,其他外网'
  ];

  // 添加地区组
  config['proxy-groups'].push(...regionProxyGroups);
  
  // 添加其他节点组
  if (otherProxyGroups.length) {
    config['proxy-groups'].push({
      ...GROUP_BASE_OPTION,
      name: '其他节点',
      type: 'select',
      proxies: otherProxyGroups,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/World_Map.png'
    });
  }

  return config;
};
