// Shared Page Translation Utility
// Used by registration modal, register.html, cv.html, apply.html, translate.html
class PageI18n {
    constructor() {
        this.languages = null;
        this.currentLang = localStorage.getItem('preferredLanguage') || 'de';
    }

    async load() {
        try {
            const response = await fetch('/js/languages.json');
            if (!response.ok) throw new Error('Failed to load languages.json');
            this.languages = await response.json();
            return true;
        } catch (error) {
            console.error('Error loading translations:', error);
            return false;
        }
    }

    get(key) {
        if (!this.languages || !this.languages[this.currentLang]) return null;
        const translations = this.languages[this.currentLang].translations;
        if (!translations) return null;
        return key.split('.').reduce((obj, k) => obj && obj[k], translations);
    }

    setLang(lang) {
        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        
        // Update RTL
        const dir = this.languages[lang]?.dir || 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', lang);
        if (dir === 'rtl') {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }
    }

    translatePage() {
        // Translate all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = this.get(key);
            if (val) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = val;
                } else if (el.tagName === 'OPTION') {
                    el.textContent = val;
                } else {
                    el.textContent = val;
                }
            }
        });

        // Translate data-i18n-html elements (preserves HTML like links)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            const val = this.get(key);
            if (val) {
                el.innerHTML = val;
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const val = this.get(key);
            if (val) el.placeholder = val;
        });

        // Update language switcher active state
        document.querySelectorAll('.mini-lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === this.currentLang);
        });
    }

    createMiniSwitcher(container) {
        const langs = [
            { code: 'de', flag: '🇩🇪', name: 'DE' },
            { code: 'en', flag: '🇬🇧', name: 'EN' },
            { code: 'fr', flag: '🇫🇷', name: 'FR' },
            { code: 'ar', flag: '🇲🇦', name: 'عر' }
        ];

        const switcher = document.createElement('div');
        switcher.className = 'mini-lang-switcher';
        switcher.innerHTML = langs.map(l => `
            <button class="mini-lang-option ${l.code === this.currentLang ? 'active' : ''}" data-lang="${l.code}" title="${l.name}">
                <span class="mini-lang-flag">${l.flag}</span>
                <span class="mini-lang-code">${l.name}</span>
            </button>
        `).join('');

        switcher.querySelectorAll('.mini-lang-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setLang(btn.dataset.lang);
                this.translatePage();
            });
        });

        container.prepend(switcher);
    }
}

// Styles for mini language switcher
const miniLangStyles = document.createElement('style');
miniLangStyles.textContent = `
.mini-lang-switcher {
    display: flex;
    gap: 6px;
    justify-content: center;
    margin-bottom: 15px;
    flex-wrap: wrap;
}
.mini-lang-option {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border: 2px solid #e0e0e0;
    border-radius: 20px;
    background: white;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    color: #555;
}
.mini-lang-option:hover {
    border-color: #DC143C;
    background: #fff5f5;
}
.mini-lang-option.active {
    border-color: #DC143C;
    background: linear-gradient(135deg, #DC143C, #8B0000);
    color: white;
}
.mini-lang-flag {
    font-size: 14px;
}
.mini-lang-code {
    font-size: 11px;
    text-transform: uppercase;
}
`;
document.head.appendChild(miniLangStyles);

// Global instance
window.pageI18n = new PageI18n();
