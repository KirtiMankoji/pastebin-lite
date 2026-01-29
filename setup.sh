#!/bin/bash

# Pastebin Lite - Automated Setup Script
# This script helps you set up and deploy the application quickly

set -e

echo "🚀 Pastebin Lite - Setup & Deployment Script"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if running in project directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

echo "Step 1: Installing Dependencies"
echo "--------------------------------"
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""
echo "Step 2: Checking Prerequisites"
echo "--------------------------------"

# Check for Vercel CLI
if command -v vercel &> /dev/null; then
    print_success "Vercel CLI found"
else
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
    print_success "Vercel CLI installed"
fi

# Check for git
if command -v git &> /dev/null; then
    print_success "Git found"
else
    print_error "Git not found. Please install Git first."
    exit 1
fi

echo ""
echo "Step 3: Git Repository Setup"
echo "--------------------------------"

if [ -d ".git" ]; then
    print_warning "Git repository already initialized"
else
    print_info "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Pastebin Lite application"
    print_success "Git repository initialized"
fi

echo ""
echo "Step 4: GitHub Repository"
echo "--------------------------------"
print_info "Please create a new repository on GitHub:"
echo "   1. Go to https://github.com/new"
echo "   2. Name it 'pastebin-lite'"
echo "   3. Make it PUBLIC"
echo "   4. Do NOT initialize with README"
echo ""
read -p "Have you created the GitHub repository? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your GitHub username: " github_user
    read -p "Enter repository name (default: pastebin-lite): " repo_name
    repo_name=${repo_name:-pastebin-lite}
    
    git remote add origin https://github.com/$github_user/$repo_name.git 2>/dev/null || true
    git branch -M main
    
    print_info "Pushing to GitHub..."
    if git push -u origin main; then
        print_success "Code pushed to GitHub"
        echo ""
        print_success "GitHub Repository: https://github.com/$github_user/$repo_name"
    else
        print_error "Failed to push to GitHub. Please check your credentials."
    fi
else
    print_warning "Skipping GitHub push. You can do this later."
fi

echo ""
echo "Step 5: Vercel Deployment"
echo "--------------------------------"
print_info "Deploying to Vercel..."
print_warning "When prompted, accept the default settings"
echo ""

if vercel --prod; then
    print_success "Application deployed to Vercel!"
else
    print_error "Deployment failed. Please check Vercel CLI output."
    exit 1
fi

echo ""
echo "Step 6: Setup Vercel KV"
echo "--------------------------------"
print_warning "IMPORTANT: You must add KV storage manually"
echo ""
echo "Follow these steps:"
echo "1. Go to your Vercel dashboard: https://vercel.com/dashboard"
echo "2. Select your 'pastebin-lite' project"
echo "3. Click on 'Storage' tab"
echo "4. Click 'Create Database'"
echo "5. Select 'KV' (Redis)"
echo "6. Name it 'pastebin-kv'"
echo "7. Click 'Create'"
echo "8. Click 'Connect to Project' and select your project"
echo ""
read -p "Press Enter once you've completed the KV setup..." -n 1 -r
echo ""

echo ""
echo "Step 7: Redeploy with KV"
echo "--------------------------------"
print_info "Redeploying to activate KV connection..."

if vercel --prod; then
    print_success "Redeployment successful!"
else
    print_error "Redeployment failed."
    exit 1
fi

echo ""
echo "Step 8: Getting Deployment URL"
echo "--------------------------------"

DEPLOY_URL=$(vercel ls --prod 2>/dev/null | grep pastebin-lite | head -1 | awk '{print $2}' || echo "")

if [ ! -z "$DEPLOY_URL" ]; then
    print_success "Deployment URL: https://$DEPLOY_URL"
    echo ""
    
    echo "Step 9: Testing Deployment"
    echo "--------------------------------"
    
    print_info "Testing health check..."
    if curl -sf https://$DEPLOY_URL/api/healthz > /dev/null; then
        print_success "Health check passed!"
    else
        print_error "Health check failed. Please check KV connection."
    fi
    
    print_info "Testing paste creation..."
    RESPONSE=$(curl -sf -X POST https://$DEPLOY_URL/api/pastes \
        -H "Content-Type: application/json" \
        -d '{"content":"Test paste from setup script"}' || echo "")
    
    if [ ! -z "$RESPONSE" ]; then
        print_success "Paste creation works!"
        PASTE_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        print_info "Test paste URL: https://$DEPLOY_URL/p/$PASTE_ID"
    else
        print_error "Paste creation failed. Please check logs."
    fi
else
    print_warning "Could not automatically detect deployment URL"
    print_info "Please check your Vercel dashboard for the URL"
fi

echo ""
echo "============================================="
echo "🎉 Setup Complete!"
echo "============================================="
echo ""
print_success "Your Pastebin Lite application is ready!"
echo ""
echo "📝 Next Steps for Submission:"
echo "   1. Copy your Deployment URL from above"
echo "   2. Copy your GitHub URL"
echo "   3. Fill the Google Form with:"
echo "      - Deployed URL"
echo "      - GitHub URL"
echo "      - Candidate ID: Naukri0126"
echo ""
print_warning "IMPORTANT: Include Candidate ID in submission!"
echo ""
echo "📚 Additional Resources:"
echo "   - README.md - Full documentation"
echo "   - QUICKSTART.md - Quick reference"
echo "   - TESTING.md - Testing guide"
echo "   - CHECKLIST.md - Requirements checklist"
echo ""
print_success "Good luck with your submission! 🚀"
