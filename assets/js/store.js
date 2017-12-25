// @flow

/* exported Store */

/* eslint-disable id-blacklist */
/* eslint id-length: ["error", {
    "exceptions": ["get", "set", "key", "e", "has"]
}] */

// eslint-disable-next-line func-style
var Store = function (prefix /*: string */) /*: void */ {
    this.prefix = prefix;
};

Store.prototype.get = function /*:: <T> */ (key /*: string */, fallback /*: T */) /*: T */ {
    if(!this.able()) {
        return fallback;
    }

    var fromStorage /*: string */ = window.localStorage[(this.prefix /*: string */) + key];
    if(fromStorage === undefined || fromStorage === 'undefined') {
        return fallback;
    }
    else {
        try {
            var parsed = JSON.parse(fromStorage);
            if(parsed) {
                return parsed;
            }
        }
        catch(e) {
            console.error(key, fallback, e);
        }
        return fallback;
    }
};

Store.prototype.set = function /*:: <T> */ (key /*: string */, value /*: T */) /*: void */ {
    if(this.able()) {
        window.localStorage[(this.prefix /*: string */) + key] = JSON.stringify(value);
    }
};

Store.prototype.clear = function () /*: void */ {
    if(this.able()) {
        for(var key in window.localStorage) {
            if(key.startsWith((this.prefix /*: string */))) {
                window.localStorage.removeItem(key);
            }
        }
    }
};

Store.prototype.has = function (key /*: string */) /*: boolean */ {
    return this.able() && ((this.prefix /*: string */) + key) in window.localStorage;
};

Store.prototype.able = function () /*: boolean */ {
    try {
        return Boolean(window.localStorage);
    }
    catch(e) {
        if(e.name === 'SecurityError') {
            // Firefox and Chrome disable LocalStorage simultaneously with cookies and
            // throw a SecurityError on an attempt to use it.
            return false;
        }
        else {
            throw e;
        }
    }
};

/*:: export {Store} */
