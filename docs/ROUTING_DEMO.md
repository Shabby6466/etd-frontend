# ETD System Routing Demo Guide

## 🚀 Quick Start

1. **Open `index.html` in your browser** - This is the entry point
2. **It will automatically redirect to `login.html`**

## 🔐 Login Credentials

Use these exact usernames (case-insensitive) to access different dashboards:

- **fm** (any password) → FM Dashboard
- **hq** (any password) → HQ Dashboard  
- **agency** (any password) → Agency Dashboard

## 📊 Complete Routing Flow

### 🟦 FM Dashboard Flow
```
login.html (username: fm) 
    ↓
FMdashboard.html
    ├── "View" button → Routes based on status:
    │   ├── "In progress" → ETDdataViewNotApproved.html
    │   └── "Completed" → ETDdataviewApproved.html
    │       └── "Print" button → ETD-remarks2.html
    │           ├── "QC Failed" → Back to ETDdataviewApproved.html
    │           └── "QC Passed" → Back to FMdashboard.html
    └── "New Form" button → Citizen.html
        └── "Save/Get Data" button → Nadra-and-passport.html
            └── "Print Token" button → Back to FMdashboard.html
```

### 🟩 HQ Dashboard Flow
```
login.html (username: hq)
    ↓
HQdashboard.html
    └── "View" button → HQview.html
        └── "Send For Verification" button → SB.html
```

### 🟨 Agency Dashboard Flow
```
login.html (username: agency)
    ↓
AgencyDashboard.html
    └── "View" button → AgencyView.html
        └── "Verified/Not Verified" buttons → 
            Upload popup → Back to AgencyDashboard.html
```

## 🧪 Testing Instructions

### Test FM Flow:
1. Login with username: `fm`
2. Click "New Form" → Should go to Citizen.html
3. Click "Save" button → Should go to Nadra-and-passport.html
4. Click "Print Token" → Should return to FMdashboard.html
5. Click "View" on any row:
   - Rows with "In progress" → ETDdataViewNotApproved.html
   - Rows with "Completed" → ETDdataviewApproved.html
6. In ETDdataviewApproved.html, click "Print" → ETD-remarks2.html
7. Test QC buttons:
   - "QC Failed" → Back to ETDdataviewApproved.html
   - "QC Passed" → Back to FMdashboard.html

### Test HQ Flow:
1. Login with username: `hq`
2. Click "View" on any row → Should go to HQview.html
3. Click "Send For Verification" → Should go to SB.html

### Test Agency Flow:
1. Login with username: `agency`
2. Click "View" on any row → Should go to AgencyView.html
3. Click "Verified" or "Not Verified" → Popup appears
4. Fill form and submit → Should return to AgencyDashboard.html

## 🔧 Authentication Features

- **Session Management**: Login state is preserved using localStorage
- **Auto-redirect**: Accessing protected pages without login redirects to login
- **Logout**: Click on user profile (avatar) in any dashboard to logout

## 🛡️ Security Features

- Each dashboard checks authentication on load
- Invalid credentials show error message
- Session persists across browser refreshes
- Clean logout clears session data

## 🎨 UI/UX Features

- **Consistent Theme**: All pages maintain the blue (#525EB1) color scheme
- **Responsive Design**: Works on different screen sizes
- **Smooth Navigation**: Instant page transitions
- **Error Handling**: User-friendly error messages

## 🔍 Debugging

Open browser console (F12) to see routing logs:
- Router initialization messages
- Navigation events
- Authentication checks
- Button click events

## 📁 File Structure

```
ETD/
├── index.html (Entry point)
├── login.html (Authentication)
├── js/router.js (Main routing logic)
├── FM Dashboard Files:
│   ├── FMdashboard.html
│   ├── ETDdataviewApproved.html
│   ├── ETDdataViewNotApproved.html
│   ├── ETD-remarks2.html
│   ├── Citizen.html
│   └── Nadra-and-passport.html
├── HQ Dashboard Files:
│   ├── HQdashboard.html
│   ├── HQview.html
│   └── SB.html
└── Agency Dashboard Files:
    ├── AgencyDashboard.html
    └── AgencyView.html
```

## 🚨 Common Issues & Solutions

**Issue**: Buttons not working
- **Solution**: Ensure router.js is loaded and check browser console for errors

**Issue**: Wrong page after login
- **Solution**: Use exact usernames: 'fm', 'hq', or 'agency'

**Issue**: Redirected to login unexpectedly
- **Solution**: This is normal security behavior when session expires

**Issue**: Popup doesn't navigate back
- **Solution**: Wait for form submission to complete (1-2 seconds)

## 💡 Tips for Development

1. **Testing**: Use browser's developer tools to simulate different scenarios
2. **Debugging**: Check console logs for routing events
3. **Customization**: Modify router.js to add new routes or change behavior
4. **Styling**: All pages use consistent CSS classes and theme colors

## 🎯 Ready to Test!

Start by opening `index.html` and follow the flows above. The system will guide you through each step with intuitive navigation and clear visual feedback. 