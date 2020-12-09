// user modules
const Connect = 	require("connect"); 	// middlewares
const MimeTypes = 	require("mime-types"); 	// mime types
const SocketIO = 	require("socket.io");	// socket.io

// native modules
const http = 		require("http"); 		// http server
const path = 		require("path"); 		// path
const fs = 			require("fs");			// file system

global._root = __dirname; // keep root directory ref
global.load = name => require(path.join(_root, path.sep, name)); // hack require.main.require()
global.outload = name => require(`${name}`); // load modules from outside node app root directory
global.trace = (...args) => { // better console.log
	let stack = new Error().stack.trim(), re = /([\w\.]+)\.js:(\d+)/gmi, fileLine = null, n = 0;
	while(n++ < 2) fileLine = re.exec(stack);
	args.push(("\t\t::" + fileLine[1] + ":" + fileLine[2]));
	console.log.apply(console, args);
};
global.die = () => {}; // empty method to die
global.error = err => console.log("\x1b[31m" + err, "\x1b[0m"); // print scary red error message

const appName = "base"; // <<<<< APP DIRECTORY NAME
const appPath = path.join(__dirname, "apps", appName); // get app path from name
const App = require(path.join(appPath, "_server")); // load app module

class Server {

	constructor() {
		this._port = 80; // http port
		trace("start http", this._port);
		
		this._connect = Connect(); // connect instance
		this._connect.use(this.handle.bind(this)); // handle request
		this._connect.use(this.serve.bind(this)); // check request is file
		this._connect.use(this.unhandled.bind(this)); // unhandled request

		this._server = http.createServer(this._connect).listen(this._port); // start http server

		this._io = SocketIO(this._server);

		this._app = new App(this, new Map()); // load app

		this._routes = Object.getOwnPropertyNames(Object.getPrototypeOf(this._app)) // get class methods
		.filter(name => name !== "constructor" && typeof this._app[name] === "function" && name.charAt(0) != "_") // not all methods
		.reduce((acc, route) => { // put them in a map
			acc.set(route, this._app[route]); // add to accumulator
			return acc; // return accumulator
		}, new Map()); // init with empty map

		console.log("routes :", [...this._routes.keys()]); // say my name
	}

	handle(req, res, next) { // handle request
		trace("request", req.url);
		let parts = req.url.split("/").map(part => part.replace(/[^a-z0-9-\.]/gi, "")).filter(Boolean); // url parts
		req.route = parts[0]; // isolate method
		req.path = parts.join(path.sep) || "/"; // keep path in request object
		if(this._routes.has(req.route)) { // check method exists
			trace("route", req.route); // say it
			this._routes.get(req.route).apply(this._app, [req, res, ...parts.slice(1)]); // exec method
		}
		else next(); // method doesn't exist
	}

	serve(req, res, next) { // check request is file
		if(req.path == "/") req.path += "index.html"; // empty route, load index
		if(/.*\.[a-z0-9]+/gi.test(req.path)) { // regex test path
			let filePath = path.join(appPath, req.path); // file path
			trace("file", filePath); // say it
			fs.exists(filePath, exists => { // check file exists
				if(!exists) { // oh no it doesn't
					error("404 " + filePath); // say it
					return this._app.send404(req, res); // inform client
				}
				let filemime = MimeTypes.contentType(MimeTypes.lookup(filePath)); // get mime type
				fs.readFile(filePath, "binary", (err, file) => { // read file
					if(err) return this._app.send500(req, res, err); // that's a big problem
					res.writeHead(200, { // send file
						"Content-Type": filemime, // with mime type in headers
						"Cache-Control": "no-cache" // and no cache
					}).write(file, "binary"); // write binary data to response
					res.end(); // done
				});
			});
		}
		else next(); // not a file
	}

	unhandled(req, res, next) { // unhandled request
		trace("unhandled", req.url); // say it
		this._app.send404(req, res); // 404
	}

}

new Server(); // go go go