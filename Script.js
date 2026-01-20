// Menu mobile
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
});

// Ajustement responsive du menu
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navMenu.style.display = 'flex';
    } else {
        navMenu.style.display = 'none';
    }
});

// Smooth scroll pour les ancres
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Animation des statistiques
function animateStats() {
    const stats = document.querySelectorAll('.stat h3');
    stats.forEach(stat => {
        const target = parseInt(stat.textContent);
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = Math.round(current) + (stat.textContent.includes('%') ? '%' : '+');
        }, 30);
    });
}

// Lancer l'animation quand la section est visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.hero');
if (heroSection) {
    observer.observe(heroSection);
}

// Effet de parallaxe
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.terminal-window');
    if (parallax) {
        parallax.style.transform = `translateY(${scrolled * 0.05}px)`;
    }
});

// Simulation de terminal
function updateTerminal() {
    const terminal = document.querySelector('.terminal-body');
    if (terminal) {
        const lines = [
            "$ system status",
            "✅ Bot: <span class='success'>ONLINE</span>",
            "📊 CPU: <span class='info'>" + Math.floor(Math.random() * 20 + 5) + "%</span>",
            "💾 RAM: <span class='info'>" + Math.floor(Math.random() * 500 + 300) + "MB/2GB</span>",
            "🌐 Uptime: <span class='success'>99." + (90 + Math.floor(Math.random() * 10)) + "%</span>",
            "⚡ Latence: <span class='success'>" + Math.floor(Math.random() * 20 + 20) + "ms</span>"
        ];
        
        terminal.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
    }
}

setInterval(updateTerminal, 3000);

// Notification cookie
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookieAccepted')) {
        const cookieBanner = document.createElement('div');
        cookieBanner.className = 'cookie-banner';
        cookieBanner.innerHTML = `
            <p>🍪 Ce site utilise des cookies pour améliorer votre expérience.</p>
            <button class="btn-cookie">Accepter</button>
        `;
        document.body.appendChild(cookieBanner);
        
        document.querySelector('.btn-cookie').addEventListener('click', () => {
            localStorage.setItem('cookieAccepted', 'true');
            cookieBanner.style.display = 'none';
        });
    }
});
