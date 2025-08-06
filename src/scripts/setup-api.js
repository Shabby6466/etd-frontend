function setupApiCredentials() {
    const apiKeyForm = document.createElement('div');
    apiKeyForm.innerHTML = `
        <div id="api-setup-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
        ">
            <div style="
                background: white;
                padding: 32px;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            ">
                <h3 style="margin: 0 0 24px 0; color: #525EB1;">API Configuration Setup</h3>
                <p style="margin: 0 0 24px 0; color: #666; font-size: 14px;">
                    Configure API credentials for NADRA and Passport services. Leave empty to use simulation mode.
                </p>
                
                <form id="api-credentials-form">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; color: #333; font-size: 14px; font-weight: 500;">
                            NADRA API Key:
                        </label>
                        <input type="password" id="nadra-key" placeholder="Enter NADRA API key" style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 8px; color: #333; font-size: 14px; font-weight: 500;">
                            Passport API Key:
                        </label>
                        <input type="password" id="passport-key" placeholder="Enter Passport API key" style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>
                    
                    <div style="margin-bottom: 24px;">
                        <label style="display: flex; align-items: center; font-size: 14px; color: #333;">
                            <input type="checkbox" id="use-simulation" checked style="margin-right: 8px;">
                            Use simulation mode (recommended for testing)
                        </label>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" id="cancel-setup" style="
                            padding: 12px 24px;
                            background: #f5f5f5;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            color: #666;
                        ">Cancel</button>
                        <button type="submit" style="
                            padding: 12px 24px;
                            background: #525EB1;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Save Configuration</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(apiKeyForm);

    const form = document.getElementById('api-credentials-form');
    const cancelBtn = document.getElementById('cancel-setup');
    const modal = document.getElementById('api-setup-modal');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nadraKey = document.getElementById('nadra-key').value.trim();
        const passportKey = document.getElementById('passport-key').value.trim();
        const useSimulation = document.getElementById('use-simulation').checked;

        if (window.setApiCredentials) {
            window.setApiCredentials(nadraKey, passportKey);
        }

        const config = {
            NADRA_API_KEY: nadraKey,
            PASSPORT_API_KEY: passportKey,
            USE_SIMULATION: useSimulation || (!nadraKey && !passportKey)
        };

        sessionStorage.setItem('api_setup_complete', 'true');
        sessionStorage.setItem('api_config', JSON.stringify(config));

        document.body.removeChild(apiKeyForm);
        
        const notification = document.createElement('div');
        notification.textContent = 'API configuration saved successfully!';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            z-index: 10001;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    });

    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(apiKeyForm);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(apiKeyForm);
        }
    });
}

function checkApiSetup() {
    const setupComplete = sessionStorage.getItem('api_setup_complete');
    if (!setupComplete) {
        setTimeout(() => {
            setupApiCredentials();
        }, 1000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkApiSetup);
} else {
    checkApiSetup();
}

window.setupApiCredentials = setupApiCredentials;