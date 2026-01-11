#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vercel Serverless Function for Bazi Calculator
"""

import json
import subprocess
import re
import os
from datetime import datetime

class BaziCalculator:
    def __init__(self):
        # Vercel中文件在根目录
        self.bazi_script_path = "bazi.py"
    
    def calculate(self, year, month, day, hour, gender="male", calendar_type="gregorian"):
        """调用bazi.py进行计算"""
        try:
            # 构建命令参数
            cmd = ["python3", self.bazi_script_path, str(year), str(month), str(day), str(hour)]
            
            # 添加选项参数
            if calendar_type == "gregorian":
                cmd.append("-g")
            if gender == "female":
                cmd.append("-n")
            
            # 执行命令
            result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
            
            if result.returncode != 0:
                return {
                    "success": False,
                    "error": f"计算失败: {result.stderr}",
                    "raw_output": result.stdout
                }
            
            # 解析输出
            parsed_data = self.parse_bazi_output(result.stdout)
            
            return {
                "success": True,
                "data": parsed_data,
                "raw_output": result.stdout,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"执行错误: {str(e)}"
            }
    
    def parse_bazi_output(self, output):
        """解析bazi.py的输出"""
        lines = output.strip().split('\n')
        
        data = {
            "basic_info": {},
            "four_pillars": {},
            "five_elements": {"scores": {}},
            "ten_gods": [],
            "spiritual_stars": [],
            "luck_cycles": [],
            "pattern_analysis": {},
            "seasonal_adjustment": {}
        }
        
        # 基本解析逻辑
        for i, line in enumerate(lines):
            if "公历" in line:
                data["basic_info"]["gregorian_date"] = line.strip()
            elif "农历" in line:
                data["basic_info"]["lunar_date"] = line.strip()
            elif "年柱" in line or "月柱" in line or "日柱" in line or "时柱" in line:
                parts = line.split()
                if len(parts) >= 2:
                    pillar_type = parts[0].replace("柱", "")
                    pillar_value = parts[1] if len(parts) > 1 else ""
                    data["four_pillars"][pillar_type] = pillar_value
        
        return data

# Vercel serverless function handler
def handler(request):
    """Vercel函数入口点"""
    
    # 处理CORS
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }
    
    # 只处理POST请求
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                "success": False,
                "error": "Method not allowed"
            })
        }
    
    try:
        # 解析请求数据
        if hasattr(request, 'get_json'):
            data = request.get_json()
        else:
            # Vercel环境中的请求处理
            body = request.get('body', '{}')
            if isinstance(body, bytes):
                body = body.decode('utf-8')
            data = json.loads(body)
        
        # 验证必需参数
        required_fields = ['year', 'month', 'day', 'hour']
        for field in required_fields:
            if field not in data:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                    },
                    'body': json.dumps({
                        "success": False,
                        "error": f"缺少必需参数: {field}"
                    })
                }
        
        # 调用计算器
        calculator = BaziCalculator()
        result = calculator.calculate(
            year=data['year'],
            month=data['month'],
            day=data['day'],
            hour=data['hour'],
            gender=data.get('gender', 'male'),
            calendar_type=data.get('calendar_type', 'gregorian')
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            'body': json.dumps(result, ensure_ascii=False)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                "success": False,
                "error": f"服务器错误: {str(e)}"
            }, ensure_ascii=False)
        }