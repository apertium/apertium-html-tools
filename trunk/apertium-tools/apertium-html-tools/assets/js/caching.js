function cache(name, value) {
    if(localStorage) {
        localStorage[name] = JSON.stringify(value);
        localStorage[name + '_timestamp'] = Date.now();
    }
}

function readCache(name, type) {
    if(localStorage && localStorage[name] && localStorage[name + '_timestamp']) {
        if(parseInt(localStorage[name + '_timestamp']) + config[type.toUpperCase() + '_CACHE_EXPIRY'] * 3600000 > Date.now())
            return JSON.parse(localStorage[name]);
        else
        	return null;
    }
}

