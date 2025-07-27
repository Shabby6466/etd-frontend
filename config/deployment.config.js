// ETD System Deployment Configuration
const DeploymentConfig = {
    // Build settings for different environments
    environments: {
        development: {
            buildPath: './build',
            publicPath: '/',
            sourceMaps: true,
            minify: false,
            compress: false,
            optimization: false,
            devtools: true,
            hotReload: true
        },
        staging: {
            buildPath: './dist',
            publicPath: '/etd-staging/',
            sourceMaps: true,
            minify: true,
            compress: true,
            optimization: true,
            devtools: false,
            hotReload: false
        },
        production: {
            buildPath: './dist',
            publicPath: '/etd/',
            sourceMaps: false,
            minify: true,
            compress: true,
            optimization: true,
            devtools: false,
            hotReload: false
        }
    },

    // Server configurations
    servers: {
        development: {
            host: 'localhost',
            port: 3000,
            protocol: 'http',
            proxy: false,
            cors: true,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        },
        staging: {
            host: 'staging-etd.gov.pk',
            port: 443,
            protocol: 'https',
            proxy: true,
            cors: false,
            headers: {
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
            }
        },
        production: {
            host: 'etd.gov.pk',
            port: 443,
            protocol: 'https',
            proxy: true,
            cors: false,
            headers: {
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data:;"
            }
        }
    },

    // Build optimization settings
    optimization: {
        css: {
            minify: true,
            autoprefixer: true,
            extractToFile: true,
            purgeUnused: true
        },
        js: {
            minify: true,
            mangle: true,
            compress: true,
            dropConsole: true,
            treeshaking: true
        },
        html: {
            minify: true,
            removeComments: true,
            collapseWhitespace: true,
            removeEmptyAttributes: true
        },
        images: {
            optimize: true,
            quality: 80,
            progressive: true,
            webp: true
        }
    },

    // Cache settings
    cache: {
        static: {
            maxAge: '1y',
            immutable: true
        },
        html: {
            maxAge: '1h',
            mustRevalidate: true
        },
        api: {
            maxAge: '5m',
            staleWhileRevalidate: true
        }
    },

    // Security configurations
    security: {
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
                    fontSrc: ["'self'", "fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:"],
                    connectSrc: ["'self'"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later'
        }
    },

    // Monitoring and logging
    monitoring: {
        errorReporting: {
            enabled: true,
            service: 'sentry',
            environment: process.env.NODE_ENV || 'development'
        },
        analytics: {
            enabled: false, // Disabled for government application
            service: null
        },
        performance: {
            enabled: true,
            sampleRate: 1.0
        },
        logging: {
            level: process.env.LOG_LEVEL || 'info',
            file: {
                enabled: true,
                path: './logs/app.log',
                maxFiles: 5,
                maxSize: '10m'
            },
            console: {
                enabled: process.env.NODE_ENV !== 'production',
                colorize: true
            }
        }
    }
};

// Get configuration for current environment
function getDeploymentConfig(env = process.env.NODE_ENV || 'development') {
    return {
        environment: env,
        build: DeploymentConfig.environments[env],
        server: DeploymentConfig.servers[env],
        optimization: DeploymentConfig.optimization,
        cache: DeploymentConfig.cache,
        security: DeploymentConfig.security,
        monitoring: DeploymentConfig.monitoring
    };
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeploymentConfig, getDeploymentConfig };
} else {
    window.DeploymentConfig = DeploymentConfig;
    window.getDeploymentConfig = getDeploymentConfig;
} 