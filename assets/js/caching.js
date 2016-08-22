/* exported cache, readCache */

// eslint-disable-next-line id-blacklist
function cache(name, value) {
    if(localStorage) {
        localStorage[name] = JSON.stringify(value);
        localStorage[name + '_timestamp'] = Date.now();
    }
}

function readCache(name, type) {
    if(localStorage && localStorage[name] && localStorage[name + '_timestamp']) {
        var MS_IN_HOUR = 3600000,
            expiryTime = parseInt(localStorage[name + '_timestamp']) + (config[type.toUpperCase() + '_CACHE_EXPIRY'] * MS_IN_HOUR);
        if(expiryTime > Date.now()) {
            return JSON.parse(localStorage[name]);
        }
        else {
            return null;
        }
    }
}
