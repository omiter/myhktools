// 校验http、https 代理是否可用
// node checkProxy.js ~/C/ip_log.txt 
/*
node proxy/ProxyServer.js -p 15331 -u
node proxy/ProxyServer.js --proxy socks://127.0.0.1:5533
node proxy/ProxyServer.js --proxy 'socks://mtxuser:sldfjsljf@127.0.0.1:5533'
curl -x "http://127.0.0.1:15531" http://ip.cn

npm install -g socks-proxy-agent
curl -v --proxy http://127.0.0.1:8880 http://ip.cn
# 这样kali就可以使用vps的代理了
vi /etc/apt/apt.conf.d/auto-apt-proxy.conf 
Acquire::http::Proxy "http://192.168.24.10:8880";
*/

var fs  = require("fs"),
	http = require("http"),
    request = require("request"),
    g_aProxy = null,
    program = require('commander'),
    httpProxy = require('http-proxy'),
    nPort = 8880,
    g_szUA = "Mozilla/5.0 (Linux; Android 5.1.1; OPPO A33 Build/LMY47V; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043409 Safari/537.36 V1_AND_SQ_7.1.8_718_YYB_D PA QQ/7.1.8.3240 NetType/4G WebP/0.3.0 Pixel/540",//"CaptiveNetworkSupport-355.30.1 wispr",
    szIp = "0.0.0.0";

program.version("动态代理")
	.option('-u, --useHttp', '使用动态http代理')
	.option('-p, --port [value]', 'port')
	.option('-v, --verbose', 'show log')
	.option('-l, --host [value]', 'host')
	.option('-x, --proxy [value]', 'socks://127.0.0.1:1086, or process.env.socks_proxy')
	.parse(process.argv);

nPort = program.port || nPort;
szIp = program.host || szIp;

process.on('uncaughtException', function(e){console.log(e)});
process.on('unhandledRejection', function(e){console.log(e)});

// 代理文件修改后自动更新内存
function fnWathProxyFile(s)
{
	var fnCbk = function()
	{
		if(fs.existsSync(s))
		{
			g_aProxy = fs.readFileSync(s).toString().trim().split(/\n/);
			console.log("读取到：" + g_aProxy.length + "个动态代理");
		}
	};
	fnCbk();
	fs.watch(s,{encoding:'buffer'},(eventType, filename)=>
	{
		if (filename)
		{
			fnCbk();
		}
	});
}
var szAutoProxyIps = '';
if(program.useHttp)
{
	szAutoProxyIps = __dirname + "/autoProxy.txt";
	fnWathProxyFile(szAutoProxyIps);
	console.log(szAutoProxyIps);
}

var proxy = program.proxy||process.env.socks_proxy||process.env["HTTP_PROXY"];
// 获取代理
function fnGetProxy()
{
	// 优先使用命令参数中的proxy，以及系统的设置
	if(proxy)
	{
		console.log("启用了代理:" + proxy);
		return {target:proxy};
	}
	if(program.useHttp)
	{
		var n = parseInt(Math.random() * 2000000000) % g_aProxy.length, aT = g_aProxy[n];
		if(-1 == aT.indexOf('http') && -1 == aT.indexOf('sock'))
			aT = "http://" + aT;
		console.log("使用代理: " + aT);
		return {target:aT};
	}
	return {};
}

// 启动多个
// pm2 start ProxyServer.js -i max
process.setMaxListeners(0);
require('events').EventEmitter.prototype._maxListeners = 0;
require('events').EventEmitter.defaultMaxListeners = 0;

var proxyW = httpProxy.createProxyServer();
http.createServer(function (req, res) {
  // 避免拥塞
  setTimeout(function () {
    proxyW.web(req, res, fnGetProxy());
  }, 1);
}).listen(nPort);
