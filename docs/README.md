# ETD System - Emergency Travel Document Management

A production-ready Emergency Travel Document Management System for government agencies.

## 🏗️ Architecture Overview

The ETD System follows a modular, production-level architecture with clear separation of concerns:

```
ETD/
├── src/                          # Source code
│   ├── pages/                    # HTML pages organized by function
│   │   ├── auth/                 # Authentication pages
│   │   ├── dashboards/           # Dashboard pages
│   │   ├── forms/                # Form pages
│   │   └── views/                # Data view pages
│   ├── styles/                   # CSS stylesheets
│   │   ├── components/           # Component-specific styles
│   │   ├── layouts/              # Layout styles
│   │   └── pages/                # Page-specific styles
│   ├── scripts/                  # JavaScript files
│   └── components/               # Reusable components (future)
├── public/                       # Public assets
│   └── assets/                   # Images, icons, fonts
├── config/                       # Configuration files
├── docs/                         # Documentation
├── build/                        # Development build output
├── dist/                         # Production build output
├── index.html                    # Application entry point
└── package.json                  # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js (>= 14.0.0)
- npm (>= 6.0.0)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/agency/etd-system.git
   cd etd-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🛠️ Development Workflow

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with live reload |
| `npm run build` | Build for production |
| `npm run build:clean` | Clean build directory |
| `npm run build:copy` | Copy source files to build |
| `npm run build:optimize` | Optimize assets for production |
| `npm run serve:build` | Serve production build locally |
| `npm run lint` | Lint JavaScript files |
| `npm run format` | Format code with Prettier |
| `npm run validate` | Validate HTML files |

### Development Server

The development server runs on `http://localhost:3000` with:
- Live reload for instant updates
- Source maps for debugging
- CORS enabled for API testing
- Detailed error reporting

### Build Process

The build process includes:
1. **Clean**: Remove previous build artifacts
2. **Copy**: Copy source files to build directory
3. **Optimize**: Minify CSS/JS, optimize images
4. **Validate**: Check HTML syntax and structure

## 🔐 Authentication & Authorization

### User Roles

The system supports three main user roles:

| Role | Username | Permissions | Landing Page |
|------|----------|-------------|--------------|
| **FM** (Foreign Ministry) | `fm` | Dashboard view, Create forms, View ETD data, Print tokens | FM Dashboard |
| **HQ** (Headquarters) | `hq` | Dashboard view, View details, Send verification | HQ Dashboard |
| **Agency** (Processing Agency) | `agency` | Dashboard view, Verify documents, Upload files | Agency Dashboard |

### Login Process

1. Navigate to login page
2. Enter username and password
3. System validates credentials
4. Redirects to role-specific dashboard
5. Session is maintained via localStorage

### Security Features

- Session timeout (configurable)
- Brute force protection
- CSRF protection
- XSS prevention
- Secure headers in production

## 📁 File Organization

### Page Structure

**Authentication Pages** (`src/pages/auth/`)
- `index.html` - Application entry point
- `login.html` - User authentication

**Dashboard Pages** (`src/pages/dashboards/`)
- `FMdashboard.html` - Foreign Ministry dashboard
- `HQdashboard.html` - Headquarters dashboard
- `AgencyDashboard.html` - Agency dashboard

**Form Pages** (`src/pages/forms/`)
- `Citizen.html` - Citizen data entry
- `Nadra-and-passport.html` - NADRA & passport verification
- `SB.html` - Special branch processing

**View Pages** (`src/pages/views/`)
- `AgencyView.html` - Agency document review
- `HQview.html` - HQ document review
- `ETDdataviewApproved.html` - Approved ETD data
- `ETDdataViewNotApproved.html` - Pending ETD data
- `ETD-remarks2.html` - ETD remarks and QC

### Style Organization

**Component Styles** (`src/styles/components/`)
- Reusable UI components
- Form controls, buttons, modals

**Layout Styles** (`src/styles/layouts/`)
- Page layouts and grids
- Header, footer, navigation

**Page Styles** (`src/styles/pages/`)
- Page-specific styling
- Dashboard layouts, form styling

## 🔄 Navigation Flow

### Complete User Journeys

**FM (Foreign Ministry) Flow:**
```
Login → FM Dashboard → New Form → Citizen Entry → NADRA/Passport → Print Token
                   → View Record → ETD Data (Approved/Not Approved) → Remarks → QC
```

**HQ (Headquarters) Flow:**
```
Login → HQ Dashboard → View Details → HQ Review → Send for Verification → SB Processing
```

**Agency Flow:**
```
Login → Agency Dashboard → View Document → Agency Review → Upload Files → Verify/Reject
```

### Router Configuration

The `ETDRouter` class handles all navigation with:
- Automatic path resolution
- Authentication checks
- Role-based redirects
- Session management

## ⚙️ Configuration

### Application Configuration (`config/app.config.js`)

Central configuration for:
- Environment settings (dev/staging/prod)
- User roles and permissions
- Security settings
- UI/UX configuration
- Feature flags
- File upload settings
- Validation rules

### Deployment Configuration (`config/deployment.config.js`)

Deployment-specific settings:
- Build optimization
- Server configuration
- Security headers
- Cache settings
- Monitoring and logging

### Environment Variables

Copy `config/env.example.txt` to `.env` and configure:
- Database connections
- API endpoints
- Security keys
- External service URLs
- Email configuration

## 🚢 Deployment

### Development Deployment

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

### Staging Deployment

1. **Build for staging**
   ```bash
   NODE_ENV=staging npm run build
   ```

2. **Deploy to staging server**
   ```bash
   npm run serve:build
   ```

### Production Deployment

1. **Build for production**
   ```bash
   NODE_ENV=production npm run build
   ```

2. **Deploy to production server**
   - Copy `dist/` folder to web server
   - Configure web server (Apache/Nginx)
   - Set up SSL certificates
   - Configure security headers

### Web Server Configuration

**Nginx Example:**
```nginx
server {
    listen 443 ssl http2;
    server_name etd.gov.pk;
    
    root /var/www/etd-system/dist;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔧 Maintenance

### Regular Maintenance Tasks

1. **Update dependencies**
   ```bash
   npm audit
   npm update
   ```

2. **Code quality checks**
   ```bash
   npm run lint
   npm run validate
   ```

3. **Performance monitoring**
   - Monitor page load times
   - Check for memory leaks
   - Analyze bundle sizes

4. **Security updates**
   - Regular security audits
   - Update SSL certificates
   - Review access logs

### Troubleshooting

**Common Issues:**

1. **Login not working**
   - Check localStorage in browser
   - Verify router.js is loaded
   - Check console for errors

2. **Pages not loading**
   - Verify file paths in HTML
   - Check CSS/JS references
   - Ensure assets are accessible

3. **Navigation broken**
   - Check router configuration
   - Verify event bindings
   - Test with browser console

## 📊 Performance

### Optimization Features

- **Minified CSS/JS** in production
- **Image optimization** with compression
- **Lazy loading** for large assets
- **Browser caching** for static resources
- **GZIP compression** enabled

### Performance Metrics

Target performance benchmarks:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1

## 🔒 Security

### Security Measures

- **Content Security Policy** (CSP) headers
- **Cross-Site Scripting** (XSS) protection
- **Cross-Site Request Forgery** (CSRF) protection
- **Secure file uploads** with type validation
- **Rate limiting** for API endpoints
- **HTTPS enforcement** in production

### Data Protection

- **Session security** with secure tokens
- **Input validation** on all forms
- **File type restrictions** for uploads
- **No sensitive data** in client-side storage
- **Audit trails** for all actions

## 📈 Monitoring

### Application Monitoring

- **Error tracking** with detailed logs
- **Performance monitoring** for page loads
- **User session tracking** for analytics
- **Uptime monitoring** for availability

### Logging Configuration

- **Development**: Console + file logging
- **Staging**: File logging with rotation
- **Production**: Centralized logging system

## 🤝 Contributing

### Development Guidelines

1. **Code Style**
   - Use Prettier for formatting
   - Follow ESLint rules
   - Write semantic HTML
   - Use CSS BEM methodology

2. **File Organization**
   - Keep related files together
   - Use descriptive naming
   - Maintain consistent structure
   - Update documentation

3. **Testing**
   - Test all user flows
   - Verify cross-browser compatibility
   - Check responsive design
   - Validate HTML/CSS

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Refer to the troubleshooting guide
- Check the FAQ section

## 📝 License

This project is licensed for government use only. Unauthorized distribution or modification is prohibited.

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Maintained by:** Government Agency Development Team 