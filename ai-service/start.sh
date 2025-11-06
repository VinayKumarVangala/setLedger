#!/bin/bash
echo "🤖 Starting AI Credit Service..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python ai_credit_service.py