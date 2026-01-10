#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vercel Serverless Function for Bazi Calculator
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import re
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

class BaziCalculator:
    def __init__(self, bazi_script_path="../bazi.py"):
        self.bazi_script_path = bazi_script_path
    
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
        # 这里使用简化版的解析逻辑
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

# 创建计算器实例
calculator = BaziCalculator()

@app.route('/api/calculate', methods=['POST'])
def calculate_bazi():
    """八字计算API端点"""
    try:
        data = request.get_json()
        
        # 验证必需参数
        required_fields = ['year', 'month', 'day', 'hour']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"缺少必需参数: {field}"
                }), 400
        
        # 调用计算器
        result = calculator.calculate(
            year=data['year'],
            month=data['month'],
            day=data['day'],
            hour=data['hour'],
            gender=data.get('gender', 'male'),
            calendar_type=data.get('calendar_type', 'gregorian')
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"服务器错误: {str(e)}"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Bazi Calculator API"
    })

# Vercel handler
def handler(request):
    return app(request.environ, lambda status, headers: None)