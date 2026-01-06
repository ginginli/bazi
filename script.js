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
        }
        
        // 显示五行分析
        if (data.five_elements && data.five_elements.scores) {
            this.displayFiveElements(data.five_elements.scores);
            
            if (data.five_elements.strength) {
                document.getElementById('chartStrength').textContent = data.five_elements.strength;
            }
        }
        
        // 显示基本信息
        if (data.basic_info) {
            document.getElementById('gregorianDate').textContent = data.basic_info.gregorian_date || '--';
            document.getElementById('lunarDate').textContent = data.basic_info.lunar_date || '--';
        }
        
        // 显示结果容器
        this.resultsContainer.style.display = 'block';
        
        // 滚动到结果区域
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
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