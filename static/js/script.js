// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    const topicForm = document.getElementById('topic-form');
    
    // Form submission handler
    topicForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const topic = document.getElementById('topic').value.trim();
        const proficiency = document.getElementById('proficiency').value;
        
        // Validate form
        if (!topic || !proficiency) {
            alert('Please fill in all fields');
            return;
        }
        
        // Store the data in sessionStorage for access on the next page
        sessionStorage.setItem('topic', topic);
        sessionStorage.setItem('proficiency', proficiency);
        sessionStorage.setItem('hf_token', 'ENTER_API_KEY')

        document.body.classList.add('fade-out');
        
        // Redirect to the chat page
        setTimeout(() => {
            window.location.href = '/chat/';
        }, 300);
    });

    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            
            if (targetId.startsWith('#')) {
                e.preventDefault();
                
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Add animation for form elements
    const formElements = document.querySelectorAll('.form-group, .start-btn');
    
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = `opacity 0.5s ease, transform 0.5s ease`;
        element.style.transitionDelay = `${index * 0.1}s`;
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100);
    });
    
    // Add animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Create intersection observer for feature cards
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                featureObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    // Observe each feature card
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease, transform 0.5s ease`;
        card.style.transitionDelay = `${index * 0.1}s`;
        
        featureObserver.observe(card);
    });
    
    // Add the animation class when feature cards come into view
    document.addEventListener('scroll', () => {
        featureCards.forEach((card) => {
            const cardPosition = card.getBoundingClientRect();
            
            if (cardPosition.top < window.innerHeight * 0.8) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    });
    
    // Add fade-in animation for the page
    document.body.classList.add('fade-in');
});

// Add these styles for the transitions
const style = document.createElement('style');
style.textContent = `
    body {
        transition: opacity 0.3s ease;
    }
    
    body.fade-in {
        animation: fadeIn 0.5s ease forwards;
    }
    
    body.fade-out {
        opacity: 0;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);