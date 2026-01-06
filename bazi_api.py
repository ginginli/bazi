#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bazi Calculator API Wrapper
为八字计算器网站提供API服务
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import subprocess
import json
import re
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # 允许跨域请求

class BaziCalculator:
    def __init__(self, bazi_script_path="./bazi.py"):
        self.bazi_script_path = bazi_script_path
    
    def calculate(self, year, month, day, hour, gender="male", calendar_type="gregorian"):
        """
        调用bazi.py进行计算
        
        Args:
            year: 出生年份
            month: 出生月份  
            day: 出生日期
            hour: 出生时辰
            gender: 性别 ("male" or "female")
            calendar_type: 日历类型 ("gregorian" or "lunar")
        
        Returns:
            dict: 解析后的八字结果
        """
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
                return {"error": f"计算错误: {result.stderr}"}
            
            # 解析输出结果
            return self.parse_bazi_output(result.stdout)
            
        except Exception as e:
            return {"error": f"系统错误: {str(e)}"}
    
    def parse_bazi_output(self, output):
        """
        解析bazi.py的输出结果
        """
        try:
            lines = output.strip().split('\n')
            result = {
                "basic_info": {},
                "four_pillars": {},
                "five_elements": {},
                "analysis": {},
                "fortune": {},
                "raw_output": output
            }
            
            # 解析基本信息
            for line in lines:
                if "公历:" in line:
                    result["basic_info"]["gregorian_date"] = line.split("公历:")[1].strip()
                elif "农历:" in line:
                    result["basic_info"]["lunar_date"] = line.split("农历:")[1].strip()
                elif "lunar_python:" in line:
                    # 提取四柱信息
                    pillars = line.split("lunar_python:")[1].strip().split()
                    if len(pillars) >= 4:
                        result["four_pillars"] = {
                            "year": pillars[0],
                            "month": pillars[1], 
                            "day": pillars[2],
                            "hour": pillars[3]
                        }
            
            # 解析五行分数
            five_elements_match = re.search(r"五行分数 \{([^}]+)\}", output)
            if five_elements_match:
                elements_str = five_elements_match.group(1)
                elements = {}
                for item in elements_str.split(','):
                    if ':' in item:
                        key, value = item.split(':')
                        elements[key.strip().strip("'")] = int(value.strip())
                result["five_elements"]["scores"] = elements
            
            # 解析八字强弱
            strength_match = re.search(r"八字强弱： (\d+)", output)
            if strength_match:
                result["five_elements"]["strength"] = int(strength_match.group(1))
            
            # 解析格局
            pattern_matches = re.findall(r"格 \[([^\]]+)\]", output)
            if pattern_matches:
                result["analysis"]["patterns"] = pattern_matches[0].split("', '")
            
            return result
            
        except Exception as e:
            return {
                "error": f"解析错误: {str(e)}",
                "raw_output": output
            }

# 初始化计算器
calculator = BaziCalculator()

@app.route('/')
def index():
    """API文档页面"""
    return """
    <h1>Bazi Calculator API</h1>
    <h2>使用方法:</h2>
    <p>POST /api/calculate</p>
    <pre>
    {
        "year": 1990,
        "month": 5,
        "day": 15,
        "hour": 14,
        "gender": "male",
        "calendar_type": "gregorian"
    }
    </pre>
    """

@app.route('/api/calculate', methods=['POST'])
def calculate_bazi():
    """八字计算API端点"""
    try:
        data = request.get_json()
        
        # 验证必需参数
        required_fields = ['year', 'month', 'day', 'hour']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"缺少必需参数: {field}"}), 400
        
        # 设置默认值
        gender = data.get('gender', 'male')
        calendar_type = data.get('calendar_type', 'gregorian')
        
        # 执行计算
        result = calculator.calculate(
            data['year'], data['month'], data['day'], data['hour'],
            gender, calendar_type
        )
        
        if "error" in result:
            return jsonify(result), 500
        
        return jsonify({
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": f"请求处理错误: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)