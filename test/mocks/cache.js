function Cache() {
  this.flush();
}

Cache.prototype.set = function(key, item, lifetime, cb) {
  this._map.set(key, item);
  if (cb) cb(null, true);
};

Cache.prototype.get = function(key, cb) {
  cb(null, this._map.get(key));
};

Cache.prototype.del = function(key, cb) {
  this._map.delete(key);
  if (cb) cb(null, true);
};

Cache.prototype.flush = function() {
  this._map = new Map();
};

module.exports = Cache;
