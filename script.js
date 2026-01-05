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

// Placeholder for future calculator integration
function initializeCalculator() {
    // This function will be called when the iframe calculator is loaded
    console.log('Bazi calculator ready for iframe integration');
    
    // Example of how to communicate with iframe calculator
    // window.addEventListener('message', function(event) {
    //     if (event.data.type === 'baziCalculatorResult') {
    //         handleCalculatorResult(event.data.result);
    //     }
    // });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCalculator();
    
    // Add loading animation to calculator placeholder
    const calculatorPlaceholder = document.querySelector('.calculator-placeholder');
    if (calculatorPlaceholder) {
        calculatorPlaceholder.addEventListener('click', function() {
            alert('Bazi calculator will be integrated via iframe soon!');
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