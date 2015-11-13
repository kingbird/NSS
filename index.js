var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	zlib = require('zlib'),
	config = require('./config.js').config,
	mineTypes = require('./mineTypes.js').types;

var NSS = new http.Server;

function getZipType(zipTypes) {
	var zipType;
	if(zipTypes.indexOf('gzip') != -1) {
		zipType = 'gzip';
		return zipType;
	} else if (zipTypes.indexOf('deflate') != -1) {
		zipType = 'deflate';
	}
}

NSS.on('request', function(req, res) {
	var reqURL = url.parse(req.url),
		filepath,
		zipType = getZipType(req.headers['accept-encoding']);

	if(!reqURL.query && !reqURL.hash && reqURL.path.toString().indexOf('.') == -1 && reqURL.path.slice(-1) != '/') {
		filepath = config.ROOT_DIR + reqURL.pathname + '/';
	} else {
		filepath = config.ROOT_DIR + reqURL.pathname;
	}
	if(filepath.slice(-1) == '/') {
		filepath += 'index.html';
	}

	filepath = decodeURIComponent(filepath);

	var fileType = filepath.match(/\.[^\.]+$/g).toString().slice(1),
		mime = mineTypes[fileType] || 'octet-stream';

	fs.stat(filepath, function(err, stats) {

		var mTime = stats.mtime.toUTCString();
		console.log(req.headers['if-modified-since']);
		console.log(mTime);
		console.log(req.headers['if-modified-since'] == mTime);
		if(err) {
			res.writeHead(404, {
				'Server': 'NSS',
				'Content-Type': 'text/html'
			});
			res.write('404 not found');
			res.end();
		} else if (req.headers['if-modified-since'] && req.headers['if-modified-since'] == mTime) {
			console.log();
			res.statusCode = 304;
			res.setHeader('Server', 'NSS');
			res.setHeader('Content-Encoding', zipType);
			res.setHeader('Content-Type', mime);	
			res.setHeader('Last-Modified', mTime);
			res.setHeader('Cache-Control', 'max-age=' + config.MAX_AGE);
			var bodyData = fs.createReadStream(filepath);
			bodyData.pipe(zlib.createGzip()).pipe(res);
		} else {
			res.statusCode = 200;
			res.setHeader('Server', 'NSS');
			res.setHeader('Content-Encoding', zipType);
			res.setHeader('Content-Type', mime);	
			res.setHeader('Last-Modified', mTime);
			res.setHeader('Cache-Control', 'max-age=' + config.MAX_AGE);
			var bodyData = fs.createReadStream(filepath);
			bodyData.pipe(zlib.createGzip()).pipe(res);
		}
	});
});
NSS.listen(3333);
console.log('http is running at 3333');