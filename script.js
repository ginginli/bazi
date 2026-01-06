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
        }
        
        // 显示五行分析
        if (data.five_elements && data.five_elements.scores) {
            this.displayFiveElements(data.five_elements.scores);
            
            if (data.five_elements.strength) {
                document.getElementById('chartStrength').textContent = data.five_elements.strength;
                
                // 显示强弱平衡状态
                const balance = this.analyzeElementBalance(data.five_elements.scores, data.five_elements.strength);
                document.getElementById('elementBalance').textContent = balance;
            }
        }
        
        // 显示十神分析
        this.displayTenGods(data);
        
        // 显示格局分析
        this.displayPatterns(data);
        
        // 显示神煞
        this.displaySpiritualStars(data);
        
        // 显示基本信息
        if (data.basic_info) {
            document.getElementById('gregorianDate').textContent = data.basic_info.gregorian_date || '--';
            document.getElementById('lunarDate').textContent = data.basic_info.lunar_date || '--';
            
            // 从原始输出中提取更多信息
            this.extractAdditionalInfo(data.raw_output);
        }
        
        // 显示个性分析
        this.displayPersonalityInsights(data);
        
        // 显示生活指导
        this.displayLifeGuidance(data);
        
        // 显示原始输出（调试用）
        if (data.raw_output) {
            document.getElementById('rawOutput').textContent = data.raw_output;
        }
        
        // 显示结果容器
        this.resultsContainer.style.display = 'block';
        
        // 滚动到结果区域
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
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
        
        // 从原始输出中提取十神信息
        const tenGods = this.extractTenGods(data.raw_output);
        
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
    
    displayFiveElements(scores) {
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
            const elementBar = document.createElement('div');
            elementBar.className = 'element-bar';
            elementBar.style.borderLeftColor = element.color;
            elementBar.innerHTML = `
                <div class="element-name">${element.name}</div>
                <div class="element-score">${score}</div>
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

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bazi Calculator
    const calculator = new BaziCalculator();
    
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