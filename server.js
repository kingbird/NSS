var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	mineTypes = require('./mineTypes.js').types;

var myServer = new http.Server,
	ROOT_DIR = 'blog';

myServer.on('request', function(req, res) {
	var reqURL = url.parse(req.url),
		filepath;
	if(!reqURL.query && !reqURL.hash && reqURL.path.toString().indexOf('.') == -1 && reqURL.path.slice(-1) != '/') {
		filepath = ROOT_DIR + reqURL.pathname + '/';
	} else {
		filepath = ROOT_DIR + reqURL.pathname;
	}

	if(filepath.slice(-1) == '/') {
		filepath += 'index.html';
	}
	filepath = decodeURIComponent(filepath);
	var fileType = filepath.match(/\.[^\.]+$/g).toString().slice(1),
		mime = mineTypes[fileType] || 'octet-stream';
	fs.stat(filepath, function(err, stats) {
		if(err) {
			res.writeHead(404, {
				'Content-Type': 'text/html'
			});
			res.write('404 not found');
			res.end();
		} else {
			res.writeHead(200, {
				'Content-Type': mime
			});
			fs.readFile(filepath, function(err, data) {
				res.write(data);
				res.end();
			});
		}
	});
}).listen(3333);
console.log('http is running at 3333');