#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vercel Health Check Function
"""

import json
from datetime import datetime

def handler(request):
    """健康检查端点"""
    
    # 处理CORS
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
        'body': json.dumps({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "service": "Bazi Calculator API",
            "version": "2.0"
        })
    }