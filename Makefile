# Wrappr Frontend Makefile

.PHONY: help install start ios android web clean dev tunnel clear

# Default target
help:
	@echo "🚀 Wrappr Frontend Commands:"
	@echo "  make install   - Install dependencies"
	@echo "  make start     - Start development server (choose platform)"
	@echo "  make clear     - Clear cache and start fresh"
	@echo "  make ios       - Run on iOS simulator"
	@echo "  make android   - Run on Android emulator"
	@echo "  make web       - Run on web browser"
	@echo "  make dev       - Start with tunnel for device testing"
	@echo "  make clean     - Clean cache and reinstall"
	@echo "  make tunnel    - Start with tunnel (for physical devices)"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install

# Start development server
start:
	@echo "🚀 Starting Expo development server..."
	@echo "Choose your platform when prompted!"
	npx expo start

# Clear cache and start fresh
clear:
	@echo "🧹 Clearing cache and starting fresh..."
	npx expo start --clear

# iOS Simulator
ios:
	@echo "📱 Starting iOS simulator..."
	npx expo start --ios

# Android Emulator  
android:
	@echo "🤖 Starting Android emulator..."
	npx expo start --android

# Web Browser
web:
	@echo "🌐 Starting web browser..."
	npx expo start --web

# Development with tunnel (for physical devices)
dev:
	@echo "🌐 Starting with tunnel for device testing..."
	npx expo start --tunnel

# Tunnel only
tunnel:
	@echo "🔗 Starting tunnel mode..."
	npx expo start --tunnel

# Clean install
clean:
	@echo "🧹 Cleaning cache and reinstalling..."
	rm -rf node_modules
	rm -f package-lock.json
	npm cache clean --force
	npm install

# Quick development setup
setup: install
	@echo "✅ Setup complete! Use 'make start' to begin development"

# Check status
status:
	@echo "📊 Project Status:"
	@echo "Node version: $(shell node --version)"
	@echo "NPM version: $(shell npm --version)"
	@echo "Expo CLI: $(shell npx expo --version)"