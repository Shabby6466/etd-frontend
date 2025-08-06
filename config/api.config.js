const ApiConfig = {
    production: {
        NADRA_API_URL: 'https://api.nadra.gov.pk/v1/verify',
        NADRA_API_KEY: '',
        NADRA_REQUESTER_ID: 'ministry_interior',
        
        PASSPORT_API_URL: 'https://api.passport.gov.pk/v1/verify',
        PASSPORT_API_KEY: '',
        PASSPORT_REQUESTER_ID: 'ministry_interior',
        
        API_TIMEOUT: 30000,
        API_RETRY_ATTEMPTS: 3,
        
        USE_SIMULATION: false
    },
    
    staging: {
        NADRA_API_URL: 'https://staging-api.nadra.gov.pk/v1/verify',
        NADRA_API_KEY: '',
        NADRA_REQUESTER_ID: 'ministry_interior',
        
        PASSPORT_API_URL: 'https://staging-api.passport.gov.pk/v1/verify',
        PASSPORT_API_KEY: '',
        PASSPORT_REQUESTER_ID: 'ministry_interior',
        
        API_TIMEOUT: 30000,
        API_RETRY_ATTEMPTS: 3,
        
        USE_SIMULATION: true
    },
    
    development: {
        NADRA_API_URL: 'https://api.nadra.gov.pk/v1/verify',
        NADRA_API_KEY: '',
        NADRA_REQUESTER_ID: 'ministry_interior',
        
        PASSPORT_API_URL: 'https://api.passport.gov.pk/v1/verify',
        PASSPORT_API_KEY: '',
        PASSPORT_REQUESTER_ID: 'ministry_interior',
        
        API_TIMEOUT: 30000,
        API_RETRY_ATTEMPTS: 3,
        
        USE_SIMULATION: true
    }
};

function getCurrentApiConfig() {
    const environment = window.location.hostname === 'localhost' ? 'development' :
                       window.location.hostname.includes('staging') ? 'staging' : 'production';
    
    return {
        ...ApiConfig[environment],
        environment: environment
    };
}

function setApiCredentials(nadraKey, passportKey) {
    const config = getCurrentApiConfig();
    config.NADRA_API_KEY = nadraKey;
    config.PASSPORT_API_KEY = passportKey;
    
    sessionStorage.setItem('api_config', JSON.stringify(config));
}

function getApiCredentials() {
    const storedConfig = sessionStorage.getItem('api_config');
    if (storedConfig) {
        return JSON.parse(storedConfig);
    }
    return getCurrentApiConfig();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiConfig, getCurrentApiConfig, setApiCredentials, getApiCredentials };
} else {
    window.ApiConfig = ApiConfig;
    window.getCurrentApiConfig = getCurrentApiConfig;
    window.setApiCredentials = setApiCredentials;
    window.getApiCredentials = getApiCredentials;
}