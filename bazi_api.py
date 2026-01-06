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
            for i, line in enumerate(lines):
                # 解析命宫、胎元、身宫信息
                if "Life Palace:" in line or "命宫:" in line:
                    # 提取命宫信息
                    palace_match = re.search(r'(?:Life Palace:|命宫:)\s*([^\s]+)', line)
                    if palace_match:
                        result["basic_info"]["life_palace"] = palace_match.group(1)
                    
                    # 提取胎元信息
                    taiyuan_match = re.search(r'胎元:\s*([^\s]+)', line)
                    if taiyuan_match:
                        result["basic_info"]["taiyuan"] = taiyuan_match.group(1)
                    
                    # 提取身宫信息
                    body_palace_match = re.search(r'身宫:\s*([^\s]+)', line)
                    if body_palace_match:
                        result["basic_info"]["body_palace"] = body_palace_match.group(1)
                
                # 解析节气信息
                if "立春" in line and "雨水" in line:
                    result["basic_info"]["solar_terms"] = line.strip()
                
                # 解析具体节气时间
                if "立春" in line and ":" in line and len(line.split()) > 2:
                    result["basic_info"]["lichun_time"] = line.strip()
                elif "雨水" in line and ":" in line and len(line.split()) > 2:
                    result["basic_info"]["yushui_time"] = line.strip()
                
                # 解析公历农历信息
                if "公历:" in line and "农历:" in line:
                    parts = line.split()
                    for j, part in enumerate(parts):
                        if "公历:" in part and j + 1 < len(parts):
                            result["basic_info"]["gregorian_date"] = parts[j + 1]
                        elif "农历:" in part and j + 1 < len(parts):
                            result["basic_info"]["lunar_date"] = parts[j + 1]
                
                # 解析四柱信息 - 寻找包含天干地支的行
                if "四柱：" in line:
                    pillars_text = line.split("四柱：")[1].strip()
                    pillars = pillars_text.split()
                    if len(pillars) >= 4:
                        result["four_pillars"] = {
                            "year": pillars[0],
                            "month": pillars[1], 
                            "day": pillars[2],
                            "hour": pillars[3]
                        }
                
                # 解析五行分数和强弱信息
                if "金:" in line and "木:" in line and "水:" in line and "火:" in line and "土:" in line:
                    # 解析五行状态（旺、相、休、囚、死）
                    elements_status = {}
                    status_matches = re.findall(r'([金木水火土]):([旺相休囚死])', line)
                    for element, status in status_matches:
                        elements_status[element] = status
                    result["five_elements"]["status"] = elements_status
                
                # 解析五行分数 - 寻找包含五行数值的行
                if re.search(r'金\d+\s+木\d+\s+水\d+\s+火\d+\s+土\d+', line):
                    elements_match = re.findall(r'([金木水火土])(\d+)', line)
                    if elements_match:
                        elements = {}
                        for element, score in elements_match:
                            elements[element] = int(score)
                        result["five_elements"]["scores"] = elements
                
                # 解析强弱值和中值
                if "强弱:" in line:
                    strength_match = re.search(r'强弱:(\d+)', line)
                    if strength_match:
                        result["five_elements"]["strength"] = int(strength_match.group(1))
                    
                    # 解析中值
                    middle_match = re.search(r'中值(\d+)', line)
                    if middle_match:
                        result["five_elements"]["middle_value"] = int(middle_match.group(1))
                
                # 解析强根信息
                if "强根:" in line:
                    strong_root_match = re.search(r'强根:\s*([^\s]*)', line)
                    if strong_root_match:
                        result["five_elements"]["strong_root"] = strong_root_match.group(1) or "无"
                
                # 解析湿度信息
                if "湿度" in line:
                    humidity_match = re.search(r'湿度\[([^\]]+)\]', line)
                    if humidity_match:
                        result["analysis"]["humidity_range"] = humidity_match.group(1)
                    
                    # 提取湿度分数
                    humidity_score_match = re.search(r'湿度分数[：:]\s*([+-]?\d+)', line)
                    if humidity_score_match:
                        result["analysis"]["humidity"] = humidity_score_match.group(1)
                    elif re.search(r'([+-]?\d+)\s*湿度', line):
                        score_match = re.search(r'([+-]?\d+)\s*湿度', line)
                        if score_match:
                            result["analysis"]["humidity"] = score_match.group(1)
                
                # 解析十神信息（比、官、杀等）
                if re.search(r'[比劫食伤才财杀官枭印]', line) and len(line.strip().split()) <= 8:
                    # 可能是十神行
                    ten_gods = line.strip().split()
                    if len(ten_gods) <= 8 and all(len(god) <= 2 for god in ten_gods):
                        result["analysis"]["ten_gods"] = ten_gods
            
            # 如果没有找到四柱，尝试从其他格式解析
            if not result["four_pillars"]:
                heavenly_stems = None
                earthly_branches = None
                
                for line in lines:
                    # 匹配天干行
                    if re.match(r'^[甲乙丙丁戊己庚辛壬癸]\s+[甲乙丙丁戊己庚辛壬癸]\s+[甲乙丙丁戊己庚辛壬癸]\s+[甲乙丙丁戊己庚辛壬癸]', line.strip()):
                        heavenly_stems = line.strip().split()[:4]
                    
                    # 匹配地支行
                    elif re.match(r'^[子丑寅卯辰巳午未申酉戌亥]\s+[子丑寅卯辰巳午未申酉戌亥]\s+[子丑寅卯辰巳午未申酉戌亥]\s+[子丑寅卯辰巳午未申酉戌亥]', line.strip()):
                        earthly_branches = line.strip().split()[:4]
                
                # 组合天干地支
                if heavenly_stems and earthly_branches and len(heavenly_stems) == 4 and len(earthly_branches) == 4:
                    result["four_pillars"] = {
                        "year": heavenly_stems[0] + earthly_branches[0],
                        "month": heavenly_stems[1] + earthly_branches[1],
                        "day": heavenly_stems[2] + earthly_branches[2],
                        "hour": heavenly_stems[3] + earthly_branches[3]
                    }
            
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