#!/bin/bash

# Government Budget Transparency System Setup Script
echo "🏛️ Setting up Government Budget Transparency System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  Please update .env.local with your Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

# Check if Supabase credentials are set
if grep -q "your_anon_key_here" .env.local; then
    echo "⚠️  Please update .env.local with your actual Supabase credentials"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Run the database migration in Supabase SQL Editor"
echo "3. Start the development server: npm run dev"
echo ""
echo "📚 For detailed instructions, see README.md"

