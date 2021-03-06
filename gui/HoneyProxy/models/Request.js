/**
 * Proxy object for better access to Flows. Be aware that both Request and
 * Response objects are stateless!
 */
define(["lodash","dojo/Deferred","../utilities","./sharedFlowProperties"],function(_,Deferred,utilities,sharedFlowProperties){
	
	var Request = function(flow){
		this._flow = flow;
	};
  
  var defaultPorts = {"http":80,"https":443};
  
	Request.prototype = {
		get _attr() {
			return "request";
		},
		get path() {
			return this.data.path;
		},
		get host() {
			return this.data.host;
		},
		get hostFormatted() {
			return "hostFormatted" in this.data ? this.data.hostFormatted : this.host;
		},
		get port() {
			return this.data.port;
		},
		get method() {
			return this.data.method; 
		},
		get scheme() {
			return this.data.scheme;
		},
		get client_conn() {
			return this.data.client_conn;
		},
		get hasFormData() {
			if(!this.hasContent)
				return false;
			return this.contentType && !!this.contentType.match(/^application\/x-www-form-urlencoded\s*(;.*)?$/i);
		},
		get hasPayload() {
			return this.hasContent && (!this.hasFormData);
		},
		getFormData: function(){
			if(this._flow.has("formDataParsed"))
				return (new Deferred())
					.resolve(this._flow.get("formDataParsed"));
			else {
				var self = this;
				var deferred = new Deferred();
				this.getContent().then(function(data){
					var formData = utilities.parseParameters(data);
					self._flow.set("formDataParsed",formData);
					deferred.resolve(formData);
				});
				return deferred;
			}
		},
		_processName: function(){
			var params = this.path.split("?");
			var path = params.shift().split("/");
			params.unshift("");
			var fullpath = this.scheme + "://" + this.hostFormatted;
      if(!(this.scheme in defaultPorts) || defaultPorts[this.scheme] !== this.port)
        fullpath += ":" + this.port;
      fullpath += path.join("/");
			var filename = path.pop();
			this._flow.set("filename", filename==="" ? "/" : filename );
			this._flow.set("fullPath", fullpath );
			this._flow.set("queryString", params.join("?") );		
		},
		get filename() {
			if(!this._flow.has("filename"))
				this._processName();
			return this._flow.get("filename");
		},
		get queryString(){
			if(!this._flow.has("queryString"))
				this._processName();
			return this._flow.get("queryString");
		},
		get fullPath() {
			if(!this._flow.has("fullPath"))
				this._processName();
			return this._flow.get("fullPath");
		},
		get rawFirstLine() {
			return [this.method,this.path,"HTTP/" + this.httpversion.join(".")]
					.join(" ")+"\n";
		}
	};
	// depends on https://github.com/documentcloud/underscore/pull/694
	_.extend(Request.prototype,sharedFlowProperties);

	return Request;
});