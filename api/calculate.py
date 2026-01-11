from http.server import BaseHTTPRequestHandler
import json
import subprocess
import re
import os
from datetime import datetime
from urllib.parse import parse_qs

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

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        try:
            # 读取请求体
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # 验证必需参数
            required_fields = ['year', 'month', 'day', 'hour']
            for field in required_fields:
                if field not in data:
                    self.send_error_response(400, f"缺少必需参数: {field}")
                    return
            
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
            
            self.send_json_response(200, result)
            
        except Exception as e:
            self.send_error_response(500, f"服务器错误: {str(e)}")
    
    def do_GET(self):
        # 健康检查
        self.send_json_response(200, {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "service": "Bazi Calculator API"
        })
    
    def send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def send_error_response(self, status_code, error_message):
        self.send_json_response(status_code, {
            "success": False,
            "error": error_message
        })