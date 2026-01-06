// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// FAQ accordion functionality
document.querySelectorAll('.faq-item h3').forEach(question => {
    question.addEventListener('click', function() {
        const faqItem = this.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all other FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Toggle current FAQ item
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// Add hover effects to feature cards using CSS classes
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.classList.add('hover-enhanced');
        this.classList.remove('hover-reset');
    });
    
    card.addEventListener('mouseleave', function() {
        this.classList.remove('hover-enhanced');
        this.classList.add('hover-reset');
    });
});

// Bazi Calculator Functionality
class BaziCalculator {
    constructor() {
        this.apiUrl = 'http://localhost:5001/api/calculate'; // 更新API地址
        this.form = document.getElementById('baziForm');
        this.resultsContainer = document.getElementById('calculatorResults');
        this.errorContainer = document.getElementById('errorMessage');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }
    
    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(this.form);
        const data = {
            year: parseInt(formData.get('year')),
            month: parseInt(formData.get('month')),
            day: parseInt(formData.get('day')),
            hour: parseInt(formData.get('hour')),
            gender: formData.get('gender'),
            calendar_type: formData.get('calendar_type')
        };
        
        // 验证数据
        if (!this.validateInput(data)) {
            return;
        }
        
        // 显示加载状态
        this.setLoadingState(true);
        
        try {
            const result = await this.callBaziAPI(data);
            if (result.success) {
                this.lastData = result.data;
                this.displayResults(result.data);
            } else {
                this.displayError(result.error || 'Calculation failed');
            }
        } catch (error) {
            console.error('API call failed:', error);
            this.displayError('Network error. Please check if the API server is running.');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    validateInput(data) {
        // 基本验证
        if (!data.year || !data.month || !data.day || data.hour === null) {
            alert('Please fill in all required fields');
            return false;
        }
        
        // 年份验证
        if (data.year < 1900 || data.year > 2100) {
            alert('Please enter a valid year (1900-2100)');
            return false;
        }
        
        // 月份验证
        if (data.month < 1 || data.month > 12) {
            alert('Please enter a valid month (1-12)');
            return false;
        }
        
        // 日期验证
        if (data.day < 1 || data.day > 31) {
            alert('Please enter a valid day (1-31)');
            return false;
        }
        
        return true;
    }
    
    async callBaziAPI(data) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    setLoadingState(isLoading) {
        const btn = document.getElementById('calculateBtn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoading = btn.querySelector('.btn-loading');
        
        if (isLoading) {
            btn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
        } else {
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }
    
    displayResults(data) {
        // 隐藏错误信息
        this.errorContainer.style.display = 'none';
        
        // 显示四柱信息
        if (data.four_pillars) {
            document.getElementById('yearPillar').textContent = data.four_pillars.year || '--';
            document.getElementById('monthPillar').textContent = data.four_pillars.month || '--';
            document.getElementById('dayPillar').textContent = data.four_pillars.day || '--';
            document.getElementById('hourPillar').textContent = data.four_pillars.hour || '--';
            
            // 显示四柱对应的十神
            this.displayPillarElements(data.four_pillars);
            
            // 自动生成四柱图片
            this.buildPillarsSectionImage(data);
            this.showPillarsImage();
        }
        
        // 显示五行分析
        if (data.five_elements && data.five_elements.scores) {
            this.displayFiveElements(data.five_elements.scores, data.five_elements.status);
            
            if (data.five_elements.strength) {
                document.getElementById('chartStrength').textContent = data.five_elements.strength;
                
                // 显示强弱平衡状态
                const balance = this.analyzeElementBalance(data.five_elements.scores, data.five_elements.strength);
                document.getElementById('elementBalance').textContent = balance;
            }
            
            // 显示中值和强根信息
            if (data.five_elements.middle_value) {
                const strengthElement = document.getElementById('chartStrength');
                if (strengthElement) {
                    strengthElement.textContent = `${data.five_elements.strength} (中值: ${data.five_elements.middle_value})`;
                }
            }
            
            // 自动生成五行图片
            this.buildElementsSectionImage(data);
            this.showElementsImage();
        }
        
        // 显示强弱分析
        this.displayStrengthAnalysis(data);
        
        // 显示十神分析
        this.displayTenGods(data);
        
        // 显示格局分析
        this.displayPatterns(data);
        
        // 显示神煞
        this.displaySpiritualStars(data);
        
        // 显示基本信息
        if (data.basic_info) {
            const setIfExists = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value || '--'; };
            setIfExists('gregorianDate', data.basic_info.gregorian_date);
            setIfExists('lunarDate', data.basic_info.lunar_date);
            setIfExists('lifePalace', data.basic_info.life_palace);
            setIfExists('bodyPalace', data.basic_info.body_palace);
            setIfExists('taiyuan', data.basic_info.taiyuan);
            setIfExists('solarTerms', data.basic_info.solar_terms || data.basic_info.lichun_time);
            
            // 从原始输出中提取更多信息
            this.extractAdditionalInfo(data.raw_output);
        }
        
        // 显示个性分析
        this.displayPersonalityInsights(data);
        
        // 显示生活指导
        this.displayLifeGuidance(data);
        
        // 更新概览部分的摘要卡片
        this.updateSummaryCards(data);
        
        // 显示原始输出（调试用）
        if (data.raw_output) {
            document.getElementById('rawOutput').textContent = data.raw_output;
        }
        
        // 显示结果容器
        this.resultsContainer.style.display = 'block';
        
        // 确保概览标签页是激活状态
        if (window.breadcrumbNav) {
            window.breadcrumbNav.switchToSection('pillars');
        }
        
        // 滚动到结果区域
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
        this.buildShareCard(data);
        this.buildPillarsSectionImage(data);
        this.buildElementsSectionImage(data);
    }
    
    displayPillarElements(pillars) {
        // 简化的十神对应关系（实际应该根据日干来计算）
        const elements = {
            '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', 
            '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
        };
        
        if (pillars.year) {
            const yearElement = elements[pillars.year[0]] || '';
            document.getElementById('yearElement').textContent = yearElement;
        }
        if (pillars.month) {
            const monthElement = elements[pillars.month[0]] || '';
            document.getElementById('monthElement').textContent = monthElement;
        }
        if (pillars.day) {
            const dayElement = elements[pillars.day[0]] || '';
            document.getElementById('dayElement').textContent = dayElement;
        }
        if (pillars.hour) {
            const hourElement = elements[pillars.hour[0]] || '';
            document.getElementById('hourElement').textContent = hourElement;
        }
    }
    
    analyzeElementBalance(scores, strength) {
        const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
        const average = total / 5;
        const variance = Object.values(scores).reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / 5;
        
        if (variance < 10) return "Balanced";
        if (strength > 35) return "Strong";
        if (strength < 25) return "Weak";
        return "Moderate";
    }
    
    displayTenGods(data) {
        const tenGodsGrid = document.getElementById('tenGodsGrid');
        tenGodsGrid.innerHTML = '';
        
        // 优先使用解析出的十神信息
        let tenGods = [];
        if (data.analysis && data.analysis.ten_gods) {
            tenGods = data.analysis.ten_gods.map(god => ({
                name: this.getTenGodFullName(god),
                value: god
            }));
        } else {
            // 从原始输出中提取十神信息
            tenGods = this.extractTenGods(data.raw_output);
        }
        
        tenGods.forEach(god => {
            const godItem = document.createElement('div');
            godItem.className = 'god-item';
            godItem.innerHTML = `
                <div class="god-name">${god.name}</div>
                <div class="god-value">${god.value}</div>
            `;
            tenGodsGrid.appendChild(godItem);
        });
    }
    
    getTenGodFullName(shortName) {
        const godNames = {
            '比': '比肩',
            '劫': '劫财', 
            '食': '食神',
            '伤': '伤官',
            '才': '偏财',
            '财': '正财',
            '杀': '七杀',
            '官': '正官',
            '枭': '偏印',
            '印': '正印'
        };
        return godNames[shortName] || shortName;
    }
    
    extractTenGods(rawOutput) {
        // 简化的十神提取（实际需要更复杂的解析）
        const gods = [
            { name: '比肩', value: '比' },
            { name: '劫财', value: '劫' },
            { name: '食神', value: '食' },
            { name: '伤官', value: '伤' },
            { name: '偏财', value: '才' },
            { name: '正财', value: '财' },
            { name: '七杀', value: '杀' },
            { name: '正官', value: '官' },
            { name: '偏印', value: '枭' },
            { name: '正印', value: '印' }
        ];
        
        return gods.slice(0, 6); // 显示前6个
    }
    
    displayPatterns(data) {
        // 从分析数据中提取格局信息
        let primaryPattern = '--';
        let secondaryPattern = '--';
        
        if (data.analysis && data.analysis.patterns) {
            primaryPattern = data.analysis.patterns[0] || '--';
            secondaryPattern = data.analysis.patterns[1] || '--';
        }
        
        // 从原始输出中提取格局
        if (data.raw_output) {
            const patternMatch = data.raw_output.match(/格局选用：([^\\n]+)/);
            if (patternMatch) {
                const patterns = patternMatch[1].split(/[：；]/);
                if (patterns.length > 1) {
                    primaryPattern = patterns[1].trim();
                }
            }
        }
        
        document.getElementById('primaryPattern').textContent = primaryPattern;
        document.getElementById('secondaryPattern').textContent = secondaryPattern;
    }
    
    displaySpiritualStars(data) {
        const starsGrid = document.getElementById('spiritualStars');
        starsGrid.innerHTML = '';
        
        // 从原始输出中提取神煞
        const stars = this.extractSpiritualStars(data.raw_output);
        
        stars.forEach(star => {
            const starTag = document.createElement('div');
            starTag.className = 'star-tag';
            starTag.textContent = star;
            starsGrid.appendChild(starTag);
        });
    }
    
    extractSpiritualStars(rawOutput) {
        const stars = [];
        if (!rawOutput) return stars;
        
        // 提取常见神煞
        const starPatterns = [
            '天乙', '驿马', '桃花', '华盖', '文昌', '天德', '月德',
            '劫煞', '亡神', '孤辰', '寡宿', '红艳', '将星', '大耗'
        ];
        
        starPatterns.forEach(pattern => {
            if (rawOutput.includes(pattern)) {
                stars.push(pattern);
            }
        });
        
        return stars.slice(0, 8); // 最多显示8个
    }
    
    extractAdditionalInfo(rawOutput) {
        if (!rawOutput) return;
        
        // 提取节气信息
        const solarTermsMatch = rawOutput.match(/立[^\\s]+\\s+[^\\s]+\\s+[^\\s]+/);
        if (solarTermsMatch) {
            document.getElementById('solarTerms').textContent = solarTermsMatch[0];
        }
        
        // 提取命宫信息
        const lifePalaceMatch = rawOutput.match(/命宫:([^\\s]+)/);
        if (lifePalaceMatch) {
            document.getElementById('lifePalace').textContent = lifePalaceMatch[1];
        }
    }
    
    displayPersonalityInsights(data) {
        // 基于五行和格局的个性分析
        const insights = this.generatePersonalityInsights(data);
        
        document.getElementById('characterTraits').textContent = insights.character;
        document.getElementById('strengthsTalents').textContent = insights.strengths;
        document.getElementById('areasGrowth').textContent = insights.growth;
    }
    
    generatePersonalityInsights(data) {
        // 简化的个性分析逻辑
        let character = "Based on your bazi chart, you possess a unique combination of traits that reflect the balance of five elements in your constitution.";
        let strengths = "Your natural abilities shine through your elemental composition, providing you with distinctive talents and capabilities.";
        let growth = "Every chart has areas for development, and understanding these can help you achieve greater balance and fulfillment.";
        
        if (data.five_elements && data.five_elements.scores) {
            const scores = data.five_elements.scores;
            const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
            
            switch (dominant) {
                case '木':
                    character = "You have a strong Wood element, indicating creativity, growth-oriented thinking, and natural leadership abilities.";
                    strengths = "Your innovative spirit and ability to adapt make you excellent at pioneering new projects and inspiring others.";
                    break;
                case '火':
                    character = "Fire dominates your chart, suggesting passion, enthusiasm, and strong communication skills.";
                    strengths = "Your charismatic personality and ability to motivate others are your greatest assets in both personal and professional relationships.";
                    break;
                case '土':
                    character = "Earth element prominence indicates stability, reliability, and practical wisdom in your approach to life.";
                    strengths = "Your grounded nature and ability to build lasting foundations make you a trusted advisor and dependable partner.";
                    break;
                case '金':
                    character = "Metal element strength suggests precision, determination, and strong analytical abilities.";
                    strengths = "Your attention to detail and systematic approach help you excel in fields requiring accuracy and strategic thinking.";
                    break;
                case '水':
                    character = "Water element dominance indicates intuition, adaptability, and deep emotional intelligence.";
                    strengths = "Your ability to flow with circumstances and understand others' emotions makes you naturally wise and empathetic.";
                    break;
            }
        }
        
        return { character, strengths, growth };
    }
    
    displayLifeGuidance(data) {
        // 生活各方面的指导建议
        const guidance = this.generateLifeGuidance(data);
        
        document.getElementById('careerWealth').textContent = guidance.career;
        document.getElementById('relationships').textContent = guidance.relationships;
        document.getElementById('healthWellness').textContent = guidance.health;
        document.getElementById('lifePurpose').textContent = guidance.purpose;
    }
    
    generateLifeGuidance(data) {
        return {
            career: "Your elemental composition suggests certain career paths may be more harmonious with your natural energy. Consider fields that align with your dominant elements.",
            relationships: "Understanding your bazi chart can help you build more harmonious relationships by recognizing compatible energy patterns and communication styles.",
            health: "Your five-element balance indicates specific areas of health to focus on. Maintaining elemental harmony through lifestyle choices supports overall wellbeing.",
            purpose: "Your unique bazi pattern reveals your spiritual path and life mission. Embracing your authentic nature leads to greater fulfillment and success."
        };
    }
    
    updateSummaryCards(data) {
        // Update chart strength summary
        const strengthElement = document.getElementById('summaryStrength');
        if (strengthElement && data.five_elements && data.five_elements.strength) {
            strengthElement.textContent = data.five_elements.strength;
        }
        
        // Update element balance summary
        const balanceElement = document.getElementById('summaryBalance');
        if (balanceElement && data.five_elements && data.five_elements.scores) {
            const balance = this.analyzeElementBalance(data.five_elements.scores, data.five_elements.strength);
            balanceElement.textContent = balance;
        }
        
        // Update primary pattern summary
        const patternElement = document.getElementById('summaryPattern');
        if (patternElement) {
            let primaryPattern = '--';
            
            if (data.analysis && data.analysis.patterns) {
                primaryPattern = data.analysis.patterns[0] || '--';
            } else if (data.raw_output) {
                const patternMatch = data.raw_output.match(/格局选用：([^\\n]+)/);
                if (patternMatch) {
                    const patterns = patternMatch[1].split(/[：；]/);
                    if (patterns.length > 1) {
                        primaryPattern = patterns[1].trim();
                    }
                }
            }
            
            patternElement.textContent = primaryPattern;
        }
    }
    
    showPillarsImage() {
        const imageContainer = document.getElementById('pillarsImage');
        if (imageContainer) {
            imageContainer.style.display = 'block';
        }
    }
    
    showElementsImage() {
        const imageContainer = document.getElementById('elementsImage');
        if (imageContainer) {
            imageContainer.style.display = 'block';
        }
    }
    
    displayStrengthAnalysis(data) {
        // 显示总分数
        const totalScoreElement = document.getElementById('strengthTotalScore');
        if (totalScoreElement && data.five_elements && data.five_elements.strength) {
            totalScoreElement.textContent = data.five_elements.strength;
        }
        
        // 显示强弱分类
        const classificationElement = document.getElementById('strengthClassification');
        if (classificationElement && data.five_elements && data.five_elements.strength) {
            const strength = data.five_elements.strength;
            const isWeak = strength <= 29;
            classificationElement.textContent = isWeak ? 'Weak (偏弱)' : 'Strong (偏强)';
            classificationElement.style.color = isWeak ? '#dc2626' : '#059669';
        }
        
        // 显示湿度分数
        const humidityScoreElement = document.getElementById('humidityScore');
        if (humidityScoreElement && data.analysis && data.analysis.humidity) {
            humidityScoreElement.textContent = data.analysis.humidity;
        }
        
        // 显示湿度状态
        const humidityConditionElement = document.getElementById('humidityCondition');
        if (humidityConditionElement && data.analysis && data.analysis.humidity) {
            const humidity = parseInt(data.analysis.humidity);
            let condition = 'Normal';
            let color = '#059669';
            
            if (humidity < -3) {
                condition = 'Cold & Wet (偏寒湿)';
                color = '#1d4ed8';
            } else if (humidity > 3) {
                condition = 'Hot & Dry (偏燥热)';
                color = '#dc2626';
            } else {
                condition = 'Balanced (平衡)';
                color = '#059669';
            }
            
            humidityConditionElement.textContent = condition;
            humidityConditionElement.style.color = color;
        }
        
        // 显示强弱影响解读
        this.displayStrengthInterpretation(data);
    }
    
    displayStrengthInterpretation(data) {
        const strengthImpactElement = document.getElementById('strengthImpact');
        const humidityImpactElement = document.getElementById('humidityImpact');
        const recommendationsElement = document.getElementById('strengthRecommendations');
        
        if (!data.five_elements || !data.five_elements.strength) return;
        
        const strength = data.five_elements.strength;
        const isWeak = strength <= 29;
        const humidity = data.analysis && data.analysis.humidity ? parseInt(data.analysis.humidity) : 0;
        
        // 强弱影响
        if (strengthImpactElement) {
            if (isWeak) {
                strengthImpactElement.textContent = `With a chart strength of ${strength} (below threshold of 29), you have a naturally gentle and adaptable personality. You may be more sensitive to environmental changes and prefer collaborative approaches over direct confrontation. This suggests a need for supportive relationships and stable environments to thrive.`;
            } else {
                strengthImpactElement.textContent = `With a chart strength of ${strength} (above threshold of 29), you possess strong personal energy and resilience. You're likely independent, decisive, and capable of handling challenges directly. This indicates natural leadership abilities and the capacity to overcome obstacles through personal effort.`;
            }
        }
        
        // 湿度影响
        if (humidityImpactElement) {
            if (humidity < -3) {
                humidityImpactElement.textContent = `Your humidity score of ${humidity} indicates a cold and wet constitution. This suggests you may be more introspective, emotional, and prefer quiet environments. You might be naturally empathetic but could benefit from activities that generate warmth and energy.`;
            } else if (humidity > 3) {
                humidityImpactElement.textContent = `Your humidity score of ${humidity} indicates a hot and dry constitution. This suggests you're likely energetic, direct, and action-oriented. You may have strong opinions and prefer dynamic environments, but should be mindful of maintaining emotional balance.`;
            } else {
                humidityImpactElement.textContent = `Your humidity score of ${humidity} falls within the normal range, indicating a well-balanced emotional and energetic constitution. You can adapt to various situations and maintain stability in different environments.`;
            }
        }
        
        // 建议
        if (recommendationsElement) {
            let recommendations = [];
            
            if (isWeak) {
                recommendations.push("Focus on building supportive relationships and stable routines");
                recommendations.push("Avoid overexertion and prioritize rest and recovery");
                recommendations.push("Seek environments that nurture your gentle nature");
            } else {
                recommendations.push("Channel your strong energy into leadership roles");
                recommendations.push("Practice patience and consideration for others");
                recommendations.push("Take on challenges that utilize your natural resilience");
            }
            
            if (humidity < -3) {
                recommendations.push("Engage in warming activities like exercise or social gatherings");
                recommendations.push("Spend time in sunny, dry environments when possible");
            } else if (humidity > 3) {
                recommendations.push("Practice cooling activities like meditation or water sports");
                recommendations.push("Seek balance through quiet, reflective practices");
            }
            
            recommendationsElement.textContent = recommendations.join('. ') + '.';
        }
    }
    
    displayFiveElements(scores, status) {
        const elementsChart = document.getElementById('elementsChart');
        elementsChart.innerHTML = '';
        
        const elements = [
            { name: '木 Wood', key: '木', color: '#059669' },
            { name: '火 Fire', key: '火', color: '#dc2626' },
            { name: '土 Earth', key: '土', color: '#ea580c' },
            { name: '金 Metal', key: '金', color: '#64748b' },
            { name: '水 Water', key: '水', color: '#1d4ed8' }
        ];
        
        elements.forEach(element => {
            const score = scores[element.key] || 0;
            const elementStatus = status && status[element.key] ? status[element.key] : '';
            
            const elementBar = document.createElement('div');
            elementBar.className = 'element-bar';
            elementBar.style.borderLeftColor = element.color;
            elementBar.innerHTML = `
                <div class="element-name">${element.name}</div>
                <div class="element-score">${score}</div>
                ${elementStatus ? `<div class="element-status">${elementStatus}</div>` : ''}
            `;
            elementsChart.appendChild(elementBar);
        });
    }
    
    displayError(errorMessage) {
        // 隐藏结果
        this.resultsContainer.style.display = 'none';
        
        // 显示错误信息
        document.getElementById('errorText').textContent = errorMessage;
        this.errorContainer.style.display = 'block';
        
        // 滚动到错误区域
        this.errorContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
}

BaziCalculator.prototype.buildShareCard = function(data) {
    const svg = document.getElementById('shareSvg');
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    
    const cx = 540, cy = 540;
    const bg = createSvgEl('rect', { x: 0, y: 0, width: 1080, height: 1080, rx: 40, fill: '#121326' });
    svg.appendChild(bg);
    
    const defs = createSvgEl('defs');
    const grad = createSvgEl('linearGradient', { id: 'logoGrad', x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
    grad.appendChild(createSvgEl('stop', { offset: '0%', 'stop-color': '#f59e0b' }));
    grad.appendChild(createSvgEl('stop', { offset: '50%', 'stop-color': '#ea580c' }));
    grad.appendChild(createSvgEl('stop', { offset: '100%', 'stop-color': '#7c3aed' }));
    defs.appendChild(grad);
    svg.appendChild(defs);
    
    const title = createSvgEl('text', { x: 540, y: 120, 'text-anchor': 'middle', fill: '#f59e0b', 'font-size': '48', 'font-family': 'JetBrains Mono, monospace' });
    title.textContent = '你的八字能量图谱';
    svg.appendChild(title);
    
    const compassR = 420;
    const compassBase = createSvgEl('circle', { cx, cy, r: compassR, fill: 'none', stroke: 'rgba(245,158,11,0.25)', 'stroke-width': 2 });
    svg.appendChild(compassBase);
    
    const zhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    zhi.forEach((z, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const tx = cx + Math.cos(angle) * (compassR + 34);
        const ty = cy + Math.sin(angle) * (compassR + 34);
        const tickStartX = cx + Math.cos(angle) * (compassR - 12);
        const tickStartY = cy + Math.sin(angle) * (compassR - 12);
        const tickEndX = cx + Math.cos(angle) * (compassR + 12);
        const tickEndY = cy + Math.sin(angle) * (compassR + 12);
        const tick = createSvgEl('line', { x1: tickStartX, y1: tickStartY, x2: tickEndX, y2: tickEndY, stroke: 'rgba(245,158,11,0.35)', 'stroke-width': 2 });
        svg.appendChild(tick);
        const label = createSvgEl('text', { x: tx, y: ty, fill: '#cbd5e1', 'font-size': '26', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
        label.textContent = z;
        svg.appendChild(label);
    });
    
    const ringR = 360;
    const scores = (data.five_elements && data.five_elements.scores) ? data.five_elements.scores : { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 };
    const order = ['木', '火', '土', '金', '水'];
    const colors = { '木': '#059669', '火': '#dc2626', '土': '#ea580c', '金': '#64748b', '水': '#1d4ed8' };
    const total = order.reduce((s, k) => s + (scores[k] || 0), 0) || 1;
    const circumference = 2 * Math.PI * ringR;
    
    const ringBg = createSvgEl('circle', { cx, cy, r: ringR, fill: 'none', stroke: 'rgba(148,163,184,0.15)', 'stroke-width': 28 });
    svg.appendChild(ringBg);
    
    let offset = 0;
    order.forEach(k => {
        const value = scores[k] || 0;
        const segLen = circumference * (value / total);
        const circle = createSvgEl('circle', {
            cx, cy, r: ringR, fill: 'none', stroke: colors[k], 'stroke-width': 28,
            'stroke-linecap': 'round', 'stroke-dasharray': `${segLen} ${circumference - segLen}`,
            'stroke-dashoffset': `${offset}`, transform: `rotate(-90 ${cx} ${cy})`
        });
        svg.appendChild(circle);
        offset += segLen;
    });
    
    const legendY = 940;
    order.forEach((k, idx) => {
        const lx = 180 + idx * 180;
        const sw = createSvgEl('rect', { x: lx, y: legendY - 22, width: 30, height: 12, rx: 3, fill: colors[k] });
        const lt = createSvgEl('text', { x: lx + 40, y: legendY - 12, fill: '#e5e7eb', 'font-size': '24' });
        lt.textContent = `${k} ${scores[k] || 0}`;
        svg.appendChild(sw);
        svg.appendChild(lt);
    });
    
    const pillars = data.four_pillars || {};
    const pillarGroupY = 760;
    const pw = 220, ph = 120, gap = 30;
    const labels = [
        { k: 'year', name: '年柱' },
        { k: 'month', name: '月柱' },
        { k: 'day', name: '日柱' },
        { k: 'hour', name: '时柱' }
    ];
    labels.forEach((item, i) => {
        const x = 90 + i * (pw + gap);
        const card = createSvgEl('rect', { x, y: pillarGroupY, width: pw, height: ph, rx: 16, fill: 'rgba(248,250,252,0.06)', stroke: 'rgba(245,158,11,0.25)' });
        svg.appendChild(card);
        const lt = createSvgEl('text', { x: x + pw / 2, y: pillarGroupY + 40, 'text-anchor': 'middle', fill: '#cbd5e1', 'font-size': '22' });
        lt.textContent = item.name;
        svg.appendChild(lt);
        const val = createSvgEl('text', { x: x + pw / 2, y: pillarGroupY + 80, 'text-anchor': 'middle', fill: '#f8fafc', 'font-size': '36', 'font-family': 'JetBrains Mono, monospace' });
        val.textContent = pillars[item.k] || '--';
        svg.appendChild(val);
    });
    
    const pillarColors = { year: '#7c3aed', month: '#ea580c', day: '#f59e0b', hour: '#1d4ed8' };
    function pickZhi(text) {
        if (!text) return null;
        for (let i = text.length - 1; i >= 0; i--) {
            if (zhi.includes(text[i])) return text[i];
        }
        return null;
    }
    ['year','month','day','hour'].forEach(key => {
        const z = pickZhi(pillars[key]);
        if (!z) return;
        const idx = zhi.indexOf(z);
        const angle = (idx / 12) * Math.PI * 2 - Math.PI / 2;
        const hx = cx + Math.cos(angle) * (compassR);
        const hy = cy + Math.sin(angle) * (compassR);
        const dot = createSvgEl('circle', { cx: hx, cy: hy, r: 10, fill: pillarColors[key], stroke: '#ffffff', 'stroke-width': 2 });
        svg.appendChild(dot);
        const capx = cx + Math.cos(angle) * (compassR + 60);
        const capy = cy + Math.sin(angle) * (compassR + 60);
        const tag = createSvgEl('text', { x: capx, y: capy, fill: pillarColors[key], 'font-size': '20', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
        tag.textContent = key === 'year' ? '年' : key === 'month' ? '月' : key === 'day' ? '日' : '时';
        svg.appendChild(tag);
    });
    
    const logoBox = createSvgEl('rect', { x: 820, y: 995, width: 240, height: 50, rx: 12, fill: 'rgba(248,250,252,0.06)', stroke: 'rgba(245,158,11,0.25)' });
    svg.appendChild(logoBox);
    const logoDot = createSvgEl('circle', { cx: 840, cy: 1020, r: 10, fill: 'url(#logoGrad)' });
    svg.appendChild(logoDot);
    const logoText = createSvgEl('text', { x: 860, y: 1026, fill: 'url(#logoGrad)', 'font-size': '22' });
    logoText.textContent = 'Bazi Calculator';
    svg.appendChild(logoText);
    
    const footer = createSvgEl('text', { x: 540, y: 1020, 'text-anchor': 'middle', fill: '#94a3b8', 'font-size': '20' });
    footer.textContent = '保存分享图 · 由 Bazi Calculator 生成';
    svg.appendChild(footer);
};

BaziCalculator.prototype.generateShareImage = function() {
    const svgEl = document.getElementById('shareSvg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#121326';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = 'bazi-share.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    img.src = svgUrl;
};

BaziCalculator.prototype.exportSvgAsPng = function(svgId, fileName, width, height, bg) {
    const svgEl = document.getElementById(svgId);
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bg || '#121326';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    img.src = svgUrl;
};

BaziCalculator.prototype.generatePillarsImage = function() {
    this.exportSvgAsPng('pillarsSvg', 'bazi-pillars.png', 1080, 540, '#121326');
};

BaziCalculator.prototype.generateElementsImage = function() {
    this.exportSvgAsPng('elementsSvg', 'bazi-elements.png', 1080, 540, '#121326');
};

BaziCalculator.prototype.buildPillarsSectionImage = function(data) {
    const svg = document.getElementById('pillarsSvg');
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    
    // 背景
    const bg = createSvgEl('rect', { x: 0, y: 0, width: 1080, height: 540, rx: 32, fill: '#121326' });
    svg.appendChild(bg);
    
    // 标题
    const title = createSvgEl('text', { x: 540, y: 80, 'text-anchor': 'middle', fill: '#f59e0b', 'font-size': '42', 'font-family': 'Crimson Pro, serif', 'font-weight': 'bold' });
    title.textContent = '四柱 Four Pillars';
    svg.appendChild(title);
    
    const pillars = data.four_pillars || {};
    const pw = 200, ph = 160, gap = 50, startX = 90, y = 200;
    
    const labels = [
        { k: 'year', n: '年柱', en: 'Year' },
        { k: 'month', n: '月柱', en: 'Month' },
        { k: 'day', n: '日柱', en: 'Day' },
        { k: 'hour', n: '时柱', en: 'Hour' }
    ];
    
    const colors = ['#7c3aed', '#ea580c', '#f59e0b', '#1d4ed8'];
    
    labels.forEach((item, i) => {
        const x = startX + i * (pw + gap);
        
        // 柱子卡片
        const card = createSvgEl('rect', { 
            x, y, width: pw, height: ph, rx: 20, 
            fill: 'rgba(248,250,252,0.08)', 
            stroke: colors[i], 
            'stroke-width': 2 
        });
        svg.appendChild(card);
        
        // 中文标签
        const cnLabel = createSvgEl('text', { 
            x: x + pw / 2, y: y + 35, 
            'text-anchor': 'middle', 
            fill: colors[i], 
            'font-size': '24', 
            'font-weight': 'bold' 
        });
        cnLabel.textContent = item.n;
        svg.appendChild(cnLabel);
        
        // 英文标签
        const enLabel = createSvgEl('text', { 
            x: x + pw / 2, y: y + 60, 
            'text-anchor': 'middle', 
            fill: '#cbd5e1', 
            'font-size': '18' 
        });
        enLabel.textContent = item.en;
        svg.appendChild(enLabel);
        
        // 八字值
        const value = createSvgEl('text', { 
            x: x + pw / 2, y: y + 110, 
            'text-anchor': 'middle', 
            fill: '#f8fafc', 
            'font-size': '48', 
            'font-family': 'JetBrains Mono, monospace',
            'font-weight': 'bold'
        });
        value.textContent = pillars[item.k] || '--';
        svg.appendChild(value);
        
        // 装饰线
        const line = createSvgEl('line', { 
            x1: x + 20, y1: y + 75, 
            x2: x + pw - 20, y2: y + 75, 
            stroke: colors[i], 
            'stroke-width': 1, 
            opacity: 0.5 
        });
        svg.appendChild(line);
    });
    
    // 底部装饰
    const decorLine = createSvgEl('line', { 
        x1: 100, y1: 450, 
        x2: 980, y2: 450, 
        stroke: 'rgba(245,158,11,0.3)', 
        'stroke-width': 2 
    });
    svg.appendChild(decorLine);
    
    // Logo
    const logoText = createSvgEl('text', { 
        x: 540, y: 490, 
        'text-anchor': 'middle', 
        fill: '#94a3b8', 
        'font-size': '20' 
    });
    logoText.textContent = 'Generated by Bazi Calculator';
    svg.appendChild(logoText);
};

BaziCalculator.prototype.buildElementsSectionImage = function(data) {
    const svg = document.getElementById('elementsSvg');
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    
    // 背景
    const bg = createSvgEl('rect', { x: 0, y: 0, width: 1080, height: 540, rx: 32, fill: '#121326' });
    svg.appendChild(bg);
    
    // 标题
    const title = createSvgEl('text', { x: 540, y: 80, 'text-anchor': 'middle', fill: '#f59e0b', 'font-size': '42', 'font-family': 'Crimson Pro, serif', 'font-weight': 'bold' });
    title.textContent = '五行分析 Five Elements';
    svg.appendChild(title);
    
    const scores = (data.five_elements && data.five_elements.scores) ? data.five_elements.scores : { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    const status = (data.five_elements && data.five_elements.status) ? data.five_elements.status : {};
    
    const elements = [
        { key: '木', name: 'Wood', color: '#059669', x: 120 },
        { key: '火', name: 'Fire', color: '#dc2626', x: 300 },
        { key: '土', name: 'Earth', color: '#ea580c', x: 480 },
        { key: '金', name: 'Metal', color: '#64748b', x: 660 },
        { key: '水', name: 'Water', color: '#1d4ed8', x: 840 }
    ];
    
    const maxScore = Math.max(...Object.values(scores)) || 1;
    const barHeight = 200;
    const barWidth = 80;
    const baseY = 400;
    
    elements.forEach(element => {
        const score = scores[element.key] || 0;
        const elementStatus = status[element.key] || '';
        const height = (score / maxScore) * barHeight;
        const x = element.x;
        const y = baseY - height;
        
        // 柱状图背景
        const bgBar = createSvgEl('rect', { 
            x: x - barWidth/2, y: baseY - barHeight, 
            width: barWidth, height: barHeight, 
            rx: 8, fill: 'rgba(148,163,184,0.1)', 
            stroke: 'rgba(148,163,184,0.2)' 
        });
        svg.appendChild(bgBar);
        
        // 实际数值柱
        const bar = createSvgEl('rect', { 
            x: x - barWidth/2, y: y, 
            width: barWidth, height: height, 
            rx: 8, fill: element.color, 
            opacity: 0.8 
        });
        svg.appendChild(bar);
        
        // 发光效果
        const glow = createSvgEl('rect', { 
            x: x - barWidth/2, y: y, 
            width: barWidth, height: height, 
            rx: 8, fill: element.color, 
            opacity: 0.3,
            filter: 'blur(4px)'
        });
        svg.appendChild(glow);
        
        // 中文标签
        const cnLabel = createSvgEl('text', { 
            x: x, y: 440, 
            'text-anchor': 'middle', 
            fill: element.color, 
            'font-size': '32', 
            'font-weight': 'bold' 
        });
        cnLabel.textContent = element.key;
        svg.appendChild(cnLabel);
        
        // 英文标签
        const enLabel = createSvgEl('text', { 
            x: x, y: 465, 
            'text-anchor': 'middle', 
            fill: '#cbd5e1', 
            'font-size': '18' 
        });
        enLabel.textContent = element.name;
        svg.appendChild(enLabel);
        
        // 分数
        const scoreText = createSvgEl('text', { 
            x: x, y: y - 10, 
            'text-anchor': 'middle', 
            fill: '#f8fafc', 
            'font-size': '24', 
            'font-weight': 'bold' 
        });
        scoreText.textContent = score.toString();
        svg.appendChild(scoreText);
        
        // 状态标签
        if (elementStatus) {
            const statusText = createSvgEl('text', { 
                x: x, y: 490, 
                'text-anchor': 'middle', 
                fill: '#f59e0b', 
                'font-size': '16', 
                'font-weight': 'bold' 
            });
            statusText.textContent = elementStatus;
            svg.appendChild(statusText);
        }
    });
    
    // 强弱信息
    if (data.five_elements && data.five_elements.strength) {
        const strengthText = createSvgEl('text', { 
            x: 540, y: 140, 
            'text-anchor': 'middle', 
            fill: '#cbd5e1', 
            'font-size': '24' 
        });
        strengthText.textContent = `Chart Strength: ${data.five_elements.strength}`;
        svg.appendChild(strengthText);
        
        if (data.five_elements.middle_value) {
            const middleText = createSvgEl('text', { 
                x: 540, y: 170, 
                'text-anchor': 'middle', 
                fill: '#94a3b8', 
                'font-size': '20' 
            });
            middleText.textContent = `Middle Value: ${data.five_elements.middle_value}`;
            svg.appendChild(middleText);
        }
    }
    
    // Logo
    const logoText = createSvgEl('text', { 
        x: 540, y: 520, 
        'text-anchor': 'middle', 
        fill: '#94a3b8', 
        'font-size': '20' 
    });
    logoText.textContent = 'Generated by Bazi Calculator';
    svg.appendChild(logoText);
};
        { k: 'hour', n: '时柱' }
    ];
    labels.forEach((item, i) => {
        const x = 110 + i * (pw + gap);
        const card = createSvgEl('rect', { x, y, width: pw, height: ph, rx: 16, fill: 'rgba(248,250,252,0.06)', stroke: 'rgba(245,158,11,0.25)' });
        svg.appendChild(card);
        const lt = createSvgEl('text', { x: x + pw / 2, y: y + 40, 'text-anchor': 'middle', fill: '#cbd5e1', 'font-size': '22' });
        lt.textContent = item.n;
        svg.appendChild(lt);
        const val = createSvgEl('text', { x: x + pw / 2, y: y + 90, 'text-anchor': 'middle', fill: '#f8fafc', 'font-size': '38', 'font-family': 'JetBrains Mono, monospace' });
        val.textContent = pillars[item.k] || '--';
        svg.appendChild(val);
    });
    const footer = createSvgEl('text', { x: 540, y: 510, 'text-anchor': 'middle', fill: '#94a3b8', 'font-size': '18' });
    footer.textContent = 'Bazi Calculator';
    svg.appendChild(footer);
};

BaziCalculator.prototype.buildElementsSectionImage = function(data) {
    const svg = document.getElementById('elementsSvg');
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const bg = createSvgEl('rect', { x: 0, y: 0, width: 1080, height: 540, rx: 32, fill: '#121326' });
    svg.appendChild(bg);
    const title = createSvgEl('text', { x: 540, y: 60, 'text-anchor': 'middle', fill: '#f59e0b', 'font-size': '36', 'font-family': 'JetBrains Mono, monospace' });
    title.textContent = '五行分析';
    svg.appendChild(title);
    const scores = (data.five_elements && data.five_elements.scores) ? data.five_elements.scores : { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 };
    const status = (data.five_elements && data.five_elements.status) ? data.five_elements.status : {};
    const colors = { '木': '#059669', '火': '#dc2626', '土': '#ea580c', '金': '#64748b', '水': '#1d4ed8' };
    const keys = ['木','火','土','金','水'];
    const baseX = 120, baseY = 140, barW = 160, barH = 260, gap = 40;
    const maxScore = Math.max(...keys.map(k => scores[k] || 0)) || 1;
    keys.forEach((k, i) => {
        const x = baseX + i * (barW + gap);
        const h = barH * ((scores[k] || 0) / maxScore);
        const barBg = createSvgEl('rect', { x, y: baseY, width: barW, height: barH, rx: 10, fill: 'rgba(148,163,184,0.15)' });
        svg.appendChild(barBg);
        const bar = createSvgEl('rect', { x, y: baseY + (barH - h), width: barW, height: h, rx: 10, fill: colors[k] });
        svg.appendChild(bar);
        const name = createSvgEl('text', { x: x + barW / 2, y: baseY + barH + 30, 'text-anchor': 'middle', fill: '#e5e7eb', 'font-size': '22' });
        name.textContent = k + ' ' + (scores[k] || 0);
        svg.appendChild(name);
        if (status[k]) {
            const st = createSvgEl('text', { x: x + barW / 2, y: baseY - 10, 'text-anchor': 'middle', fill: '#f59e0b', 'font-size': '18' });
            st.textContent = status[k];
            svg.appendChild(st);
        }
    });
    const footer = createSvgEl('text', { x: 540, y: 510, 'text-anchor': 'middle', fill: '#94a3b8', 'font-size': '18' });
    footer.textContent = 'Bazi Calculator';
    svg.appendChild(footer);
};

// Breadcrumb Navigation Functionality
class BreadcrumbNavigation {
    constructor() {
        this.tabs = document.querySelectorAll('.breadcrumb-tab');
        this.sections = document.querySelectorAll('.result-section');
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabClick(e));
        });
    }
    
    handleTabClick(event) {
        const clickedTab = event.currentTarget;
        const targetSection = clickedTab.getAttribute('data-section');
        
        // Remove active class from all tabs
        this.tabs.forEach(tab => tab.classList.remove('active'));
        
        // Add active class to clicked tab
        clickedTab.classList.add('active');
        
        // Hide all sections
        this.sections.forEach(section => section.classList.remove('active'));
        
        // Show target section
        const targetSectionElement = document.getElementById(`section-${targetSection}`);
        if (targetSectionElement) {
            targetSectionElement.classList.add('active');
        }
    }
    
    // Method to programmatically switch to a section
    switchToSection(sectionName) {
        const targetTab = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetTab) {
            targetTab.click();
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bazi Calculator
    const calculator = new BaziCalculator();
    
    // Initialize Breadcrumb Navigation
    const breadcrumbNav = new BreadcrumbNavigation();
    
    // Make breadcrumb navigation globally accessible
    window.breadcrumbNav = breadcrumbNav;
    window.baziCalculator = calculator;
    
    // Legacy placeholder functionality
    const calculatorPlaceholder = document.querySelector('.calculator-placeholder');
    if (calculatorPlaceholder) {
        calculatorPlaceholder.addEventListener('click', function() {
            alert('Bazi calculator is now integrated! Please use the form above.');
        });
    }
});

// Mobile menu toggle (for future mobile navigation)
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('mobile-active');
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements for scroll animations
document.querySelectorAll('.feature-card, .step, .why-item, .faq-item').forEach(el => {
    el.classList.add('fade-in-up');
    observer.observe(el);
});
