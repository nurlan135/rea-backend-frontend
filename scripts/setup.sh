#!/bin/bash

# REA INVEST Development Environment Setup Script
# This script sets up the development environment for new developers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check OS
check_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        DISTRO=$(lsb_release -si 2>/dev/null || echo "Unknown")
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        DISTRO="macOS"
    else
        error "Unsupported operating system: $OSTYPE"
    fi
    
    log "Detected OS: $OS ($DISTRO)"
}

# Check and install Node.js
setup_nodejs() {
    log "Setting up Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        info "Node.js already installed: $NODE_VERSION"
        
        # Check if version is 18+
        if [[ ${NODE_VERSION:1:2} -lt 18 ]]; then
            warn "Node.js version 18+ is required. Current: $NODE_VERSION"
            install_nodejs
        fi
    else
        install_nodejs
    fi
}

install_nodejs() {
    info "Installing Node.js 18..."
    
    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install node@18
        else
            error "Please install Homebrew first: https://brew.sh"
        fi
    fi
    
    log "Node.js installed successfully: $(node --version)"
}

# Check and install Docker
setup_docker() {
    log "Setting up Docker..."
    
    if command -v docker &> /dev/null; then
        info "Docker already installed: $(docker --version)"
    else
        install_docker
    fi
    
    # Check if user is in docker group
    if ! groups $USER | grep -q docker; then
        warn "User $USER is not in the docker group"
        info "Adding user to docker group..."
        sudo usermod -aG docker $USER
        warn "Please log out and log back in for docker group changes to take effect"
    fi
}

install_docker() {
    info "Installing Docker..."
    
    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        
        # Install Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install --cask docker
            warn "Please start Docker Desktop application after installation"
        else
            error "Please install Homebrew first: https://brew.sh"
        fi
    fi
    
    log "Docker installed successfully"
}

# Setup Git configuration
setup_git() {
    log "Setting up Git configuration..."
    
    if ! command -v git &> /dev/null; then
        info "Installing Git..."
        if [[ "$OS" == "linux" ]]; then
            sudo apt update
            sudo apt install -y git
        elif [[ "$OS" == "macos" ]]; then
            brew install git
        fi
    fi
    
    # Check if Git is configured
    if ! git config --global user.name &> /dev/null; then
        info "Setting up Git user configuration..."
        read -p "Enter your Git username: " git_username
        read -p "Enter your Git email: " git_email
        
        git config --global user.name "$git_username"
        git config --global user.email "$git_email"
        
        log "Git configured successfully"
    else
        info "Git already configured for: $(git config --global user.name)"
    fi
}

# Install development dependencies
install_dependencies() {
    log "Installing project dependencies..."
    
    # Backend dependencies
    info "Installing backend dependencies..."
    cd backend
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    cd ..
    
    # Frontend dependencies
    info "Installing frontend dependencies..."
    cd frontend
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    cd ..
    
    log "Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    log "Setting up environment files..."
    
    # Backend environment
    if [[ ! -f "backend/.env" ]]; then
        info "Creating backend environment file..."
        cp backend/.env.example backend/.env
        warn "Please update backend/.env with your specific configuration"
    fi
    
    # Frontend environment
    if [[ ! -f "frontend/.env.local" ]]; then
        info "Creating frontend environment file..."
        cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-change-in-production
EOF
        log "Frontend environment file created"
    fi
}

# Setup database
setup_database() {
    log "Setting up development database..."
    
    info "Starting PostgreSQL container..."
    cd backend
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    info "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker-compose exec postgres pg_isready -U admin > /dev/null 2>&1; then
            log "PostgreSQL is ready"
            break
        fi
        if [[ $i -eq 30 ]]; then
            error "PostgreSQL failed to start within timeout"
        fi
        sleep 2
    done
    
    # Run migrations
    info "Running database migrations..."
    npm run migrate
    
    # Run seeds (optional)
    read -p "Do you want to run database seeds (sample data)? (y/n): " run_seeds
    if [[ "$run_seeds" == "y" || "$run_seeds" == "Y" ]]; then
        info "Running database seeds..."
        npm run seed
        log "Database seeds completed"
    fi
    
    cd ..
    log "Database setup completed"
}

# Verify installation
verify_installation() {
    log "Verifying installation..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        info "✓ Node.js: $(node --version)"
    else
        error "✗ Node.js not found"
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        info "✓ npm: $(npm --version)"
    else
        error "✗ npm not found"
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        info "✓ Docker: $(docker --version)"
    else
        error "✗ Docker not found"
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        info "✓ Docker Compose: Available"
    else
        error "✗ Docker Compose not found"
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        info "✓ Git: $(git --version)"
    else
        error "✗ Git not found"
    fi
    
    # Check project files
    if [[ -f "backend/package.json" && -f "frontend/package.json" ]]; then
        info "✓ Project structure: Valid"
    else
        error "✗ Project structure: Invalid"
    fi
    
    log "Installation verification completed"
}

# Create useful aliases and scripts
create_dev_scripts() {
    log "Creating development scripts..."
    
    # Create start script
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "Starting REA INVEST Development Environment..."

# Start database
echo "Starting PostgreSQL..."
cd backend && docker-compose up -d postgres && cd ..

# Start backend
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo "✓ Development servers started!"
echo "✓ Frontend: http://localhost:3000"
echo "✓ Backend: http://localhost:8000"
echo "✓ API Docs: http://localhost:8000/api/docs"

# Wait for Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF
    
    chmod +x start-dev.sh
    
    # Create stop script
    cat > stop-dev.sh << 'EOF'
#!/bin/bash
echo "Stopping REA INVEST Development Environment..."

# Stop Node processes
pkill -f "npm run dev"
pkill -f "next dev"
pkill -f "nodemon"

# Stop Docker containers
cd backend && docker-compose down && cd ..

echo "✓ Development environment stopped"
EOF
    
    chmod +x stop-dev.sh
    
    # Create test script
    cat > run-tests.sh << 'EOF'
#!/bin/bash
echo "Running REA INVEST Tests..."

# Backend tests
echo "Running backend tests..."
cd backend && npm test && cd ..

# Frontend tests
echo "Running frontend tests..."
cd frontend && npm test && cd ..

# E2E tests
echo "Running E2E tests..."
cd frontend && npm run test:e2e && cd ..

echo "✓ All tests completed"
EOF
    
    chmod +x run-tests.sh
    
    log "Development scripts created successfully"
}

# Display final instructions
show_final_instructions() {
    log "Setup completed successfully! 🎉"
    echo ""
    echo -e "${GREEN}=== REA INVEST Development Environment Ready ===${NC}"
    echo ""
    echo -e "${BLUE}Quick Start:${NC}"
    echo "1. Start development servers: ${YELLOW}./start-dev.sh${NC}"
    echo "2. Stop development servers:  ${YELLOW}./stop-dev.sh${NC}"
    echo "3. Run tests:                 ${YELLOW}./run-tests.sh${NC}"
    echo ""
    echo -e "${BLUE}URLs:${NC}"
    echo "• Frontend:   ${YELLOW}http://localhost:3000${NC}"
    echo "• Backend:    ${YELLOW}http://localhost:8000${NC}"
    echo "• API Docs:   ${YELLOW}http://localhost:8000/api/docs${NC}"
    echo "• Database:   ${YELLOW}localhost:5432${NC}"
    echo ""
    echo -e "${BLUE}Default Credentials:${NC}"
    echo "• Admin:   ${YELLOW}admin@rea-invest.com / password123${NC}"
    echo "• Manager: ${YELLOW}manager@rea-invest.com / password123${NC}"
    echo "• Agent:   ${YELLOW}agent@rea-invest.com / password123${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Review and update environment files"
    echo "2. Start the development servers"
    echo "3. Visit http://localhost:3000 to see the application"
    echo "4. Check the API documentation at http://localhost:8000/api/docs"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Main execution
main() {
    log "Starting REA INVEST development environment setup"
    
    check_os
    setup_git
    setup_nodejs
    setup_docker
    install_dependencies
    setup_environment
    setup_database
    create_dev_scripts
    verify_installation
    show_final_instructions
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "REA INVEST Development Environment Setup"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "This script automatically sets up the development environment for REA INVEST:"
    echo "• Installs Node.js, Docker, and other dependencies"
    echo "• Sets up the database and runs migrations"
    echo "• Configures environment files"
    echo "• Creates useful development scripts"
    echo ""
    echo "Options:"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "Requirements:"
    echo "• Ubuntu 18.04+ / macOS 10.15+"
    echo "• Internet connection"
    echo "• sudo access (for Linux)"
    echo ""
    exit 0
fi

# Run main function
main "$@"