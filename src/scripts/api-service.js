import { authFetch } from './auth.js';

class ApiService {
    constructor() {
        this.loadConfig();
    }

    loadConfig() {
        const config = window.getApiCredentials ? window.getApiCredentials() : {
            NADRA_API_URL: 'https://api.nadra.gov.pk/v1/verify',
            PASSPORT_API_URL: 'https://api.passport.gov.pk/v1/verify',
            NADRA_API_KEY: '',
            PASSPORT_API_KEY: '',
            NADRA_REQUESTER_ID: 'ministry_interior',
            PASSPORT_REQUESTER_ID: 'ministry_interior',
            API_TIMEOUT: 30000,
            API_RETRY_ATTEMPTS: 3,
            USE_SIMULATION: true
        };

        this.nadraApiUrl = config.NADRA_API_URL;
        this.passportApiUrl = config.PASSPORT_API_URL;
        this.nadraApiKey = config.NADRA_API_KEY;
        this.passportApiKey = config.PASSPORT_API_KEY;
        this.nadraRequesterId = config.NADRA_REQUESTER_ID;
        this.passportRequesterId = config.PASSPORT_REQUESTER_ID;
        this.apiTimeout = parseInt(config.API_TIMEOUT);
        this.retryAttempts = parseInt(config.API_RETRY_ATTEMPTS);
        this.useSimulation = config.USE_SIMULATION;
    }

    async callNadraApi(citizenId) {
        const requestPayload = {
            citizen_id: citizenId,
            verification_type: 'basic_info',
            requester_id: this.nadraRequesterId
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);

            const response = await fetch(this.nadraApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.nadraApiKey}`,
                    'X-API-Version': '1.0'
                },
                body: JSON.stringify(requestPayload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`NADRA API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.status === 'SUCCESS') {
                return {
                    status: 'SUCCESS',
                    data: {
                        first_name: data.data.first_name,
                        last_name: data.data.last_name,
                        father_name: data.data.father_name,
                        mother_name: data.data.mother_name,
                        pakistan_city: data.data.pakistan_city,
                        date_of_birth: data.data.date_of_birth,
                        birth_country: data.data.birth_country,
                        birth_city: data.data.birth_city,
                        profession: data.data.profession,
                        pakistan_address: data.data.pakistan_address,
                        verification_status: data.data.verification_status
                    },
                    response_id: data.response_id,
                    timestamp: data.timestamp
                };
            } else {
                throw new Error(`NADRA verification failed: ${data.error_message}`);
            }
        } catch (error) {
            console.error('NADRA API call failed:', error);
            
            return {
                status: 'ERROR',
                error_code: error.name === 'AbortError' ? 'TIMEOUT' : 'API_ERROR',
                error_message: error.message,
                citizen_id: citizenId,
                timestamp: new Date().toISOString()
            };
        }
    }

    async callPassportApi(citizenId, passportNumber = null) {
        const requestPayload = {
            citizen_id: citizenId,
            verification_type: 'document_check',
            requester_id: this.passportRequesterId
        };

        if (passportNumber) {
            requestPayload.passport_number = passportNumber;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);

            const response = await fetch(this.passportApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.passportApiKey}`,
                    'X-API-Version': '1.0'
                },
                body: JSON.stringify(requestPayload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Passport API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.status === 'SUCCESS') {
                return {
                    status: 'SUCCESS',
                    data: {
                        first_name: data.data.first_name,
                        last_name: data.data.last_name,
                        father_name: data.data.father_name,
                        mother_name: data.data.mother_name,
                        pakistan_city: data.data.pakistan_city,
                        date_of_birth: data.data.date_of_birth,
                        birth_country: data.data.birth_country,
                        birth_city: data.data.birth_city,
                        profession: data.data.profession,
                        pakistan_address: data.data.pakistan_address,
                        passport_status: data.data.passport_status,
                        issue_date: data.data.issue_date,
                        expiry_date: data.data.expiry_date,
                        issuing_authority: data.data.issuing_authority
                    },
                    passport_number: data.passport_number,
                    response_id: data.response_id,
                    timestamp: data.timestamp
                };
            } else {
                throw new Error(`Passport verification failed: ${data.error_message}`);
            }
        } catch (error) {
            console.error('Passport API call failed:', error);
            
            return {
                status: 'ERROR',
                error_code: error.name === 'AbortError' ? 'TIMEOUT' : 'API_ERROR',
                error_message: error.message,
                citizen_id: citizenId,
                passport_number: passportNumber,
                timestamp: new Date().toISOString()
            };
        }
    }

    async fetchThirdPartyData(citizenId, passportNumber = null) {
        try {
            const promises = [
                this.callNadraApi(citizenId)
            ];

            if (passportNumber) {
                promises.push(this.callPassportApi(citizenId, passportNumber));
            }

            const results = await Promise.all(promises);
            const nadraData = results[0];
            const passportData = results[1] || null;

            return {
                nadra: nadraData,
                passport: passportData,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching third-party data:', error);
            throw error;
        }
    }

    async retryApiCall(apiFunction, ...args) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const result = await apiFunction.apply(this, args);
                if (result.status === 'SUCCESS') {
                    return result;
                }
                lastError = result;
            } catch (error) {
                lastError = error;
                console.warn(`API call attempt ${attempt} failed:`, error);
                
                if (attempt < this.retryAttempts) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    simulateNadraApiCall(citizenId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    status: 'SUCCESS',
                    citizen_id: citizenId,
                    data: {
                        first_name: 'John',
                        last_name: 'Doe',
                        father_name: 'Robert Doe',
                        mother_name: 'Jane Doe',
                        pakistan_city: 'Karachi',
                        date_of_birth: '1990-01-01',
                        birth_country: 'Pakistan',
                        birth_city: 'Lahore',
                        profession: 'Software Engineer',
                        pakistan_address: '123 Main Street, Karachi',
                        verification_status: 'VERIFIED'
                    },
                    response_id: `NADRA_SIM_${Date.now()}`,
                    timestamp: new Date().toISOString()
                });
            }, 1500);
        });
    }

    simulatePassportApiCall(citizenId, passportNumber = null) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    status: 'SUCCESS',
                    citizen_id: citizenId,
                    passport_number: passportNumber || 'AA1234567',
                    data: {
                        first_name: 'John',
                        last_name: 'Doe',
                        father_name: 'Robert Doe',
                        mother_name: 'Jane Doe',
                        pakistan_city: 'Karachi',
                        date_of_birth: '1990-01-01',
                        birth_country: 'Pakistan',
                        birth_city: 'Lahore',
                        profession: 'Software Engineer',
                        pakistan_address: '123 Main Street, Karachi',
                        passport_status: 'ACTIVE',
                        issue_date: '2020-01-15',
                        expiry_date: '2030-01-15',
                        issuing_authority: 'Passport Office Karachi'
                    },
                    response_id: `PASSPORT_SIM_${Date.now()}`,
                    timestamp: new Date().toISOString()
                });
            }, 1500);
        });
    }
}

const apiService = new ApiService();

export default apiService;
export { ApiService };