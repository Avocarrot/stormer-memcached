**DEPRECATED** **Moved to gitlab.glispa.com:ssp/stormer-memcached** 

# stormer-memcached
Implementation of Stormer Store for Memcached

[![CircleCI](https://circleci.com/gh/Avocarrot/stormer-memcached/tree/master.svg?style=svg)](https://circleci.com/gh/Avocarrot/stormer-memcached/tree/master)

## Requirements

- [stormer ^0.10.0](https://www.npmjs.com/package/stormer)
- [memcached ^2.2.2](https://www.npmjs.com/package/memcached)

## Usage

```js
const Memcached = require('memcached');
const { MemcachedStore } = require('stormer-memcached');

// Memcached connection options as found here:
//https://www.npmjs.com/package/memcached#options
const options = {}; 

const cache = new Store(Memcached, options);
```

## Contributing

This project is work in progress and we'd love more people contributing to it. 

1. Fork the repo
2. Apply your changes
3. Write tests
4. Submit your pull request
