#!/bin/bash

# SWMS Setup Script
# This script sets up the Student Wellness Management System

echo "============================================"
echo "  Student Wellness Management System"
echo "         Setup Script"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v16+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    print_status "Node.js version: v$NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_status "npm version: $NPM_VERSION"
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL CLI (psql) not found. Please ensure PostgreSQL is installed."
        print_warning "You can install it from: https://postgresql.org/download/"
    else
        print_status "PostgreSQL CLI found"
    fi
    
    echo ""
}

# Setup backend
setup_backend() {
    print_step "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Copy environment file
    if [ ! -f .env ]; then
        print_status "Creating environment file..."
        cp .env.example .env
        print_warning "Please update the .env file with your database credentials"
    else
        print_status "Environment file already exists"
    fi
    
    cd ..
    echo ""
}

# Setup frontend
setup_frontend() {
    print_step "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    cd ..
    echo ""
}

# Setup database
setup_database() {
    print_step "Setting up database..."
    
    read -p "Do you want to setup the database now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter PostgreSQL username (default: postgres): " DB_USER
        DB_USER=${DB_USER:-postgres}
        
        read -p "Enter database name (default: swms_db): " DB_NAME
        DB_NAME=${DB_NAME:-swms_db}
        
        print_status "Creating database and schema..."
        
        # Create database
        createdb -U $DB_USER $DB_NAME 2>/dev/null || print_warning "Database might already exist"
        
        # Run schema
        psql -U $DB_USER -d $DB_NAME -f backend/database/schema.sql
        
        # Insert sample data
        psql -U $DB_USER -d $DB_NAME -f backend/database/seeds.sql
        
        print_status "Database setup completed!"
    else
        print_warning "Skipping database setup. You'll need to set it up manually later."
        print_warning "See README.md for database setup instructions."
    fi
    
    echo ""
}

# Create startup scripts
create_scripts() {
    print_step "Creating startup scripts..."
    
    # Backend startup script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "Starting SWMS Backend..."
cd backend
npm run dev
EOF
    chmod +x start-backend.sh
    
    # Frontend startup script
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "Starting SWMS Frontend..."
cd frontend
npm start
EOF
    chmod +x start-frontend.sh
    
    # Combined startup script
    cat > start-all.sh << 'EOF'
#!/bin/bash
echo "Starting SWMS Application..."
echo "Backend will start on http://localhost:5000"
echo "Frontend will start on http://localhost:3000"
echo ""

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "SWMS is starting up..."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF
    chmod +x start-all.sh
    
    print_status "Startup scripts created:"
    print_status "  - start-backend.sh (Backend only)"
    print_status "  - start-frontend.sh (Frontend only)"
    print_status "  - start-all.sh (Both services)"
    
    echo ""
}

# Main setup process
main() {
    echo "Starting SWMS setup..."
    echo ""
    
    check_prerequisites
    setup_backend
    setup_frontend
    setup_database
    create_scripts
    
    print_step "Setup completed!"
    echo ""
    echo "============================================"
    echo -e "${GREEN}  SWMS Setup Successful! ${NC}"
    echo "============================================"
    echo ""
    echo "Next steps:"
    echo "1. Update backend/.env with your database credentials"
    echo "2. Start the application:"
    echo "   ./start-all.sh"
    echo ""
    echo "Or start services individually:"
    echo "   ./start-backend.sh"
    echo "   ./start-frontend.sh"
    echo ""
    echo "Access the application:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:5000"
    echo ""
    echo "Default admin credentials:"
    echo "  Username: admin_swms"
    echo "  Password: swmsewu2025"
    echo ""
    echo "See README.md for more information."
    echo ""
}

# Run main function
main "$@"
