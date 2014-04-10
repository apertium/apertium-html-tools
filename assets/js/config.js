/*
	Set ALLOWED_* and ENABLED_* configuration parameters to undefined for all (no filtering)
	Available modes are currently 'translation', 'analyzation', 'generation', 'sandbox'
	Expiry times are in hours (set them to 0 for no caching)
*/

var config = {
    APY_URL: '//localhost:2737',
    ALLOWED_LANGS: undefined,
    ALLOWED_VARIANTS: undefined,
    ENABLED_MODES: ['translation', 'analyzation', 'generation', 'sandbox'],
    DEFAULT_MODE: 'translation',
    SHOW_NAVBAR: true,
    LIST_REQUEST_CACHE_EXPIRY: 24,
    LANGUAGE_NAME_CACHE_EXPIRY: 24, //TODO: Make it work
    LOCALIZATION_CACHE_EXPIRY: 24,
    AVAILABLE_LOCALES_CACHE_EXPIRY: 24
};
