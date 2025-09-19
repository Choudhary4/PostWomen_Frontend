import React, { useState, useEffect } from 'react';
import { 
  Book, ChevronRight, ChevronDown, Play, Code, Users, Database, 
  Zap, Palette, FolderOpen, Send, Globe, Server, Wifi, BarChart,
  CheckCircle, Copy, ExternalLink, AlertCircle, Info, Target,
  ArrowRight, Monitor, Smartphone, Download, Upload, Settings,
  Shield, Clock, TrendingUp, Archive, Search, Filter, Plus,
  GitCompare, Eye, RefreshCw, Template, Activity, Star, Home,
  Video, Lightbulb, HelpCircle, Award, Bookmark, MessageSquare,
  ThumbsUp, Sparkles, MapPin, Timer, FileText, PenTool, Layers,
  Command, MousePointer, RotateCcw, FastForward, Maximize, X,
  Moon
} from 'lucide-react';

const Documentation = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSections, setExpandedSections] = useState(new Set(['getting-started']));
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [currentDemo, setCurrentDemo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmarkedSections, setBookmarkedSections] = useState(new Set());
  const [userProgress, setUserProgress] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState({});
  const [darkMode, setDarkMode] = useState(false);

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const markStepComplete = (stepId) => {
    setCompletedSteps(new Set([...completedSteps, stepId]));
    updateProgress();
  };

  const toggleBookmark = (sectionId) => {
    const newBookmarks = new Set(bookmarkedSections);
    if (newBookmarks.has(sectionId)) {
      newBookmarks.delete(sectionId);
    } else {
      newBookmarks.add(sectionId);
    }
    setBookmarkedSections(newBookmarks);
  };

  const updateProgress = () => {
    const totalSteps = Object.values(documentation).reduce((total, section) => {
      if (section.sections) {
        return total + section.sections.reduce((sectionTotal, subsection) => {
          return sectionTotal + (subsection.content?.filter(item => item.step)?.length || 0);
        }, 0);
      }
      return total;
    }, 0);
    
    const progress = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0;
    setUserProgress(Math.round(progress));
  };

  const rateSectionHelpfulness = (sectionId, rating) => {
    setFeedbackRating({
      ...feedbackRating,
      [sectionId]: rating
    });
  };

  const copyToClipboard = (text, event) => {
    navigator.clipboard.writeText(text);
    // Show temporary success message
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  };

  useEffect(() => {
    updateProgress();
  }, [completedSteps]);

  // Auto-save progress to localStorage
  useEffect(() => {
    localStorage.setItem('docsProgress', JSON.stringify({
      completedSteps: Array.from(completedSteps),
      bookmarkedSections: Array.from(bookmarkedSections),
      userProgress
    }));
  }, [completedSteps, bookmarkedSections, userProgress]);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('docsProgress');
    if (saved) {
      const data = JSON.parse(saved);
      setCompletedSteps(new Set(data.completedSteps || []));
      setBookmarkedSections(new Set(data.bookmarkedSections || []));
      setUserProgress(data.userProgress || 0);
    }
  }, []);

  const documentation = {
    overview: {
      title: "📚 PostWomen - Complete Guide",
      description: "A comprehensive API testing platform with enterprise-grade features",
      difficulty: "Beginner",
      estimatedTime: "5 minutes",
      content: {
        intro: "PostWomen is a powerful API testing and development platform that provides all the tools you need to design, test, and collaborate on APIs. From simple HTTP requests to complex enterprise workflows, this guide will help you master every feature.",
        features: [
          "API Request Builder with multiple authentication methods",
          "Response Analysis and Comparison Tools", 
          "Mock Server with dynamic data generation",
          "WebSocket Testing for real-time communication",
          "Team Collaboration and Workspace Management",
          "Advanced Response Processing and Caching",
          "Theme Management and Customization",
          "Collection Runner for automated testing",
          "Environment and Variable Management",
          "Import/Export capabilities"
        ],
        quickLinks: [
          { title: "🚀 Get Started in 2 Minutes", target: "getting-started", icon: FastForward },
          { title: "🔧 Build Your First API Request", target: "api-builder.basic-requests", icon: Code },
          { title: "🎭 Create a Mock Server", target: "mock-server.creating-mocks", icon: Server },
          { title: "💡 Pro Tips & Shortcuts", target: "tips-tricks.productivity-tips", icon: Lightbulb }
        ],
        stats: {
          totalFeatures: 10,
          supportedMethods: 8,
          authTypes: 4,
          themes: 4
        }
      }
    },
    'getting-started': {
      title: "🚀 Getting Started",
      icon: Play,
      difficulty: "Beginner",
      estimatedTime: "10 minutes",
      videoUrl: "demo-setup.mp4",
      prerequisites: ["Node.js installed", "Basic understanding of APIs"],
      sections: [
        {
          id: 'setup',
          title: 'Initial Setup',
          description: 'Get your environment ready for API testing',
          content: [
            {
              step: 1,
              title: "Start the Backend Server",
              description: "Before using any features, you need to start the backend server",
              code: `# Navigate to backend directory
cd C:\\Users\\DELL\\Desktop\\postman-mvp\\backend

# Start the server
node server.js

# Or use the batch file
# Double-click: start-backend.bat`,
              tip: "The server should start on port 9000. Look for the startup messages in the console.",
              troubleshooting: [
                "Port 9000 already in use? Kill the process: taskkill /f /im node.exe",
                "Permission errors? Run as administrator",
                "Module errors? Run: npm install"
              ]
            },
            {
              step: 2,
              title: "Launch the Frontend",
              description: "Start the React development server",
              code: `# Navigate to frontend directory
cd C:\\Users\\DELL\\Desktop\\postman-mvp\\frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm start`,
              tip: "The frontend will open at http://localhost:3000",
              expectedResult: "Browser opens automatically with the PostWomen interface"
            },
            {
              step: 3,
              title: "Verify Connection",
              description: "Check that the frontend can communicate with the backend",
              actions: [
                "Open any feature tab (Mock, WebSocket, etc.)",
                "Look for connection status indicators",
                "Green dot = Connected, Red dot = Disconnected"
              ],
              screenshot: "connection-status.png",
              validation: "You should see green connection indicators in all feature tabs"
            }
          ]
        },
        {
          id: 'first-request',
          title: 'Your First API Request',
          description: 'Make your first successful API call',
          content: [
            {
              step: 1,
              title: "Open Request Builder",
              description: "Navigate to the main API testing interface",
              actions: ["Click the 'Builder' tab", "You'll see the request configuration panel"]
            },
            {
              step: 2,
              title: "Test a Public API",
              description: "Send a request to a test API endpoint",
              example: "https://jsonplaceholder.typicode.com/posts/1",
              actions: [
                "Enter the URL above",
                "Keep method as 'GET'",
                "Click 'Send' button",
                "Review the response data"
              ],
              expectedResult: "JSON response with post data (userId, id, title, body)"
            }
          ]
        }
      ]
    },
    'api-builder': {
      title: "🔧 API Request Builder",
      icon: Code,
      difficulty: "Beginner",
      estimatedTime: "15 minutes",
      videoUrl: "api-builder-demo.mp4",
      relatedSections: ['collection-runner', 'tips-tricks'],
      sections: [
        {
          id: 'basic-requests',
          title: 'Making Basic Requests',
          description: 'Master the fundamentals of HTTP requests',
          content: [
            {
              step: 1,
              title: "Enter Request URL",
              description: "Start by entering the API endpoint you want to test",
              demo: "builder-url",
              example: "https://jsonplaceholder.typicode.com/posts/1",
              protip: "Use environment variables like {{baseUrl}}/posts/1 for reusable requests",
              commonMistakes: [
                "Forgetting protocol (http:// or https://)",
                "Trailing slashes causing 404 errors",
                "Invalid URL encoding"
              ]
            },
            {
              step: 2,
              title: "Select HTTP Method",
              description: "Choose the appropriate HTTP method for your request",
              options: [
                { method: "GET", purpose: "Retrieve data", useCase: "Fetching user profiles" },
                { method: "POST", purpose: "Create new resource", useCase: "Creating new user account" },
                { method: "PUT", purpose: "Update entire resource", useCase: "Updating complete user profile" },
                { method: "PATCH", purpose: "Partial update", useCase: "Updating user email only" },
                { method: "DELETE", purpose: "Remove resource", useCase: "Deleting user account" }
              ],
              interactive: true
            },
            {
              step: 3,
              title: "Add Headers",
              description: "Configure request headers as needed",
              example: {
                "Content-Type": "application/json",
                "Authorization": "Bearer your-token-here",
                "Accept": "application/json",
                "User-Agent": "PostmanMVP/1.0"
              },
              commonHeaders: [
                { header: "Content-Type", purpose: "Specify request body format" },
                { header: "Authorization", purpose: "Authentication credentials" },
                { header: "Accept", purpose: "Preferred response format" },
                { header: "Cache-Control", purpose: "Caching behavior" }
              ]
            },
            {
              step: 4,
              title: "Set Request Body",
              description: "For POST/PUT/PATCH requests, add the request body",
              formats: [
                { type: "JSON", description: "Structured data", example: '{"name": "John", "email": "john@example.com"}' },
                { type: "Form Data", description: "Key-value pairs", example: "name=John&email=john@example.com" },
                { type: "Raw Text", description: "Plain text content", example: "Simple text content" },
                { type: "Binary", description: "File uploads", example: "Select file from disk" }
              ],
              bestPractices: [
                "Always validate JSON syntax before sending",
                "Use proper Content-Type headers",
                "Consider request size limits"
              ]
            }
          ]
        },
        {
          id: 'authentication',
          title: 'Authentication Methods',
          content: [
            {
              title: "Bearer Token",
              description: "Most common for JWT tokens",
              setup: ["Go to Auth tab", "Select 'Bearer Token'", "Enter your token"]
            },
            {
              title: "API Key",
              description: "Custom header or query parameter",
              setup: ["Select 'API Key'", "Choose Header or Query", "Enter key name and value"]
            },
            {
              title: "Basic Auth",
              description: "Username and password authentication",
              setup: ["Select 'Basic Auth'", "Enter username and password"]
            }
          ]
        }
      ]
    },
    'mock-server': {
      title: "🎭 Mock Server",
      icon: Server,
      difficulty: "Intermediate",
      estimatedTime: "20 minutes",
      videoUrl: "mock-server-demo.mp4",
      prerequisites: ["Backend server running", "Basic understanding of REST APIs"],
      relatedSections: ['api-builder', 'collection-runner'],
      sections: [
        {
          id: 'creating-mocks',
          title: 'Creating Mock APIs',
          description: 'Build dynamic mock servers with realistic data',
          estimatedTime: "10 minutes",
          content: [
            {
              step: 1,
              title: "Create Mock Configuration",
              description: "Set up a new mock server configuration with proper naming and structure",
              actions: [
                "Go to Mock Server tab",
                "Click 'New Mock' button",
                "Enter configuration name (e.g., 'User API Mock')",
                "Set base URL (e.g., '/api/v1')",
                "Enable the configuration",
                "Click 'Create Configuration'"
              ],
              tip: "Use descriptive names for your mock configurations to easily identify them later",
              troubleshooting: [
                "If creation fails, check backend connection status",
                "Ensure unique configuration names",
                "Verify base URL format starts with '/'"
              ],
              expectedResult: "New mock configuration appears in the sidebar with enabled status"
            },
            {
              step: 2,
              title: "Add Mock Routes",
              description: "Define API endpoints with dynamic responses using template variables",
              actions: [
                "Select your configuration from sidebar",
                "Click '+ Add Route'",
                "Choose HTTP method (GET, POST, etc.)",
                "Enter route path (e.g., '/users/:id')",
                "Set response status code (200, 201, 404, etc.)",
                "Configure response body with templates"
              ],
              example: {
                "method": "GET",
                "path": "/users/:id",
                "status": 200,
                "response": {
                  "id": "{{params.id}}",
                  "name": "{{faker.name.fullName}}",
                  "email": "{{faker.internet.email}}",
                  "avatar": "{{faker.image.avatar}}",
                  "createdAt": "{{date.now}}",
                  "isActive": "{{random.boolean}}"
                }
              },
              protip: "Use path parameters like :id to make your routes dynamic and realistic"
            },
            {
              step: 3,
              title: "Use Template Variables",
              description: "Create dynamic responses with faker data and built-in variables",
              templates: {
                "{{params.id}}": "URL parameters from the request path",
                "{{query.limit}}": "Query string parameters",
                "{{faker.name.fullName}}": "Random full names",
                "{{faker.internet.email}}": "Random email addresses",
                "{{faker.phone.number}}": "Random phone numbers",
                "{{faker.address.city}}": "Random city names",
                "{{faker.company.name}}": "Random company names",
                "{{faker.lorem.sentence}}": "Random sentences",
                "{{date.now}}": "Current timestamp",
                "{{date.future}}": "Future date",
                "{{random.int}}": "Random integer (0-100)",
                "{{random.float}}": "Random decimal number",
                "{{random.boolean}}": "Random true/false",
                "{{random.uuid}}": "Random UUID"
              },
              commonMistakes: [
                "Forgetting double curly braces {{ }}",
                "Misspelling faker method names",
                "Using undefined template variables"
              ],
              bestPractices: [
                "Combine multiple faker methods for realistic data",
                "Use conditional responses based on parameters",
                "Include appropriate HTTP status codes",
                "Add response headers when needed"
              ]
            },
            {
              step: 4,
              title: "Advanced Route Patterns",
              description: "Create sophisticated mock APIs with multiple endpoints",
              examples: [
                {
                  title: "User CRUD Operations",
                  routes: [
                    "GET /users - List all users",
                    "GET /users/:id - Get specific user",
                    "POST /users - Create new user",
                    "PUT /users/:id - Update user",
                    "DELETE /users/:id - Delete user"
                  ]
                },
                {
                  title: "Nested Resources",
                  routes: [
                    "GET /users/:userId/posts - User's posts",
                    "GET /posts/:postId/comments - Post comments",
                    "POST /users/:userId/posts - Create user post"
                  ]
                },
                {
                  title: "Error Scenarios",
                  routes: [
                    "GET /users/999 - Return 404 Not Found",
                    "POST /users (invalid data) - Return 400 Bad Request",
                    "GET /protected - Return 401 Unauthorized"
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'testing-mocks',
          title: 'Testing Mock Endpoints',
          description: 'Validate and debug your mock server responses',
          estimatedTime: "10 minutes",
          content: [
            {
              step: 1,
              title: "Using the Built-in Tester",
              description: "Test your mock endpoints directly from the interface",
              actions: [
                "Go to 'Tester' tab in Mock Server",
                "Enter the mock URL",
                "Format: http://localhost:9000/mock/[baseUrl]/[route]",
                "Example: http://localhost:9000/mock/api/v1/users/123",
                "Select HTTP method",
                "Add request body if needed (for POST/PUT)",
                "Click 'Send Test Request'"
              ],
              tip: "Use the built-in tester to quickly validate routes before using them in your application",
              expectedResult: "Response displays with generated data based on your templates"
            },
            {
              step: 2,
              title: "External Testing",
              description: "Test mock endpoints from external tools and applications",
              tools: [
                {
                  name: "Browser",
                  usage: "Direct GET requests in address bar",
                  example: "http://localhost:9000/mock/api/v1/users"
                },
                {
                  name: "cURL",
                  usage: "Command line testing",
                  example: "curl http://localhost:9000/mock/api/v1/users/123"
                },
                {
                  name: "Your Application",
                  usage: "Replace real API URLs with mock URLs during development",
                  example: "const API_BASE = 'http://localhost:9000/mock/api/v1'"
                }
              ]
            },
            {
              step: 3,
              title: "Monitoring Request Logs",
              description: "View and analyze all requests to your mock server",
              features: [
                "Real-time request monitoring",
                "Request/response details",
                "Route matching status",
                "Response time tracking",
                "Error logging"
              ],
              actions: [
                "Go to 'Logs' tab in Mock Server",
                "View chronological list of all requests",
                "Click on any request to see details",
                "Check if routes matched correctly",
                "Review generated response data",
                "Clear logs when needed"
              ],
              troubleshooting: [
                "No logs appearing? Check if mock server is running",
                "Routes not matching? Verify path patterns",
                "Wrong data generated? Check template syntax",
                "500 errors? Look for JSON syntax errors in responses"
              ]
            }
          ]
        },
        {
          id: 'advanced-features',
          title: 'Advanced Mock Features',
          description: 'Master advanced mock server capabilities',
          content: [
            {
              title: "Conditional Responses",
              description: "Return different responses based on request parameters",
              example: `{
  "status": "{{#if params.id === '999'}}404{{else}}200{{/if}}",
  "data": "{{#if params.id === '999'}}null{{else}}{ user data }{{/if}}"
}`,
              useCases: [
                "Error simulation for specific IDs",
                "Different responses for different user types",
                "Pagination based on query parameters"
              ]
            },
            {
              title: "Response Headers",
              description: "Add custom headers to mock responses",
              examples: [
                "Content-Type: application/json",
                "Cache-Control: no-cache",
                "X-Total-Count: 100",
                "Authorization: Bearer token-example"
              ]
            },
            {
              title: "Delay Simulation",
              description: "Add realistic response delays",
              tip: "Add delays to simulate real network conditions and test loading states"
            }
          ]
        }
      ]
    },
    'websocket': {
      title: "🔌 WebSocket Testing",
      icon: Wifi,
      sections: [
        {
          id: 'websocket-setup',
          title: 'Setting up WebSocket Connections',
          content: [
            {
              step: 1,
              title: "Create Connection",
              description: "Establish a WebSocket connection",
              actions: [
                "Go to WebSocket tab",
                "Click 'New Connection'",
                "Enter WebSocket URL (e.g., wss://echo.websocket.org)",
                "Configure connection options",
                "Click 'Connect'"
              ]
            },
            {
              step: 2,
              title: "Send Messages",
              description: "Test real-time communication",
              messageTypes: ["Text - Plain text messages", "JSON - Structured data", "Binary - File data"]
            },
            {
              step: 3,
              title: "Monitor Messages",
              description: "View real-time message history",
              features: ["Incoming messages", "Outgoing messages", "Connection events", "Error messages"]
            }
          ]
        }
      ]
    },
    'team-collaboration': {
      title: "👥 Team Collaboration",
      icon: Users,
      sections: [
        {
          id: 'team-setup',
          title: 'Setting up Teams',
          content: [
            {
              step: 1,
              title: "Create a Team",
              description: "Set up collaboration workspace",
              actions: [
                "Go to Team tab",
                "Click 'Create Team'",
                "Enter team name and description",
                "Set team visibility (public/private)",
                "Define team permissions"
              ]
            },
            {
              step: 2,
              title: "Invite Members",
              description: "Add team members with roles",
              roles: [
                "Owner - Full access and management",
                "Admin - Manage members and settings", 
                "Member - Access team resources",
                "Viewer - Read-only access"
              ]
            }
          ]
        },
        {
          id: 'collaboration-features',
          title: 'Collaboration Features',
          content: [
            {
              title: "Real-time Activity",
              description: "See what team members are working on",
              features: ["Live user presence", "Activity feeds", "Recent changes", "Collaboration notifications"]
            },
            {
              title: "Shared Resources",
              description: "Work together on API collections",
              features: ["Shared collections", "Environment variables", "Team templates", "Version history"]
            }
          ]
        }
      ]
    },
    'advanced-response': {
      title: "⚡ Advanced Response Analysis",
      icon: BarChart,
      sections: [
        {
          id: 'response-comparison',
          title: 'Response Comparison',
          content: [
            {
              step: 1,
              title: "Cache Responses",
              description: "Automatically cache API responses for comparison",
              features: ["Response caching", "Performance metrics", "Size tracking", "Environment tagging"]
            },
            {
              step: 2,
              title: "Compare Responses",
              description: "Analyze differences between responses",
              actions: [
                "Go to Advanced Response tab",
                "Select 'Cache' tab",
                "Choose 2 responses to compare",
                "Click 'Compare Selected'",
                "View detailed diff analysis"
              ]
            }
          ]
        },
        {
          id: 'schema-validation',
          title: 'Schema Validation',
          content: [
            {
              step: 1,
              title: "Create Response Schema",
              description: "Define expected response structure",
              actions: [
                "Go to 'Schemas' tab",
                "Click 'Create Schema'",
                "Define JSON schema",
                "Add validation rules",
                "Save schema"
              ]
            },
            {
              step: 2,
              title: "Validate Responses",
              description: "Check responses against schemas",
              benefits: ["Ensure API consistency", "Catch breaking changes", "Validate data types", "Check required fields"]
            }
          ]
        }
      ]
    },
    'workspace-management': {
      title: "🏢 Workspace Management",
      icon: FolderOpen,
      sections: [
        {
          id: 'workspace-setup',
          title: 'Managing Workspaces',
          content: [
            {
              step: 1,
              title: "Create Workspaces",
              description: "Organize projects into workspaces",
              types: ["Personal - Individual projects", "Team - Collaborative projects", "Project - Specific initiatives"]
            },
            {
              step: 2,
              title: "Workspace Features",
              description: "Utilize workspace capabilities",
              features: [
                "Member management",
                "Activity tracking", 
                "Template library",
                "Backup & restore",
                "Analytics dashboard"
              ]
            }
          ]
        }
      ]
    },
    'collection-runner': {
      title: "🏃 Collection Runner",
      icon: Play,
      sections: [
        {
          id: 'automated-testing',
          title: 'Automated Testing',
          content: [
            {
              step: 1,
              title: "Prepare Collections",
              description: "Organize requests for automation",
              actions: [
                "Create or select a collection",
                "Add test scripts to requests",
                "Set up environment variables",
                "Define request order"
              ]
            },
            {
              step: 2,
              title: "Run Collections",
              description: "Execute automated test suites",
              options: ["Sequential execution", "Parallel execution", "Custom iterations", "Environment selection"]
            }
          ]
        }
      ]
    },
    'themes': {
      title: "🎨 Theme Management",
      icon: Palette,
      sections: [
        {
          id: 'theme-customization',
          title: 'Customizing Themes',
          content: [
            {
              step: 1,
              title: "Browse Themes",
              description: "Explore available themes",
              themes: ["Light - Clean and bright", "Dark - Easy on the eyes", "Monokai - Developer favorite", "Ocean - Calm blue tones"]
            },
            {
              step: 2,
              title: "Create Custom Themes",
              description: "Design your own color scheme",
              features: ["Color picker", "Live preview", "CSS variables", "Export/import themes"]
            }
          ]
        }
      ]
    },
    'tips-tricks': {
      title: "💡 Tips & Best Practices",
      icon: Star,
      sections: [
        {
          id: 'productivity-tips',
          title: 'Productivity Tips',
          content: [
            {
              title: "Keyboard Shortcuts",
              shortcuts: [
                "Ctrl + Enter - Send request",
                "Ctrl + S - Save request",
                "Ctrl + D - Duplicate request",
                "Ctrl + / - Toggle sidebar"
              ]
            },
            {
              title: "Environment Variables",
              description: "Use variables for dynamic values",
              examples: [
                "{{baseUrl}} - API base URL",
                "{{authToken}} - Authentication token",
                "{{userId}} - Dynamic user ID"
              ]
            },
            {
              title: "Test Scripts",
              description: "Add automated validations",
              examples: [
                "Status code validation",
                "Response time checks", 
                "Data validation",
                "Environment setup"
              ]
            }
          ]
        },
        {
          id: 'troubleshooting',
          title: 'Common Issues & Solutions',
          content: [
            {
              issue: "Backend Connection Failed",
              solutions: [
                "Ensure backend server is running on port 9000",
                "Check for port conflicts",
                "Verify firewall settings",
                "Look for error messages in console"
              ]
            },
            {
              issue: "CORS Errors",
              solutions: [
                "Check API server CORS configuration",
                "Use proxy endpoint for cross-origin requests",
                "Add proper headers to requests"
              ]
            },
            {
              issue: "Mock Server Not Working",
              solutions: [
                "Verify mock configuration is enabled",
                "Check route patterns match request URLs",
                "Review request logs for debugging",
                "Validate JSON response format"
              ]
            }
          ]
        }
      ]
    }
  };

  // Filter sections based on search term
  const filteredSections = Object.entries(documentation).filter(([key, section]) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return section.title.toLowerCase().includes(searchLower) ||
           (section.sections && section.sections.some(subsection => 
             subsection.title.toLowerCase().includes(searchLower)
           ));
  });

  const TableOfContents = () => (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto h-full">
      {/* Header with search and progress */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">📖 Documentation</h2>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Monitor className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Your Progress</span>
            <span>{userProgress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${userProgress}%` }}
            ></div>
          </div>
          {userProgress > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
              <Award className="w-3 h-3" />
              <span>{completedSteps.size} steps completed!</span>
            </div>
          )}
        </div>

        {/* Search box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4">
        {/* Quick actions */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Quick Start</div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveSection('getting-started.setup')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <FastForward className="w-4 h-4" />
              <span>2-Minute Setup</span>
            </button>
            <button
              onClick={() => setActiveSection('api-builder.basic-requests')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Target className="w-4 h-4" />
              <span>First API Request</span>
            </button>
          </div>
        </div>

        {/* Bookmarked sections */}
        {bookmarkedSections.size > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              <Bookmark className="w-3 h-3" />
              Bookmarked
            </div>
            {Array.from(bookmarkedSections).map(sectionKey => {
              const [mainKey, subKey] = sectionKey.split('.');
              const section = documentation[mainKey];
              const subsection = subKey ? section?.sections?.find(s => s.id === subKey) : null;
              const title = subsection ? subsection.title : section?.title;
              
              return (
                <button
                  key={sectionKey}
                  onClick={() => setActiveSection(sectionKey)}
                  className="w-full flex items-center gap-2 px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  <Star className="w-3 h-3" />
                  <span className="truncate">{title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main navigation */}
        <div className="space-y-2">
          <button
            onClick={() => setActiveSection('overview')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              📚 Overview
            </div>
          </button>
          
          {filteredSections.filter(([key]) => key !== 'overview').map(([key, section]) => {
            const Icon = section.icon || Book;
            const isExpanded = expandedSections.has(key);
            const isActive = activeSection === key || activeSection.startsWith(key + '.');
            const isBookmarked = bookmarkedSections.has(key);
            
            return (
              <div key={key}>
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      setActiveSection(key);
                      if (section.sections) {
                        toggleSection(key);
                      }
                    }}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{section.title}</span>
                      {section.difficulty && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          section.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' :
                          section.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {section.difficulty}
                        </span>
                      )}
                    </div>
                    {section.sections && (
                      isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleBookmark(key)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Bookmark section"
                  >
                    <Star className={`w-3 h-3 ${isBookmarked ? 'text-amber-500 fill-current' : 'text-gray-400'}`} />
                  </button>
                </div>
                
                {section.sections && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.sections.map(subsection => {
                      const subsectionKey = `${key}.${subsection.id}`;
                      const isSubBookmarked = bookmarkedSections.has(subsectionKey);
                      
                      return (
                        <div key={subsection.id} className="flex items-center">
                          <button
                            onClick={() => setActiveSection(subsectionKey)}
                            className={`flex-1 text-left px-3 py-1 rounded text-xs transition-colors ${
                              activeSection === subsectionKey
                                ? 'bg-blue-50 text-blue-600' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{subsection.title}</span>
                              {subsection.estimatedTime && (
                                <span className="text-xs text-gray-400">
                                  <Timer className="w-3 h-3 inline mr-1" />
                                  {subsection.estimatedTime}
                                </span>
                              )}
                            </div>
                          </button>
                          
                          <button
                            onClick={() => toggleBookmark(subsectionKey)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            title="Bookmark subsection"
                          >
                            <Star className={`w-3 h-3 ${isSubBookmarked ? 'text-amber-500 fill-current' : 'text-gray-400'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help section */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowVideoModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Video className="w-4 h-4" />
            <span>Video Tutorials</span>
          </button>
          <button
            onClick={() => window.open('https://github.com/your-repo/issues', '_blank')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mt-1"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Get Help</span>
            <ExternalLink className="w-3 h-3 ml-auto" />
          </button>
        </div>
      </nav>
    </div>
  );

  const renderContent = () => {
    const [mainKey, subKey] = activeSection.split('.');
    const section = documentation[mainKey];
    
    if (!section) return null;

    if (mainKey === 'overview') {
      return (
        <div className="max-w-4xl">
          {/* Hero section */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8">
            <h1 className="text-4xl font-bold mb-4">{section.title}</h1>
            <p className="text-xl mb-6 text-blue-100">{section.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{section.content.stats.totalFeatures}</div>
                <div className="text-blue-200 text-sm">Features</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{section.content.stats.supportedMethods}</div>
                <div className="text-blue-200 text-sm">HTTP Methods</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{section.content.stats.authTypes}</div>
                <div className="text-blue-200 text-sm">Auth Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{section.content.stats.themes}</div>
                <div className="text-blue-200 text-sm">Themes</div>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to PostWomen</h2>
            <p className="text-gray-700 leading-relaxed mb-6">{section.content.intro}</p>
            
            {/* Quick start buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.content.quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveSection(link.target)}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <Icon className="w-6 h-6 text-blue-500" />
                    <span className="font-medium text-gray-800">{link.title}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Features grid */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.content.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Getting started prompt */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">Ready to Get Started?</h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Make sure both the backend server and frontend are running before exploring features.
                </p>
                <button
                  onClick={() => setActiveSection('getting-started')}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <FastForward className="w-4 h-4" />
                  Start Setup Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (subKey && section.sections) {
      const subsection = section.sections.find(s => s.id === subKey);
      if (subsection) {
        return (
          <div className="max-w-4xl">
            {/* Section header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Book className="w-4 h-4" />
                {section.title} → {subsection.title}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{subsection.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{subsection.description}</p>
              
              {/* Meta information */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {section.difficulty && (
                  <span className={`px-2 py-1 rounded-full ${
                    section.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' :
                    section.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {section.difficulty}
                  </span>
                )}
                {section.estimatedTime && (
                  <span className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    {section.estimatedTime}
                  </span>
                )}
                {section.videoUrl && (
                  <button
                    onClick={() => {
                      setActiveVideo(section.videoUrl);
                      setShowVideoModal(true);
                    }}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                  >
                    <Video className="w-4 h-4" />
                    Watch Video
                  </button>
                )}
                <button
                  onClick={() => toggleBookmark(`${mainKey}.${subKey}`)}
                  className="flex items-center gap-1 hover:text-amber-600"
                >
                  <Star className={`w-4 h-4 ${bookmarkedSections.has(`${mainKey}.${subKey}`) ? 'text-amber-500 fill-current' : ''}`} />
                  Bookmark
                </button>
              </div>
            </div>

            {/* Prerequisites */}
            {section.prerequisites && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Prerequisites
                </h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  {section.prerequisites.map((req, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Content steps */}
            <div className="space-y-8">
              {subsection.content.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  {item.step && (
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800">{item.title}</h3>
                        {item.description && (
                          <p className="text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      {completedSteps.has(`${activeSection}-${index}`) && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!item.step && item.title && (
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{item.title}</h3>
                  )}
                  
                  {/* Code blocks */}
                  {item.code && (
                    <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden mb-4">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                        <span className="text-xs text-gray-400 flex items-center gap-2">
                          <Code className="w-3 h-3" />
                          Terminal Commands
                        </span>
                        <button 
                          onClick={(e) => copyToClipboard(item.code, e)}
                          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                      <pre className="p-4 text-sm overflow-x-auto">{item.code}</pre>
                    </div>
                  )}
                  
                  {/* Action steps */}
                  {item.actions && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <MousePointer className="w-4 h-4" />
                        Follow These Steps:
                      </h4>
                      <ol className="list-decimal list-inside space-y-2">
                        {item.actions.map((action, i) => (
                          <li key={i} className="text-blue-700 text-sm">{action}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  {/* Examples */}
                  {item.example && typeof item.example === 'string' && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Example:
                      </h4>
                      <code className="text-sm text-gray-800 bg-white px-2 py-1 rounded">{item.example}</code>
                    </div>
                  )}
                  
                  {item.example && typeof item.example === 'object' && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Example Headers:</h4>
                      <pre className="text-sm text-gray-800 bg-white p-3 rounded overflow-x-auto">{JSON.stringify(item.example, null, 2)}</pre>
                    </div>
                  )}
                  
                  {/* Tips */}
                  {item.tip && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-800 mb-1">Pro Tip</h4>
                          <p className="text-green-700 text-sm">{item.tip}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Troubleshooting */}
                  {item.troubleshooting && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Common Issues:
                      </h4>
                      <ul className="text-orange-700 text-sm space-y-1">
                        {item.troubleshooting.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Expected result */}
                  {item.expectedResult && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Expected Result:
                      </h4>
                      <p className="text-purple-700 text-sm">{item.expectedResult}</p>
                    </div>
                  )}
                  
                  {/* Completion button */}
                  {item.step && (
                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={() => markStepComplete(`${activeSection}-${index}`)}
                        disabled={completedSteps.has(`${activeSection}-${index}`)}
                        className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                          completedSteps.has(`${activeSection}-${index}`)
                            ? 'bg-green-500 text-white cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105'
                        }`}
                      >
                        {completedSteps.has(`${activeSection}-${index}`) ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Completed!
                          </>
                        ) : (
                          <>
                            <Target className="w-5 h-5" />
                            Mark as Complete
                          </>
                        )}
                      </button>

                      {/* Section rating */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Was this helpful?</span>
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => rateSectionHelpfulness(`${activeSection}-${index}`, rating)}
                            className={`p-1 rounded transition-colors ${
                              feedbackRating[`${activeSection}-${index}`] >= rating
                                ? 'text-yellow-500'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Related sections */}
            {section.relatedSections && (
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <GitCompare className="w-5 h-5" />
                  Related Topics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.relatedSections.map(relatedKey => {
                    const relatedSection = documentation[relatedKey];
                    if (!relatedSection) return null;
                    const Icon = relatedSection.icon || Book;
                    return (
                      <button
                        key={relatedKey}
                        onClick={() => setActiveSection(relatedKey)}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all text-left"
                      >
                        <Icon className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-gray-800">{relatedSection.title}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    // Main section view (unchanged)
    return (
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{section.title}</h1>
        
        {section.sections && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.sections.map(subsection => (
              <div
                key={subsection.id}
                onClick={() => setActiveSection(`${mainKey}.${subsection.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{subsection.title}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {subsection.description || 'Click to view detailed instructions'}
                </p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  Learn more <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-full flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <TableOfContents />
      
      <div className="flex-1 overflow-y-auto">
        {/* Floating action bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Go back"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="text-sm text-gray-600">
                {activeSection.split('.').map((part, index, array) => (
                  <span key={index}>
                    {index > 0 && ' → '}
                    <span className={index === array.length - 1 ? 'font-medium text-gray-900' : ''}>
                      {documentation[part]?.title || part}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Reading time estimate */}
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {documentation[activeSection.split('.')[0]]?.estimatedTime || '5 min read'}
                </span>
              </div>
              
              {/* Quick actions */}
              <button
                onClick={() => window.print()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Print this page"
              >
                <FileText className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setActiveSection('overview')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Go to overview"
              >
                <Home className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {renderContent()}
        </div>
      </div>
      
      {/* Progress indicator (enhanced) */}
      {completedSteps.size > 0 && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-xl p-6 shadow-xl max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-800">Great Progress!</div>
              <div className="text-sm text-gray-600">{completedSteps.size} steps completed</div>
            </div>
          </div>
          
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${userProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{userProgress}% Complete</div>
          </div>

          {userProgress >= 100 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-600">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium text-sm">Congratulations! You've mastered all features!</span>
              </div>
            </div>
          )}

          {userProgress < 100 && userProgress > 0 && (
            <div className="text-xs text-gray-500">
              Keep going! You're doing great. 🎉
            </div>
          )}
        </div>
      )}

      {/* Video modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Video Tutorial</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Video tutorial coming soon!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeVideo || 'Interactive tutorial available in the documentation'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback modal */}
      {Object.keys(feedbackRating).length > 0 && (
        <div className="fixed bottom-6 left-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Thanks for your feedback!</span>
          </div>
          <p className="text-blue-700 text-sm">
            Your ratings help us improve the documentation.
          </p>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-xs flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>Ctrl + F</span>
            <span className="text-gray-400">Search</span>
          </span>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>Ctrl + P</span>
            <span className="text-gray-400">Print</span>
          </span>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>Esc</span>
            <span className="text-gray-400">Close</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Documentation;