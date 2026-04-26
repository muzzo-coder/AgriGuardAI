#!/bin/bash

# Port to clean up
PORT=8088

echo "🚀 AgriGuard AI: Starting Backend Laboratory..."

# Kill existing process on port
echo "Checking for zombie processes on port $PORT..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || echo "No existing process found on port $PORT."

# Start the Flask server
echo "Launching Neural Core..."
./venv/bin/python3 leaf.py
