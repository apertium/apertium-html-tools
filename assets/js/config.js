/*
	Set ALLOWED_* and ENABLED_* configuration parameters to undefined for all (no filtering)
	Available modes are currently 'translation', 'analyzation', 'generation', 'sandbox'
	Expiry times are in hours (set them to 0 for no caching)
*/

var config = {
    APY_URL: 'http://www.apertium.org:8080',
    ALLOWED_LANGS: undefined,
    ALLOWED_VARIANTS: ['BR','aran','valencia'],
    ENABLED_MODES: ['translation'],
    DEFAULT_MODE: 'translation',
    SHOW_NAVBAR: false,
    GOOGLE_ANALYTICS_PROPERTY: undefined,
    GOOGLE_ANALYTICS_TRACKING_ID: undefined,
    LIST_REQUEST_CACHE_EXPIRY: 24,
    LANGUAGE_NAME_CACHE_EXPIRY: 24,
    LOCALIZATION_CACHE_EXPIRY: 24,
    AVAILABLE_LOCALES_CACHE_EXPIRY: 24
};
