import { login } from './auth.js';

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginButton");

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // Always use 'fm' as locationId
    await login(username, password, 'fm');
  });

  // Handle Enter key press on input fields
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  if (usernameInput && passwordInput) {
    [usernameInput, passwordInput].forEach(input => {
      input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          const username = usernameInput.value.trim();
          const password = passwordInput.value.trim();
          
          if (username && password) {
            await login(username, password, 'fm');
          } else {
            alert('Please enter both username and password');
          }
        }
      });
    });
  }
});