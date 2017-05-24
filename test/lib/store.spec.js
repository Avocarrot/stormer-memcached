const test = require('tape');
const sinon = require('sinon');
const ICache = require('../../mock');
const MemcachedStore = require('../../lib/store');
const { NotFoundError } = require('stormer').errors;

const model = {
  id:  { type: 'String', primaryKey: true },
  foo: { type: 'String' }
};

test('new MemcachedStore should throw an assertion error', assert => {
  assert.plan(1);
  try {
    new MemcachedStore();
  } catch(err) {
    assert.equals(err.message, 'ICache is not a constructor');
  }
});

test('new MemcachedStore(Memcached, options) should setup Memcached options properly with given options', assert => {
  assert.plan(2);
  let connection = '8.8.8.8:11211';
  let options = {};
  class Foo {
    constructor(actualConnection, actualOptions) {
      assert.equals(actualConnection, connection);
      assert.equals(actualOptions, options);
    }
  }
  new MemcachedStore(Foo, { connection, options });
});

test('store.get() should return a Promise and reject due to error', assert => {
  assert.plan(1);
  const store = new MemcachedStore(ICache);
  sinon.stub(store._cache, 'get').callsFake((key, cb) => {
    cb(new Error('Some memcached error'));
  });

  store.define('test_model', model);
  store.get('test_model', '1').catch( err => assert.equals(err.message, 'Some memcached error'));
});

test('store.create() should return a Promise and reject due to missing primary key', assert => {
  assert.plan(1);
  const store  = new MemcachedStore(ICache);

  store.define('test_model', model);
  store._set(store.getModel('test_model'), { foo: '1' }, 'create').catch( err => assert.equals(err.message, 'primary key is required'));
});

test('store.create() should return a Promise and reject due to error', assert => {
  assert.plan(1);
  const store  = new MemcachedStore(ICache);
  sinon.stub(store._cache, 'set').callsFake((key, item, lifetime, cb)=>{
    cb(new Error('Some memcached error'));
  });

  store.define('test_model', model);
  store.create('test_model', {id : '1' }).catch( err => assert.equals(err.message, 'Some memcached error'));
});

test('store.update() should return a Promise and reject due to unsupported method', assert => {
  assert.plan(1);
  const store  = new MemcachedStore(ICache);
  store.define('test_model', model);
  store.update('test_model', {id : '1' }).catch( err => assert.equals(err.message, 'Store.prototype.update() is not supported'));
});

test('store.filter() should return a Promise and reject due to unsupported method', assert => {
  assert.plan(1);
  const store  = new MemcachedStore(ICache);
  store.define('test_model', model);
  store.filter('test_model', {id : '1' }).catch( err => assert.equals(err.message, 'Store.prototype.filter() is not supported'));
});

test('store.delete() should return a Promise and reject due to error', assert => {
  assert.plan(1);
  const store = new MemcachedStore(ICache);
  sinon.stub(store._cache, 'del').callsFake((key, cb) => {
    cb(new Error('Some memcached error'));
  });

  store.define('test_model', model);
  store.delete('test_model', { id: '1' }).catch( err => assert.equals(err.message, 'Some memcached error'));
});

test('store.delete() should return a Promise and reject due to missing primary key', assert => {
  assert.plan(1);
  const store = new MemcachedStore(ICache);
  sinon.stub(store._cache, 'del').callsFake((key, cb) => {
    cb(new Error('Some memcached error'));
  });

  store.define('test_model', model);
  store.delete('test_model', { foo: '1' }).catch( err => assert.equals(err.message, 'primaryKey was not set in query'));
});

test('store.delete() should return a Promise and resolve with key deleted', assert => {
  assert.plan(1);
  const store = new MemcachedStore(ICache);
  sinon.stub(store._cache, 'del').callsFake((key, cb) => {
    cb();
  });

  store.define('test_model', model);
  store.delete('test_model', { id: '1' }).then( key => assert.equals(key, 'test_model:1'));
});

test('store.get() should return a Promise and reject with NotFoundError', assert => {
  assert.plan(2);
  const store = new MemcachedStore(ICache);
  sinon.stub(store._cache, 'get').callsFake((key, cb) => {
    cb();
  });

  store.define('test_model', model);
  store.get('test_model', '1').catch( err => {
    assert.equals(err.message, 'Could not find cached item with key test_model:1');
    assert.ok(err instanceof NotFoundError);
  });
});

test('store.get() should return a Promise and resolve with data', assert => {
  assert.plan(1);
  const store = new MemcachedStore(ICache);
  const actual = { id: 1 };
  sinon.stub(store._cache, 'get').callsFake((key, cb) => {
    cb(null, actual);
  });

  store.define('test_model', model);
  store.get('test_model', '1').then( expected => assert.equals(actual, expected));
});

test('store.create() should return a Promise and resolve with key', assert => {
  assert.plan(3);
  const store  = new MemcachedStore(ICache, { options: { lifetime: 1 } });
  sinon.stub(store._cache, 'set').callsFake((key, item, lifetime, cb)=>{
    cb();
  });

  store.define('test_model', model);

  const obj = { id: '1' };
  store.create('test_model', obj).then( data => {
    assert.equals(data.key, 'test_model:1');
    assert.deepEquals(data.obj, obj);
    assert.equals(data.lifetime, 1);
  });
});
