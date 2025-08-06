import { login } from './auth.js';

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginButton");

  // Handle login button click
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await handleLogin();
  });

  // Handle Enter key press on input fields
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const roleSelect = document.getElementById("userRole");

  if (usernameInput && passwordInput && roleSelect) {
    [usernameInput, passwordInput, roleSelect].forEach(input => {
      input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          await handleLogin();
        }
      });
    });
  }

  // Default role selection to FM for backward compatibility
  if (roleSelect && !roleSelect.value) {
    roleSelect.value = 'fm';
  }

  async function handleLogin() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const selectedRole = document.getElementById("userRole").value || 'fm';

    // Validate input
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    if (!selectedRole) {
      alert('Please select your role');
      return;
    }

    // Show loading state
    const loginButton = document.getElementById("loginButton");
    const originalText = loginButton.textContent;
    loginButton.textContent = 'Logging in...';
    loginButton.disabled = true;

    try {
      // Call login with selected role
      const result = await login(username, password, selectedRole);
      
      if (result && result.success) {
        // Login successful, user will be redirected automatically
        console.log(`Login successful for ${username} with role ${selectedRole}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      // Error handling is done in auth.js, just restore button state
    } finally {
      // Restore button state
      loginButton.textContent = originalText;
      loginButton.disabled = false;
    }
  }

  // Add visual feedback for role selection
  const roleSelect = document.getElementById("userRole");
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      const selectedRole = e.target.value;
      if (selectedRole) {
        console.log(`Selected role: ${selectedRole}`);
        // Could add visual feedback here if needed
      }
    });
  }
});