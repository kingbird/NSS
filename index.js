var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	zlib = require('zlib'),
	config = require('./config.js').config,
	mineTypes = require('./mineTypes.js').types;

var NSS = new http.Server;


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
	var reqURL = url.parse(req.url),
		filepath;

	if(!reqURL.query && !reqURL.hash && reqURL.path.toString().indexOf('.') == -1 && reqURL.path.slice(-1) != '/') {
		filepath = config.ROOT_DIR + reqURL.pathname + '/';
	} else {
		filepath = config.ROOT_DIR + reqURL.pathname;
	}
	if(filepath.slice(-1) == '/') {
		filepath += 'index.html';
	}	
	console.log(filepath);
	console.log(escape(filepath));

	filepath = decodeURIComponent(escape(filepath));
	if(filepath.indexOf('%%') != -1) {
		filepath = filepath.replace('%%', '%25%');
		filepath = decodeURIComponent(filepath);
	}
	fs.stat(filepath, function(err, stats) {
		if(err) {
			res.writeHead(404, {
				'Server': 'NSS',
				'Content-Type': 'text/html'
			});
			res.write('404 not found');
			res.end();
		} else {
			var fileType = filepath.match(/\.[^\.]+$/g)[0].slice(1),
				mime = mineTypes[fileType] || 'octet-stream',
				mTime = stats.mtime.toUTCString(),
				zipType = (req.headers['accept-encoding']) &&  NSS.getZipType(req.headers['accept-encoding']);
			if (req.headers['if-modified-since'] && req.headers['if-modified-since'] == mTime) {
				res.statusCode = 304;
			} else {
				res.statusCode = 200;
			}
			res.setHeader('Server', 'NSS');
			zipType && res.setHeader('Content-Encoding', zipType);
			res.setHeader('Content-Type', mime);	
			res.setHeader('Last-Modified', mTime);
			res.setHeader('Cache-Control', 'max-age=' + config.MAX_AGE);
			var bodyData = fs.createReadStream(filepath);
			bodyData.pipe(zlib.createGzip()).pipe(res);
		}
	});
});
NSS.listen(80);
console.log('http is running at 80');