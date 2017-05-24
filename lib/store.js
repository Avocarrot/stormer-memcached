const util  = require('util');
const Memcached = require('memcached');
const { Store, errors } = require('stormer');
const CACHE_KEY_DELIMITER = ':';

class MemcachedStore extends Store {
  constructor(ICache, options = {}) {
    super();
    this.connection = options.connection || '';
    this.options    = options.options || {};
    this.options.lifetime = this.options.lifetime || 6000;
    this._cache = new ICache(this.connection, this.options);
    if (this._cache instanceof Memcached) {
      this._cache.on('failure', details => {
        throw new Error('Memcached Failure '+JSON.stringify(details));
      });
    }
  }

  _pkKey(model, pk) {
    return this._key(model.name, pk);
  }

  _key() {
    return [...arguments].join(CACHE_KEY_DELIMITER);
  }
  /**
   * Handles the logic for getting an entry from the storage
   *
   * @param {Object} model - The model
   * @param {String} pk - The object's primary key
   * @return {Promise} - A Promise
   *
   */
  _get(model, pk) {
    let key  = this._pkKey(model, pk);
    return new Promise( (res, rej) => {
      this._cache.get(key, (err, data) => {
        if (err) {
          return rej(err);
        }
        if (!data) {
          return rej(new errors.NotFoundError(util.format('Could not find cached item with key %s', key)));
        }
        return res(data);
      });
    });
  }

  /**
   * Handles the logic for filtering entries from the storage
   *
   * @param {Object} model - The model
   * @param {Objest} query - The query object
   * @return {Promise} - A Promise. The resolved value should be an array. Return empty array if none is natching the query.
   *
   */
  _filter() {
    return Promise.reject(new Error('Store.prototype.filter() is not supported'));
  }

  /**
   * Handles the logic for creating or updating an entry in the storage
   *
   * @param {Object} obj - The entry
   * @return {Promise} - A Promise
   *
   */
  _set(model, obj, operation) {
    if (operation === 'update') {
      return Promise.reject(new Error('Store.prototype.update() is not supported'));
    }
    let pk  = obj[model.schema.primaryKey];
    if (!pk) {
      return Promise.reject(new Error('primary key is required'));
    }
    let key = this._pkKey(model, pk);
    return new Promise( (res, rej) => {
      this._cache.set(key, obj, this.options.lifetime, (err) => {
        if (err) {
          return rej(err);
        }
        return res({ key, obj, lifetime: this.options.lifetime });
      });
    });
  }


  /**
   * Handles the logic for deleting an entry from the storage
   *
   * @param {String} query - The query object
   * @return {Promise} - A Promise. The resolved value should be the created obj.
   *
   */
  _delete(model, query) {
    let pk  = query[model.schema.primaryKey];
    if (!pk) {
      return Promise.reject(new Error('primaryKey was not set in query'));
    }
    let key = this._pkKey(model, pk);
    return new Promise( (res, rej) => {
      this._cache.del(key, (err) => {
        if (err) {
          return rej(err);
        }
        return res(key);
      })
    });
  }
}

module.exports = MemcachedStore;
