var http2 = require('http2'),
	fs = require('fs'),
	url = require('url'),
	zlib = require('zlib'),
	util = require('util'),
	events = require('events'),
	emitter = new events.EventEmitter(),
	config = require('./config.js').config,
	mineTypes = require('./mineTypes.js').types;

var options = {
	key: fs.readFileSync(config.ssl.key),
	cert: fs.readFileSync(config.ssl.cert),
ciphers: [
        "ECDHE-RSA-AES128-GCM-SHA256",
        "ECDHE-ECDSA-AES128-GCM-SHA256",
        "ECDHE-RSA-AES256-GCM-SHA384",
        "ECDHE-ECDSA-AES256-GCM-SHA384",
        "DHE-RSA-AES128-GCM-SHA256",
        "ECDHE-RSA-AES128-SHA256",
        "DHE-RSA-AES128-SHA256",
        "ECDHE-RSA-AES256-SHA384",
        "DHE-RSA-AES256-SHA384",
        "ECDHE-RSA-AES256-SHA256",
        "DHE-RSA-AES256-SHA256",
        "HIGH",
        "!aNULL",
        "!eNULL",
        "!EXPORT",
        "!DES",
        "!RC4",
        "!MD5",
        "!PSK",
        "!SRP",
        "!CAMELLIA"
    ].join(':')
	};

emitter.on('http500', function(res) {
	res.writeHead(500, {
		'Server': 'NSS',
		'Content-Type': 'text/html'
	});
	res.write('500 bad request');
	res.end();
});
var NSS = http2.createSecureServer(options);

NSS.getZipType = function(zipTypes) {
	if(zipTypes.indexOf('gzip') != -1) {
		return 'gzip';
	} else if (zipTypes.indexOf('deflate') != -1) {
		return 'deflate';
	} else {
		return;
	}
}

NSS.on('request', function(req, res) {
	//console.log('<<<<===============');
	//console.log(req);
	//console.log('================>>>');
	var reqHost = req.headers.host;
	if(toString.apply(reqHost) == '[object String]' && reqHost.indexOf('www.') != -1) {
		//console.log(req.headers.host);
		res.writeHead(302, {
			'Location': 'https://' + reqHost.replace('www.', '') + req.url	
		});
		res.end();
		return;
	}
	var reqURL = url.parse(req.url),
		filepath;

	(reqURL.pathname.indexOf('.') == -1 && reqURL.pathname.slice(-1) != '/') ? (filepath = config.ROOT_DIR + reqURL.pathname + '/') : (filepath = config.ROOT_DIR + reqURL.pathname);
	filepath.slice(-1) == '/' ? filepath += 'index.html' : '';

	try {
		decodeURIComponent(filepath);
	} catch(e) {
		emitter.emit('http500', res);
		return;
	}

	filepath = decodeURIComponent(filepath);

	fs.stat(filepath, function(err, stats) {
		res.setHeader('Server', 'NSS');
		if(err) {
			res.setHeader('Content-Type', 'text/html');
			res.write('404 not found');
			res.end();
		} else {
			var fileType = filepath.match(/\.[^\.]+$/g)[0].slice(1),
				mime = mineTypes[fileType] || 'octet-stream',
				mTime = stats.mtime.toUTCString(),
				fileSorce = fs.createReadStream(filepath),
				zipType = (req.headers['accept-encoding']) &&  NSS.getZipType(req.headers['accept-encoding']);
			//(req.headers['if-modified-since'] && req.headers['if-modified-since'] == mTime) ? res.statusCode = 304 : res.statusCode = 200;
			//console.log(req.headers['if-modified-since'] == mTime);
			zipType && res.setHeader('Content-Encoding', zipType);
			res.setHeader('Content-Type', mime);	
			res.setHeader('Last-Modified', mTime);
		//	res.setHeader('Public-Key-Pins', 'pin-sha256="klO23nT2ehFDXCfx3eHTDRESMz3asj1muO+4aIdjiuY="; pin-sha256="Fbs+o+IxVNTHBpjNQYfX/TBnxPC+OWLYxQLEtqkrAfM="; max-age=2592000; includeSubDomains');
			res.setHeader('strict-transport-security', 'max-age=0; includeSubDomains; preload');
			res.setHeader('Content-Security-Policy', 'upgrade-insecure-requests');
			res.setHeader('Cache-Control', 'max-age=' + config.MAX_AGE);
			fileSorce.pipe(zlib.createGzip()).pipe(res);
		}
	});
});
NSS.listen(config.PORT);
