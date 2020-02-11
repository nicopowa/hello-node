/**
 * @export
 */
class ModuleBase {

    /**
     * @param {*} app : 
     * @param {Map} settings : 
     */
    constructor(app, settings) {
        this._app = app;
        this._settings = settings;
        this._name = this.settings("name") || this.constructor.name.toLowerCase();
        console.log("start", this._name);
        if(this.settings("io")) {
            this._clients = new Map();
            this._io = this._app._io.of(this._name);
            this._io.on("connection", this._onIOConnect.bind(this));
        }
    }

    /**
     * @export
     */
    async init() {
        
    }

    /**
     * @method sendJSON : 
     * @param {http.Request} req 
     * @param {http.Response} res 
     * @param {number} statuscode 
     * @param {Object} data 
     * @param {string=} space 
     */
    sendJSON(req, res, statuscode, data, space = "") {
        res.writeHead(statuscode, {"Content-Type": "application/json"}).end(JSON.stringify(data, null, space));
    }

    /**
     * @method send200 : 
     * @param {http.Request} req 
     * @param {http.Response} res 
     * @param {string} mime 
     * @param {*} data 
     */
    send200(req, res, mime, data) {
        res.writeHead(200, {"Content-Type": mime}).end(data);
    }

    /**
     * @method send302 : 
     * @param {http.Request} req 
     * @param {http.Response} res 
     * @param {string} url 
     */
    send302(req, res, url) {
        res.writeHead(302, {"Location": url}).end();
    }

    /**
     * @method send401 : 
     * @param {http.Request} req 
     * @param {http.Response} res 
     * @param {string=} msg
     */
    send401(req, res, msg) {
        res.writeHead(401, {"Content-Type": "text/plain"}).end("401 " + msg || "");
    }

    /**
     * @method send404 : 
     * @param {http.Request} req 
     * @param {http.Response} res 
     * @param {string=} msg
     */
    send404(req, res, msg) {
        res.writeHead(404, {"Content-Type": "text/plain"}).end("404 " + (msg || ""));
    }

    /**
     * @method send500 : 
     * @param {http.Request} req 
     * @param {http.Response} res 
     * @param {string} err
     */
    send500(req, res, err) {
        res.writeHead(500, {"Content-Type": "text/plain"}).end(err);
    }

    /**
     * 
     * @param {Socket} socket : 
     */
    _onIOConnect(socket) {
        trace("io connect", this._name);
        this._clients.set(socket.id, socket);
        socket.on("disconnect", this._onIODisconnect.bind(this, socket.id));
    }

    /**
     * 
     * @param {String} socket : 
     */
    _onIODisconnect(socketID) {
        trace("io disconnect", this._name);
        this._clients.delete(socketID);
    }

    /**
     * @export
     * @method settings : 
     * @param {string} field : 
     * @return {*};
     */
    settings(field) {
        return this._settings.has(field) ? this._settings.get(field) : null;
    }
    
}

module.exports = ModuleBase;