# PostWomen - Complete API Testing Platform

A comprehensive, enterprise-grade API testing platform built with React and Node.js that provides all the tools you need to design, test, and collaborate on APIs.

## 🌟 Features

### Core API Testing

- **Request Builder**: Full-featured HTTP client with multiple authentication methods
- **Response Viewer**: Advanced response analysis with syntax highlighting
- **Collection Management**: Organize and manage API collections
- **Environment Variables**: Dynamic variable management and templating

### Advanced Features

- **Mock Server**: Create dynamic mock APIs with template variables
- **WebSocket Testing**: Real-time WebSocket connection testing
- **Collection Runner**: Automated test execution and reporting
- **Team Collaboration**: Multi-user workspace management
- **Advanced Response Analysis**: Response comparison and schema validation
- **Theme Management**: Customizable UI themes
- **Import/Export**: Support for various API formats

### Developer Tools

- **Test Scripts**: Pre/post-request script execution
- **GraphQL Support**: GraphQL query builder and validation
- **OAuth Integration**: Complete OAuth 2.0 flow support
- **Workspace Management**: Project organization and team workflows

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Choudhary4/PostWomen_Frontend.git
cd PostWomen_Frontend
```

**2. Install backend dependencies**

```bash
cd backend
npm install
```

**3. Install frontend dependencies**

```bash
cd ../frontend
npm install
```

**4. Start the backend server**

```bash
cd ../backend
node server.js
```

Or use the batch file (Windows):
```bash
# Double-click: start-backend.bat
```

**5. Start the frontend development server**

```bash
cd ../frontend
npm start
```

**6. Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:9000

## 📖 Documentation

The application includes comprehensive interactive documentation accessible through the **"Docs"** tab in the main interface. This documentation covers:

- **Getting Started Guide**: Step-by-step setup instructions
- **Feature Tutorials**: Detailed guides for each feature
- **Best Practices**: Tips for efficient API testing
- **Troubleshooting**: Common issues and solutions

### Key Documentation Sections

1. **🚀 Getting Started** - Initial setup and verification
2. **🔧 API Request Builder** - Making and configuring HTTP requests
3. **🎭 Mock Server** - Creating and managing mock APIs
4. **🔌 WebSocket Testing** - Real-time connection testing
5. **👥 Team Collaboration** - Multi-user features
6. **⚡ Advanced Response Analysis** - Response comparison and validation
7. **🏢 Workspace Management** - Project organization
8. **🏃 Collection Runner** - Automated testing
9. **🎨 Theme Management** - UI customization
10. **💡 Tips & Best Practices** - Productivity enhancements

## 🛠️ Architecture

### Frontend (React)

```
frontend/
├── src/
│   ├── components/              # React components
│   │   ├── RequestBuilder.js
│   │   ├── MockServer.js
│   │   ├── WebSocketTesting.js
│   │   ├── TeamCollaboration.js
│   │   ├── Documentation.js    # Interactive docs
│   │   └── ...
│   ├── services/               # Service layer
│   │   ├── apiService.js
│   │   ├── storageService.js
│   │   └── ...
│   └── App.js                  # Main application
```

### Backend (Node.js/Express)

```
backend/
├── server.js                   # Main server file
├── services/                   # Service modules
│   ├── mockServerService.js
│   ├── webSocketService.js
│   ├── teamService.js
│   └── ...
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=9000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Mock Server Configuration

Mock servers support template variables for dynamic responses:

- `{{params.id}}` - URL parameters
- `{{faker.name.fullName}}` - Random names
- `{{faker.internet.email}}` - Random emails
- `{{date.now}}` - Current timestamp
- `{{random.int}}` - Random integers

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Collection Runner

Use the Collection Runner for automated testing:

1. Create a collection with test scripts
2. Configure environment variables
3. Run the collection with specified iterations
4. Review detailed test results

## 🤝 Team Collaboration

### Setting up Teams

1. Go to the Team tab
2. Create a new team workspace
3. Invite members with appropriate roles
4. Share collections and environments

### Roles and Permissions

- **Owner**: Full access and team management
- **Admin**: Manage members and settings
- **Member**: Access team resources
- **Viewer**: Read-only access

## 🎨 Customization

### Themes

The application supports multiple themes:

- **Light**: Clean and bright interface
- **Dark**: Easy on the eyes for long sessions
- **Monokai**: Developer-friendly color scheme
- **Ocean**: Calm blue tones

Create custom themes through the Theme Manager with:

- Color picker interface
- Live preview
- CSS variable system
- Export/import capabilities

## 🔌 API Integration

### Authentication Methods

- **Bearer Token**: JWT and API tokens
- **Basic Auth**: Username/password
- **API Key**: Header or query parameter
- **OAuth 2.0**: Complete OAuth flow support

### WebSocket Support

Real-time testing capabilities:

- Connection management
- Message sending/receiving
- Connection event monitoring
- Multiple connection support

## 📊 Analytics and Monitoring

### Response Analysis

- Performance metrics tracking
- Response size monitoring
- Status code analysis
- Response time trends

### Mock Server Analytics

- Request logging and monitoring
- Route matching analysis
- Usage statistics
- Performance insights

## 🚨 Troubleshooting

### Common Issues

#### Backend Connection Failed

- Ensure backend server is running on port 9000
- Check for port conflicts
- Verify firewall settings

#### CORS Errors

- Check API server CORS configuration
- Use proxy endpoint for cross-origin requests
- Add proper headers to requests

#### Mock Server Issues

- Verify mock configuration is enabled
- Check route patterns match request URLs
- Review request logs for debugging

### Getting Help

1. Check the interactive documentation (Docs tab)
2. Review the troubleshooting section
3. Check browser console for error messages
4. Verify backend server logs

## 🔄 Updates and Maintenance

### Updating Dependencies

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### Database Backup

Collections and configurations are stored locally. Regular backups recommended:

- Use Import/Export functionality
- Export collections as JSON
- Backup environment configurations

## 📋 Roadmap

### Upcoming Features

- [ ] API Documentation Generator
- [ ] Performance Testing Suite
- [ ] Advanced Monitoring Dashboard
- [ ] Plugin System
- [ ] Cloud Synchronization
- [ ] Mobile Companion App

### Recent Updates

- ✅ Interactive Documentation System
- ✅ Enhanced Mock Server with Templates
- ✅ Advanced Response Comparison
- ✅ Team Collaboration Features
- ✅ Workspace Management

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React and Node.js
- UI components styled with Tailwind CSS
- Icons provided by Lucide React
- Mock data generation using Faker.js

---

**For detailed feature instructions and step-by-step guides, visit the Documentation tab in the application interface.** 
