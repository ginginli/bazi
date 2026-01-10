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
                # 解析命宫、胎元、身宫信息 (可能在同一行)
                if "命宫:" in line:
                    # 提取命宫信息 - 只取命宫后的第一个干支组合
                    palace_match = re.search(r'命宫:([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])', line)
                    if palace_match:
                        result["basic_info"]["life_palace"] = palace_match.group(1)
                    
                    # 提取胎元信息 - 只取胎元后的第一个干支组合
                    taiyuan_match = re.search(r'胎元:([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])', line)
                    if taiyuan_match:
                        result["basic_info"]["taiyuan"] = taiyuan_match.group(1)
                    
                    # 提取身宫信息 - 只取身宫后的第一个干支组合
                    body_palace_match = re.search(r'身宫:([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])', line)
                    if body_palace_match:
                        result["basic_info"]["body_palace"] = body_palace_match.group(1)
                
                # 解析节气信息 - 提取简洁的节气描述
                seasonal_terms = ['立春', '立夏', '立秋', '立冬', '雨水', '惊蛰', '清明', '谷雨', '小满', '芒种', '夏至', '小暑', '大暑', '处暑', '白露', '秋分', '寒露', '霜降', '小雪', '大雪', '冬至', '小寒', '大寒']
                for term in seasonal_terms:
                    if f"{term}后" in line:
                        # 提取节气时间段信息，如"立夏后戊土5日，庚金9日，丙火16日"
                        seasonal_match = re.search(f'{term}后([^{term}]+)', line)
                        if seasonal_match:
                            seasonal_info = seasonal_match.group(1).strip()
                            # 清理多余的文字，只保留核心信息
                            seasonal_info = re.sub(r'\s+[立雨惊清谷小芒夏大处白秋寒霜冬].*', '', seasonal_info)
                            result["basic_info"]["solar_terms"] = f"{term}后{seasonal_info}"
                            break
                
                # 解析具体节气时间 - 提取所有节气时间
                seasonal_time_pattern = r'([立雨惊清谷小芒夏大处白秋寒霜冬][春夏秋冬雪露分至暑寒满种蛰明雨水])\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})'
                seasonal_times = re.findall(seasonal_time_pattern, line)
                for term_name, time_str in seasonal_times:
                    if term_name in ['雨水', '惊蛰', '立春', '立夏', '立秋', '立冬', '小满', '大暑', '处暑', '白露', '寒露', '小雪', '大雪']:
                        result["basic_info"][f"{term_name}_time"] = f"{term_name} {time_str}"
                
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
                    # 解析湿度范围
                    humidity_match = re.search(r'湿度\[([^\]]+)\]', line)
                    if humidity_match:
                        result["five_elements"]["humidity_range"] = humidity_match.group(1)
                    
                    # 提取湿度分数 - 支持多种格式
                    humidity_score_match = re.search(r'([+-]?\d+)\s*湿度', line)
                    if humidity_score_match:
                        result["five_elements"]["humidity_score"] = int(humidity_score_match.group(1))
                    
                    # 判断强弱状态
                    if "强弱:" in line:
                        strength_match = re.search(r'强弱:(\d+)', line)
                        if strength_match:
                            strength_value = int(strength_match.group(1))
                            result["five_elements"]["weak"] = strength_value <= 29
                
                # 解析十神信息（比、官、杀等）
                if re.search(r'[比劫食伤才财杀官枭印]', line):
                    # 检查是否是十神行（通常在天干行下面）
                    parts = line.strip().split()
                    ten_gods = []
                    for part in parts:
                        if part in ['比', '劫', '食', '伤', '才', '财', '杀', '官', '枭', '印', '--']:
                            ten_gods.append(part)
                    
                    if len(ten_gods) >= 3:  # 至少有3个十神才认为是有效的十神行
                        result["analysis"]["ten_gods"] = ten_gods
                
                # 解析神煞信息
                if "神:" in line or any(star in line for star in ['天乙', '天德', '月德', '劫煞', '桃花', '华盖', '文昌', '驿马', '孤辰', '寡宿', '红艳', '将星', '大耗', '亡神']):
                    spiritual_stars = self.extract_spiritual_stars_from_line(line)
                    if spiritual_stars:
                        if "spiritual_stars" not in result["analysis"]:
                            result["analysis"]["spiritual_stars"] = set()
                        result["analysis"]["spiritual_stars"].update(spiritual_stars)
                
                # 解析格局信息
                if "格局选用：" in line:
                    pattern_text = line.split("格局选用：")[1].strip()
                    patterns = self.parse_pattern_analysis(pattern_text)
                    result["analysis"]["patterns"] = patterns
                
                # 解析调候用神信息
                if "调候：" in line and "金不换大运" not in line:
                    # 提取第一个调候信息
                    seasonal_match = re.search(r'调候：\s*([^#]+)', line)
                    if seasonal_match:
                        seasonal_text = seasonal_match.group(1).strip()
                        seasonal_info = self.parse_seasonal_adjustment(seasonal_text)
                        result["analysis"]["seasonal_adjustment"] = seasonal_info
                
                # 解析金不换大运中的调候信息
                if "金不换大运：" in line and "调候：" in line:
                    # 提取金不换大运中的调候信息
                    jinbuhuan_match = re.search(r'金不换大运：[^调]*调候：([^金]*)', line)
                    if jinbuhuan_match:
                        jinbuhuan_text = jinbuhuan_match.group(1).strip()
                        if "jinbuhuan_seasonal" not in result["analysis"]:
                            result["analysis"]["jinbuhuan_seasonal"] = {}
                        result["analysis"]["jinbuhuan_seasonal"] = self.parse_seasonal_adjustment(jinbuhuan_text)
                
                # 解析大运信息 - 寻找大运起始行
                if re.match(r'^\s*\d+\s+[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]\s+[沐长养冠建帝衰病死墓绝胎]\s+', line):
                    luck_cycle = self.parse_luck_cycle_line(line)
                    if luck_cycle:
                        if "luck_cycles" not in result["analysis"]:
                            result["analysis"]["luck_cycles"] = []
                        # 避免重复添加相同年龄的大运
                        existing_ages = [lc.get("start_age") for lc in result["analysis"]["luck_cycles"]]
                        if luck_cycle.get("start_age") not in existing_ages:
                            result["analysis"]["luck_cycles"].append(luck_cycle)
            
            # 转换神煞set为list
            if "spiritual_stars" in result["analysis"]:
                result["analysis"]["spiritual_stars"] = list(result["analysis"]["spiritual_stars"])
            
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
    
    def extract_spiritual_stars_from_line(self, line):
        """从单行中提取神煞信息"""
        spiritual_stars = []
        
        # 定义神煞列表
        star_patterns = [
            '天乙', '天德', '月德', '劫煞', '桃花', '华盖', '文昌', '驿马', 
            '孤辰', '寡宿', '红艳', '将星', '大耗', '亡神', '阳刃'
        ]
        
        # 如果行中包含"神:"，提取冒号后的内容
        if "神:" in line:
            star_text = line.split("神:")[1].strip()
            # 分割多个神煞
            for star in star_patterns:
                if star in star_text:
                    spiritual_stars.append(star)
        else:
            # 直接在行中查找神煞
            for star in star_patterns:
                if star in line:
                    spiritual_stars.append(star)
        
        return list(set(spiritual_stars))  # 去重
    
    def parse_pattern_analysis(self, pattern_text):
        """解析格局分析文本"""
        patterns = {
            "primary_pattern": "",
            "secondary_patterns": [],
            "favorable_elements": [],
            "unfavorable_elements": [],
            "pattern_quality": ""
        }
        
        try:
            # 分割不同的格局描述
            # 示例: "食伤生财：孤贫劳 财格：     印格；最佳       杀印相生：佳   官杀：体弱多病"
            parts = re.split(r'[：；]', pattern_text)
            
            for i, part in enumerate(parts):
                part = part.strip()
                if not part:
                    continue
                    
                if i == 0:  # 第一个通常是主格局
                    patterns["primary_pattern"] = part
                elif "最佳" in part:
                    patterns["pattern_quality"] = "最佳"
                    patterns["secondary_patterns"].append(part.replace("最佳", "").strip())
                elif "佳" in part:
                    patterns["pattern_quality"] = "佳" if not patterns["pattern_quality"] else patterns["pattern_quality"]
                    patterns["secondary_patterns"].append(part.replace("佳", "").strip())
                else:
                    patterns["secondary_patterns"].append(part)
            
            # 提取喜忌信息（如果存在）
            if "喜" in pattern_text:
                favorable_match = re.search(r'喜([^忌]+)', pattern_text)
                if favorable_match:
                    favorable_text = favorable_match.group(1).strip()
                    patterns["favorable_elements"] = [elem.strip() for elem in favorable_text if elem.strip()]
            
            if "忌" in pattern_text:
                unfavorable_match = re.search(r'忌(.+)', pattern_text)
                if unfavorable_match:
                    unfavorable_text = unfavorable_match.group(1).strip()
                    patterns["unfavorable_elements"] = [elem.strip() for elem in unfavorable_text if elem.strip()]
                    
        except Exception as e:
            print(f"格局解析错误: {e}")
        
        return patterns
    
    def parse_seasonal_adjustment(self, seasonal_text):
        """解析调候用神信息"""
        seasonal_info = {
            "adjustment_gods": [],
            "priority_order": [],
            "favorable_gods": [],
            "unfavorable_gods": [],
            "description": seasonal_text
        }
        
        try:
            # 解析优先级调候用神
            # 示例: "1壬2丙戊3丁" 表示壬为第一优先级，丙戊为第二优先级，丁为第三优先级
            priority_match = re.findall(r'(\d+)([甲乙丙丁戊己庚辛壬癸]+)', seasonal_text)
            for priority, gods in priority_match:
                for god in gods:
                    seasonal_info["priority_order"].append({
                        "priority": int(priority),
                        "god": god
                    })
                    if god not in seasonal_info["adjustment_gods"]:
                        seasonal_info["adjustment_gods"].append(god)
            
            # 解析喜忌用神
            if "喜" in seasonal_text:
                favorable_match = re.search(r'喜([甲乙丙丁戊己庚辛壬癸]+)', seasonal_text)
                if favorable_match:
                    seasonal_info["favorable_gods"] = list(favorable_match.group(1))
            
            if "忌" in seasonal_text:
                unfavorable_match = re.search(r'忌([甲乙丙丁戊己庚辛壬癸]+)', seasonal_text)
                if unfavorable_match:
                    seasonal_info["unfavorable_gods"] = list(unfavorable_match.group(1))
            
            # 如果没有找到优先级信息，但有喜忌信息，将喜用神作为调候用神
            if not seasonal_info["adjustment_gods"] and seasonal_info["favorable_gods"]:
                seasonal_info["adjustment_gods"] = seasonal_info["favorable_gods"].copy()
                    
        except Exception as e:
            print(f"调候解析错误: {e}")
        
        return seasonal_info
    
    def parse_luck_cycle_line(self, line):
        """解析单行大运信息"""
        try:
            # 示例: "8        壬午 沐 杨柳木    食:壬＋　　　　　　　午＋沐"
            parts = line.strip().split()
            if len(parts) < 4:
                return None
            
            luck_cycle = {
                "start_age": None,
                "heavenly_stem": "",
                "earthly_branch": "",
                "pillar": "",
                "twelve_stages": "",
                "nayin": "",
                "ten_god": "",
                "description": ""
            }
            
            # 提取起运年龄
            age_match = re.match(r'^\d+', parts[0])
            if age_match:
                luck_cycle["start_age"] = int(age_match.group())
            
            # 提取干支
            pillar_match = re.search(r'([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])', line)
            if pillar_match:
                luck_cycle["heavenly_stem"] = pillar_match.group(1)
                luck_cycle["earthly_branch"] = pillar_match.group(2)
                luck_cycle["pillar"] = pillar_match.group(1) + pillar_match.group(2)
            
            # 提取十二长生
            stages = ['长', '沐', '冠', '建', '帝', '衰', '病', '死', '墓', '绝', '胎', '养']
            for stage in stages:
                if stage in line:
                    luck_cycle["twelve_stages"] = stage
                    break
            
            # 提取纳音
            nayin_patterns = [
                '杨柳木', '井泉水', '屋上土', '霹雳火', '松柏木', '长流水', '砂中金', '山下火',
                '平地木', '壁上土', '金泊金', '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
                '大溪水', '砂中土', '天上火', '石榴木', '大海水', '海中金', '炉中火', '大林木',
                '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金'
            ]
            for nayin in nayin_patterns:
                if nayin in line:
                    luck_cycle["nayin"] = nayin
                    break
            
            # 提取十神
            ten_god_match = re.search(r'([比劫食伤才财杀官枭印]):', line)
            if ten_god_match:
                luck_cycle["ten_god"] = ten_god_match.group(1)
            
            return luck_cycle
            
        except Exception as e:
            print(f"大运解析错误: {e}")
            return None

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

# Vercel serverless function handler
def handler(request):
    return app(request.environ, lambda status, headers: None)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)