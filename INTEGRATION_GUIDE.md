# Bazi Calculator Integration Guide

## 🏗️ 架构概览

```
前端网站 (HTML/CSS/JS)
    ↓ AJAX请求
后端API (Flask + bazi.py)
    ↓ 调用
Python八字计算库 (bazi.py)
```

## 📋 集成步骤

### 1. 准备bazi.py文件
```bash
# 从GitHub下载bazi项目
git clone https://github.com/china-testing/bazi.git
cd bazi

# 复制bazi.py到你的项目目录
cp bazi.py /path/to/your/project/
```

### 2. 安装Python依赖
```bash
# 安装Flask和相关依赖
pip install -r requirements.txt

# 或者单独安装
pip install Flask Flask-CORS
```

### 3. 启动API服务器
```bash
# 启动开发服务器
python bazi_api.py

# 服务器将在 http://localhost:5000 启动
```

### 4. 测试API
```bash
# 测试健康检查
curl http://localhost:5000/api/health

# 测试八字计算
curl -X POST http://localhost:5000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "year": 1990,
    "month": 5,
    "day": 15,
    "hour": 14,
    "gender": "male",
    "calendar_type": "gregorian"
  }'
```

## 🎯 前端集成

### HTML表单结构
- 年月日时选择器
- 性别选择（男/女）
- 日历类型选择（公历/农历）
- 提交按钮和加载状态

### JavaScript功能
- 表单验证
- API调用
- 结果展示
- 错误处理

### 结果展示组件
1. **四柱显示** - 年月日时柱的天干地支
2. **五行分析** - 五行分数和图表
3. **基本信息** - 公历农历日期
4. **错误处理** - 友好的错误信息显示

## 🔧 API接口说明

### POST /api/calculate

**请求参数:**
```json
{
  "year": 1990,        // 出生年份 (必需)
  "month": 5,          // 出生月份 (必需)
  "day": 15,           // 出生日期 (必需)
  "hour": 14,          // 出生时辰 (必需)
  "gender": "male",    // 性别: "male" | "female"
  "calendar_type": "gregorian"  // 日历: "gregorian" | "lunar"
}
```

**响应格式:**
```json
{
  "success": true,
  "data": {
    "basic_info": {
      "gregorian_date": "1990年5月15日",
      "lunar_date": "1990年4月21日"
    },
    "four_pillars": {
      "year": "庚午",
      "month": "辛巳", 
      "day": "癸未",
      "hour": "己未"
    },
    "five_elements": {
      "scores": {
        "木": 1,
        "火": 13,
        "土": 17,
        "金": 19,
        "水": 10
      },
      "strength": 29
    },
    "analysis": {
      "patterns": ["才", "杀"]
    }
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

## 🚀 部署建议

### 开发环境
- 使用Flask开发服务器
- API地址: `http://localhost:5000`

### 生产环境
```bash
# 使用Gunicorn部署
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 bazi_api:app

# 或使用uWSGI
pip install uwsgi
uwsgi --http :5000 --wsgi-file bazi_api.py --callable app
```

### 云服务部署
- **Heroku**: 添加Procfile
- **AWS Lambda**: 使用Zappa框架
- **Docker**: 创建Dockerfile

## ⚠️ 注意事项

### 许可证问题
- bazi.py项目没有明确的开源许可证
- 商业使用前需要联系原作者获得许可
- 建议在网站上注明来源和感谢

### 性能优化
- 添加结果缓存机制
- 使用Redis缓存常见计算
- 考虑异步处理大量请求

### 错误处理
- 网络连接失败
- API服务器不可用
- 输入参数验证
- 计算结果解析错误

## 🔄 后续扩展

### 功能增强
- 添加合婚功能
- 风水分析
- 大运流年详细解读
- 个性化建议

### 技术升级
- 添加用户系统
- 历史记录保存
- 结果分享功能
- 移动端优化

## 📞 技术支持

如果在集成过程中遇到问题：
1. 检查API服务器是否正常运行
2. 验证请求参数格式
3. 查看浏览器控制台错误信息
4. 检查网络连接和CORS设置