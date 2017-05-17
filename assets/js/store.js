/* exported Store */

/* eslint-disable id-blacklist */
/* eslint id-length: ["error", {
    "exceptions": ["get", "set", "key", "e", "has"]
}] */

// eslint-disable-next-line func-style

var Store = function (prefix/*: string*/)/*: void*/ {
    this.prefix = prefix;
};

Store.prototype.get = function/*:: <T>*/ (key/*: string*/, fallback/*: T*/)/*: T*/ {
    if(fallback === undefined) {
        console.warn('Store.get with undefined fallback! Key:', key);
    }
    if(navigator.cookieEnabled === true) {
        if(!this.able()) {
            return fallback;
        }
    }
    var fromStorage = window.localStorage[this.prefix + key];
    if(fromStorage === undefined) {
        return fallback;
    }
    else if(fromStorage === 'undefined') {
        // JSON.parse(JSON.stringify(undefined)) fails – manually "parse" if so:
        return undefined;
    }
    else {
        try {
            var parsed = JSON.parse(fromStorage);
            if(parsed !== null) {
                return parsed;
            }
        }
        catch(e) {
            console.error(key, fallback, e);
        }
        return fallback;
    }
};

Store.prototype.set = function/*:: <T>*/ (key/*: string*/, value/*: T*/)/*: void*/ {
    if(navigator.cookieEnabled === true) {
        if(this.able()) {
            window.localStorage[this.prefix + key] = JSON.stringify(value);
        }
    }
};

Store.prototype.clear = function ()/*: void*/ {
    if(navigator.cookieEnabled === true) {
        if(this.able()) {
            for(var key in window.localStorage) {
                if(key.startsWith(this.prefix)) {
                    window.localStorage.removeItem(key);
                }
            }
        }
    }
};

Store.prototype.has = function (key/*: string*/)/*: bool*/ {
    if(navigator.cookieEnabled === true) {
        return this.able() &&
            (this.prefix + key) in window.localStorage;
    }
};

if(navigator.cookieEnabled === true) {
    Store.prototype.able = function ()/*: bool*/ {
        return !!(window.localStorage);
    };
}

/*:: export {Store} */
