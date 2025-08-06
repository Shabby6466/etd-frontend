# ETD Frontend Complete API Integration Documentation

## Overview

This document describes the complete frontend implementation of all API integrations for the Emergency Travel Document (ETD) system. The integration includes NADRA and Passport verification APIs, plus full backend ETD application management APIs.

## Architecture

The API integration consists of several key components:

### 1. API Service (`src/scripts/api-service.js`)
- Main service class for handling API calls
- Supports both real API calls and simulation mode
- Implements retry logic and error handling
- Handles NADRA and Passport API endpoints

### 2. Form Handler (`src/scripts/form-handler.js`)
- Manages form interactions and data population
- Validates input data before API calls
- Provides user feedback and loading states
- Auto-populates form fields with API responses

### 3. Configuration (`config/api.config.js`)
- Environment-specific API configurations
- Credential management
- Feature flags for simulation mode

### 4. Backend API Service (`src/scripts/backend-api-service.js`)
- Complete ETD backend API integration
- Authentication, users, applications, documents
- File upload and management
- Application lifecycle management

### 5. ETD Form Manager (`src/scripts/etd-form-manager.js`)
- Comprehensive form management
- Application creation and submission
- Integration with third-party APIs
- Form validation and error handling

### 6. File Upload Handler (`src/scripts/file-upload-handler.js`)
- Advanced file upload capabilities
- Drag and drop support
- Progress tracking and validation
- Multiple file handling

### 7. Setup Script (`src/scripts/setup-api.js`)
- User interface for API credential configuration
- One-time setup for API keys
- Simulation mode toggle

## Features

### ✅ Implemented Features

1. **NADRA API Integration**
   - Citizen ID verification
   - Personal information retrieval
   - Error handling and validation

2. **Passport API Integration**
   - Passport number verification
   - Document status checking
   - Travel document validation

3. **Simulation Mode**
   - Mock API responses for testing
   - Realistic data simulation
   - No external dependencies

4. **Form Auto-Population**
   - Automatic field mapping
   - Data validation
   - User feedback

5. **Security Features**
   - API key management
   - Session-based configuration
   - Input validation

6. **Backend ETD APIs**
   - Complete application lifecycle management
   - User authentication and management
   - Document creation and tracking
   - File upload with progress tracking

7. **Advanced File Upload**
   - Drag and drop interface
   - Multiple file support
   - Real-time progress tracking
   - File validation and error handling

8. **Error Handling**
   - Network timeout handling
   - Retry mechanisms
   - User-friendly error messages
   - Comprehensive validation

## File Structure

```
etd-frontend/
├── src/scripts/
│   ├── api-service.js           # NADRA/Passport API service
│   ├── backend-api-service.js   # ETD backend API service
│   ├── form-handler.js          # Basic form management
│   ├── etd-form-manager.js      # Advanced ETD form management
│   ├── file-upload-handler.js   # File upload management
│   ├── setup-api.js            # API setup interface
│   └── auth.js                 # Authentication (enhanced)
├── config/
│   ├── api.config.js       # API configuration
│   └── app.config.js       # App configuration (existing)
├── src/pages/forms/
│   ├── Citizen.html        # Updated with API integration
│   └── Nadra-and-passport.html # Updated with API integration
├── .env.example            # Environment variables template
└── docs/
    └── API_INTEGRATION.md  # This documentation
```

## Usage

### 1. Basic Setup

When users first visit the form pages, they'll see a setup modal to configure API credentials:

- **NADRA API Key**: Enter your NADRA API key
- **Passport API Key**: Enter your Passport API key
- **Simulation Mode**: Toggle for testing without real APIs

### 2. Form Integration

The "Get Data" button on forms now:
1. Validates citizen ID format
2. Calls NADRA/Passport APIs (or simulations)
3. Auto-populates form fields
4. Shows loading states and notifications

### 3. API Responses

The system handles both success and error responses:

**Success Response Example:**
```json
{
  "status": "SUCCESS",
  "citizen_id": "384040000000",
  "data": {
    "first_name": "John",
    "last_name": "Doe",
    "father_name": "Robert Doe",
    "mother_name": "Jane Doe",
    "pakistan_city": "Karachi",
    "date_of_birth": "1990-01-01",
    "birth_country": "Pakistan",
    "birth_city": "Lahore",
    "profession": "Software Engineer",
    "pakistan_address": "123 Main Street, Karachi",
    "verification_status": "VERIFIED"
  },
  "response_id": "NADRA_REQ_20231129_001",
  "timestamp": "2023-11-29T08:12:24.980Z"
}
```

## Configuration

### Environment Variables (`.env`)

```bash
# NADRA API Configuration
NADRA_API_URL=https://api.nadra.gov.pk/v1/verify
NADRA_API_KEY=your_nadra_api_key_here
NADRA_REQUESTER_ID=ministry_interior

# Passport API Configuration
PASSPORT_API_URL=https://api.passport.gov.pk/v1/verify
PASSPORT_API_KEY=your_passport_api_key_here
PASSPORT_REQUESTER_ID=ministry_interior

# API Settings
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3

# Development Settings
USE_SIMULATION=true
DEBUG_MODE=true
```

### Runtime Configuration

API settings can be configured at runtime through:
1. Setup modal (first visit)
2. Browser session storage
3. JavaScript configuration

## All Integrated APIs

### 1. NADRA API (Third-party)

**Endpoint:** `POST /v1/verify`

**Request:**
```json
{
  "citizen_id": "384040000000",
  "verification_type": "basic_info",
  "requester_id": "ministry_interior"
}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {NADRA_API_KEY}
X-API-Version: 1.0
```

### 2. Passport API (Third-party)

**Endpoint:** `POST /v1/verify`

**Request:**
```json
{
  "citizen_id": "384040000000",
  "passport_number": "AA1234567",
  "verification_type": "document_check",
  "requester_id": "ministry_interior"
}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {PASSPORT_API_KEY}
X-API-Version: 1.0
```

### 3. Authentication API (Backend)

**Base URL:** `http://localhost:3837/v1/api/auth` (dev) or `/api/v1/auth` (prod)

**Endpoints:**
- `POST /login` - User login
- `POST /logout` - User logout  
- `POST /refresh` - Refresh auth token

### 4. Users API (Backend)

**Base URL:** `http://localhost:3837/v1/api/users` (dev) or `/api/v1/users` (prod)

**Endpoints:**
- `GET /me` - Get current user info
- `GET /` - Get users list (with filters)
- `PUT /:userId` - Update user info

### 5. Applications API (Backend)

**Base URL:** `http://localhost:3837/v1/api/applications` (dev) or `/api/v1/applications` (prod)

**Endpoints:**
- `POST /` - Create new application
- `GET /:id` - Get application by ID
- `PUT /:id` - Update application
- `GET /` - Get applications list (with filters)
- `POST /:id/submit` - Submit application
- `POST /:id/approve` - Approve application
- `POST /:id/reject` - Reject application
- `POST /:id/verify` - Verify application
- `POST /generate-tracking` - Generate tracking ID
- `POST /:id/print/:type` - Print document

### 6. Documents API (Backend)

**Base URL:** `http://localhost:3837/v1/api/documents` (dev) or `/api/v1/documents` (prod)

**Endpoints:**
- `GET /:id` - Get document by ID
- `GET /` - Get documents list (with filters)
- `POST /` - Create new document
- `PUT /:id` - Update document
- `DELETE /:id` - Delete document

### 7. File Upload API (Backend)

**Base URL:** `http://localhost:3837/v1/api/uploads` (dev) or `/api/v1/uploads` (prod)

**Endpoints:**
- `POST /` - Upload file(s)
- `GET /:id` - Get file info
- `DELETE /:id` - Delete file

### 8. Health Check API (Backend)

**Endpoint:** `GET /api/v1/health` - Check API health status

## Error Handling

The system handles various error scenarios:

1. **Network Errors**: Timeout, connection issues
2. **API Errors**: Invalid credentials, service unavailable
3. **Validation Errors**: Invalid citizen ID, passport format
4. **Rate Limiting**: Too many requests

## Security Considerations

1. **API Keys**: Stored securely in session storage, not persistent
2. **Input Validation**: All inputs validated before API calls
3. **Error Logging**: Sensitive information excluded from logs
4. **CORS**: Configured for government domains only

## Testing

### Simulation Mode

When `USE_SIMULATION=true`, the system uses mock data:

- No external API calls made
- Realistic response delays (1.5 seconds)
- Consistent mock data for testing
- All features work without API credentials

### Manual Testing

1. Load the Citizen form
2. Configure API credentials (or use simulation)
3. Enter a valid citizen ID (e.g., "61101-3082523-9")
4. Click "Get Data" button
5. Verify form auto-population
6. Check browser console for logs

## Troubleshooting

### Common Issues

1. **"Get Data" button not responding**
   - Check browser console for JavaScript errors
   - Ensure all script files are loaded correctly

2. **API calls failing**
   - Verify API credentials are correct
   - Check network connectivity
   - Enable simulation mode for testing

3. **Form fields not populating**
   - Check API response format matches expected structure
   - Verify field selectors in form-handler.js

4. **Setup modal not appearing**
   - Clear browser session storage
   - Refresh the page
   - Check JavaScript console for errors

### Debug Mode

Enable debug mode by adding to browser console:
```javascript
sessionStorage.setItem('debug_api', 'true');
```

This will show detailed logs of API calls and responses.

## Future Enhancements

Potential improvements for future versions:

1. **Offline Caching**: Store API responses for offline use
2. **Batch Processing**: Support multiple citizen IDs at once
3. **Advanced Validation**: More comprehensive data validation
4. **Audit Logging**: Detailed logging for compliance
5. **Multi-language Support**: Localization for different languages

## Support

For technical support or API-related issues:

- **System Administrator**: [contact details]
- **NADRA API Support**: [contact details]  
- **Passport API Support**: [contact details]

## Changelog

### Version 1.0.0 (Current)
- Initial implementation of NADRA and Passport API integration
- Form auto-population functionality
- Simulation mode for testing
- API credential management
- Error handling and user feedback

---

*Last updated: [Current Date]*
*Document version: 1.0.0*