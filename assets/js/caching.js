/* exported cache, readCache */

// eslint-disable-next-line id-blacklist
function cache(name, value) {
    if(localStorage) {
        localStorage[name] = JSON.stringify(value);
        localStorage[name + '_timestamp'] = JSON.stringify(Date.now());
    }
}

function readCache(name, type) {
    var ts = safeRetrieve(name + '_timestamp', 0);
    var obj = safeRetrieve(name, null);
    if(obj && ts) {
        var expiry_hrs = config[type.toUpperCase() + '_CACHE_EXPIRY'];
        if(expiry_hrs === undefined) {
            expiry_hrs = 24;
        }
        var MS_IN_HOUR = 3600000,
            expiryTime = ts + (expiry_hrs * MS_IN_HOUR);
        if(expiryTime > Date.now()) {
            return obj;
        }
        else {
            return null;
        }
    }
}

/*:: export {cache, readCache} */
