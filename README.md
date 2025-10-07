# 🚀 InsightCRM - AI-Powered Customer Relationship Management Platform

A modern, full-stack Customer Relationship Management (CRM) platform that enables intelligent customer segmentation, automated email campaigns, and real-time analytics. Built with React.js, Node.js, and MongoDB, featuring AI-powered insights and advanced email tracking.

## ✨ Live Demo


## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Environment Setup](#-environment-setup)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

## 🎯 Features

### 🔐 Authentication & Security
- **Google OAuth 2.0** integration for secure login
- **JWT-based** session management
- **Protected routes** and API endpoints
- **Role-based** access control

### 👥 Customer Management
- **Customer data** import and management
- **Advanced filtering** and search capabilities
- **Customer profile** views with purchase history
- **Real-time** customer statistics

### 🎯 Advanced Segmentation
- **Dynamic rule builder** with AND/OR logic
- **Real-time audience** size estimation
- **Multiple filter criteria**: spending, demographics, location, activity
- **Segment preview** with sample customers
- **Demographic insights** and analytics

### 📧 Email Campaign System
- **Campaign creation** with rich text editor
- **Template personalization** with customer variables
- **Bulk email sending** with rate limiting
- **Advanced email tracking** (opens, clicks, bounces)
- **Campaign analytics** and performance metrics
- **Delivery status** monitoring

### 📊 Analytics & Insights
- **Real-time dashboard** with key metrics
- **Campaign performance** tracking
- **Customer behavior** analytics
- **Revenue attribution** reporting
- **Interactive charts** and visualizations

### 🤖 AI-Powered Features
- **Smart segmentation** suggestions
- **Campaign optimization** recommendations
- **Predictive analytics** for customer behavior
- **AI-driven insights** generation

### ⚙️ Email Configuration
- **SMTP setup** for any email provider
- **Custom sender** names and branding
- **Email template** customization
- **Delivery tracking** with multiple fallback methods

### 🔍 Advanced Tracking
- **Email open** tracking with image blocking countermeasures
- **Click tracking** for all links
- **Engagement analytics** and heatmaps
- **Real-time** delivery status updates

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Icons** - Icon library
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **Nodemailer** - Email sending
- **Swagger** - API documentation
- **OpenAI API** - AI features

### DevOps & Tools
- **Railway** - Backend deployment
- **Netlify** - Frontend deployment
- **MongoDB Atlas** - Cloud database
- **Git** - Version control
- **ESLint** - Code linting

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/insightcrm.git
cd insightcrm

# Install dependencies
npm run install:all

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start development servers
npm run dev
```

## 📦 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or Atlas)
- **Git**
- **Google OAuth** credentials
- **SMTP email** account

### Detailed Setup

1. **Clone & Install**
```bash
git clone https://github.com/your-username/insightcrm.git
cd insightcrm

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. **Database Setup**
```bash
# For local MongoDB
mongod --dbpath /path/to/your/db

# Or use MongoDB Atlas (recommended)
```

3. **Environment Configuration**
```bash
# Server environment (.env)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/insightcrm
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
SERVER_URL=http://localhost:5000

# Client environment (.env)
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

4. **Start Development**
```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

## 📁 Project Structure

```
insightcrm/
├── 📂 client/                    # React frontend
│   ├── 📂 public/               # Static assets
│   ├── 📂 src/
│   │   ├── 📂 components/       # Reusable components
│   │   │   ├── 📂 Campaign/     # Campaign-related components
│   │   │   ├── 📂 common/       # Shared components
│   │   │   └── 📂 dashboard/    # Dashboard components
│   │   ├── 📂 context/          # React contexts
│   │   ├── 📂 pages/            # Page components
│   │   ├── 📂 utils/            # Utility functions
│   │   └── 📄 main.jsx          # App entry point
│   ├── 📄 package.json
│   └── 📄 vite.config.js
│
├── 📂 server/                    # Node.js backend
│   ├── 📂 src/
│   │   ├── 📂 controllers/      # Route controllers
│   │   ├── 📂 middleware/       # Custom middleware
│   │   ├── 📂 models/           # Database models
│   │   ├── 📂 routes/           # API routes
│   │   ├── 📂 utils/            # Utility functions
│   │   └── 📂 docs/             # API documentation
│   ├── 📄 package.json
│   └── 📄 swagger-output.json
│
├── 📄 README.md
├── 📄 .gitignore
└── 📄 DEPLOYMENT_GUIDE.md
```

## 🔌 API Documentation

### Authentication Endpoints
```http
POST /api/auth/google          # Google OAuth login
POST /api/auth/refresh         # Refresh JWT token
POST /api/auth/logout          # Logout user
```

### Customer Management
```http
GET    /api/customers          # Get all customers
POST   /api/customers          # Create customer
PUT    /api/customers/:id      # Update customer
DELETE /api/customers/:id      # Delete customer
GET    /api/customers/import   # Import customers from CSV
```

### Segmentation
```http
POST /api/segments             # Create segment
GET  /api/segments             # Get user segments
POST /api/segments/estimate    # Estimate segment size
POST /api/segments/preview     # Preview segment data
```

### Campaign Management
```http
POST   /api/campaigns          # Create campaign
GET    /api/campaigns          # Get user campaigns
PUT    /api/campaigns/:id      # Update campaign
DELETE /api/campaigns/:id      # Delete campaign
GET    /api/campaigns/:id/logs # Get campaign logs
```

### Email Configuration
```http
GET  /api/email-settings       # Get email settings
POST /api/email-settings       # Update email settings
```

### Tracking & Analytics
```http
GET /api/track/open/:messageId    # Track email opens
GET /api/track/click/:messageId   # Track link clicks
GET /api/analytics/dashboard      # Get dashboard data
```

## 🌍 Environment Setup

### Development Environment
```bash
# Server (.env)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/insightcrm
JWT_SECRET=dev-secret-key
SERVER_URL=http://localhost:5000

# Client (.env)
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development
```

### Production Environment
```bash
# Server (.env)
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/insightcrm
JWT_SECRET=super-secure-production-key
SERVER_URL=https://your-api-domain.com

# Client (.env)
VITE_API_URL=https://your-api-domain.com
VITE_NODE_ENV=production
```

## 🚀 Deployment

### Backend (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add
railway deploy
```

### Frontend (Netlify)
```bash
# Build for production
npm run build

# Deploy to Netlify
# Drag and drop the dist/ folder to Netlify dashboard
# Or connect GitHub repository for automatic deploys
```

### Database (MongoDB Atlas)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create new cluster
3. Add database user
4. Whitelist IP addresses
5. Get connection string

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run backend tests
cd server && npm test

# Run frontend tests
cd client && npm test

# Run with coverage
npm run test:coverage
```

## 🔧 Available Scripts

### Root Level
```bash
npm run install:all    # Install all dependencies
npm run dev            # Start both servers
npm run build          # Build for production
npm run test           # Run all tests
```

### Backend Scripts
```bash
npm run dev            # Start with nodemon
npm run start          # Start production server
npm run test           # Run tests
npm run docs           # Generate API documentation
```

### Frontend Scripts
```bash
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

## 🎨 Features Deep Dive

### Smart Segmentation
- **Rule Builder**: Visual interface for creating complex customer segments
- **Real-time Preview**: See matching customers and segment size instantly
- **Multiple Conditions**: Combine spending, demographic, and behavioral data
- **Export Capabilities**: Export segment data to CSV

### Email Campaign System
- **Rich Editor**: WYSIWYG editor for creating beautiful emails
- **Personalization**: Use customer data in email templates
- **A/B Testing**: Test different subject lines and content
- **Scheduling**: Schedule campaigns for optimal delivery times

### Advanced Analytics
- **Campaign Performance**: Track opens, clicks, conversions
- **Customer Insights**: Understand customer behavior patterns
- **Revenue Tracking**: Connect campaigns to revenue generation
- **Predictive Analytics**: Forecast campaign performance

### Email Tracking Technology
- **Multi-method Tracking**: 7 different tracking methods to counter ad blockers
- **Pixel Tracking**: Traditional 1x1 pixel tracking
- **CSS Background**: Background image tracking
- **Link Tracking**: Track all link clicks with redirects
- **Engagement Buttons**: Interactive elements to boost tracking

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@your-username](https://github.com/your-username)
- LinkedIn: [Your Profile](https://linkedin.com/in/your-profile)
- Email: your.email@example.com

## 🙏 Acknowledgments

- **OpenAI** for AI capabilities
- **Google** for OAuth integration
- **MongoDB** for database technology
- **Tailwind CSS** for styling framework
- **React** community for excellent ecosystem

## 📞 Support

For support and questions:
- **Email**: mr.rayyan2005@gmail.com, ankit6686510@gmail.com
- **Phone**: +91 98977 00769, +91 93109 34230
- **Issues**: [GitHub Issues](https://github.com/your-username/insightcrm/issues)

## 🔮 Roadmap

### Upcoming Features
- [ ] **Mobile App** (React Native)
- [ ] **Advanced AI** insights
- [ ] **Social Media** integration
- [ ] **Webhook** support
- [ ] **Multi-language** support
- [ ] **Advanced** reporting
- [ ] **API** rate limiting improvements
- [ ] **Real-time** collaboration

### Version History
- **v1.0.0** - Initial release with core CRM features
- **v1.1.0** - Added email tracking and analytics
- **v1.2.0** - Improved UI/UX and performance
- **v1.3.0** - Added AI-powered insights

---

**⭐ Star this repository if you find it helpful!**

**🍴 Fork it to create your own version!**

**🐛 Report issues to help us improve!**
