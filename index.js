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

	(!reqURL.query && !reqURL.hash && reqURL.path.toString().indexOf('.') == -1 && reqURL.path.slice(-1) != '/') ? (filepath = config.ROOT_DIR + reqURL.pathname + '/') : (filepath = config.ROOT_DIR + reqURL.pathname);

	filepath.slice(-1) == '/' ? filepath += 'index.html' : '';

	try {
		decodeURIComponent(filepath);
	} catch(e) {
		res.writeHead(500, {
			'Server': 'NSS',
			'Content-Type': 'text/html'
		});
		res.write('500 bad request');
		res.end();
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
			(req.headers['if-modified-since'] && req.headers['if-modified-since'] == mTime) ? res.statusCode = 304 : res.statusCode = 200;
			zipType && res.setHeader('Content-Encoding', zipType);
			res.setHeader('Content-Type', mime);	
			res.setHeader('Last-Modified', mTime);
			res.setHeader('Cache-Control', 'max-age=' + config.MAX_AGE);
			fileSorce.pipe(zlib.createGzip()).pipe(res);
		}
	});
});
NSS.listen(config.PORT);