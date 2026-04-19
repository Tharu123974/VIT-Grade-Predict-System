document.addEventListener('DOMContentLoaded', () => {

    // Theme Switch Logic
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            toggleSwitch.checked = true;
        }
    }

    function switchTheme(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
        
        // Dispatch event so charts can re-render if needed
        window.dispatchEvent(new Event('themeChanged'));
    }

    toggleSwitch.addEventListener('change', switchTheme, false);

    // High Contrast Switch Logic
    const contrastSwitch = document.querySelector('#contrast-checkbox');
    const currentContrast = localStorage.getItem('contrast');

    if (currentContrast) {
        document.documentElement.setAttribute('data-contrast', currentContrast);
        if (currentContrast === 'high') {
            contrastSwitch.checked = true;
        }
    }

    function switchContrast(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-contrast', 'high');
            localStorage.setItem('contrast', 'high');
        } else {
            document.documentElement.removeAttribute('data-contrast');
            localStorage.setItem('contrast', 'standard');
        }
        window.dispatchEvent(new Event('themeChanged'));
    }

    if (contrastSwitch) {
        contrastSwitch.addEventListener('change', switchContrast, false);
    }


    // Navigation Logic (SPA Routing)
    const navLinks = document.querySelectorAll('.nav-links a, .nav-btn');
    const views = document.querySelectorAll('.view');

    function navigateTo(targetId) {
        // Hide all views
        views.forEach(view => {
            view.classList.remove('active');
        });

        // Show target view
        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Update active class on nav Links
        document.querySelectorAll('.nav-links a').forEach(link => {
            if (link.dataset.target === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.target;
            if (targetId) {
                navigateTo(targetId);
            }
        });
    });

    // Global Toast Notification System
    window.showToast = function(message, type = 'error') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Trigger reflow for animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    };

});
