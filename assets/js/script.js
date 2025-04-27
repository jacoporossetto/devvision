/**
 * DevVision - Main JavaScript
 * 
 * Core dell'architettura interattiva che orchestra tutte le 
 * funzionalità UI/UX creando un'esperienza digitale coesa 
 * dove ogni interazione è progettata con precisione millimetrica.
 * 
 * @version 2.0.0
 * @author DevVision Studio
 */

// Modalità strict per prevenire errori comuni
'use strict';

// Utility globale per esecuzione sicura di funzioni
window.safeExecute = function(fn, fallback = () => {}, ...args) {
    try {
        if (fn) return fn(...args);
    } catch (error) {
        console.warn(`Errore nell'esecuzione: ${error.message}`);
        return fallback(...args);
    }
};

// Configurazione globale dell'applicazione
const CONFIG = {
    // Soglie e tempistiche di interazione
    scrollThreshold: 40,              // Soglia di scroll per attivare header sticky
    scrollAnimationSpeed: 800,        // Durata animazione scroll smooth (ms)
    preloaderMinDuration: 1200,       // Durata minima visualizzazione preloader (ms)
    preloaderMaxDuration: 3200,       // Timeout massimo per preloader (ms)
    counterAnimationDuration: 2000,   // Durata animazione contatori (ms)
    testimonialRotationTime: 5000,    // Intervallo rotazione automatica testimonial (ms)
    debounceDelay: 100,               // Ritardo per funzioni debounced (ms)
    mobileBreakpoint: 768,            // Breakpoint per layout mobile (px)
    
    // Stati dell'applicazione
    isMenuOpen: false,                // Stato menu mobile
    isModalOpen: false,               // Stato modal portfolio
    
    // Feature detection
    supportsIntersectionObserver: 'IntersectionObserver' in window,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
};

// Utility di ottimizzazione performance
const Utils = {
    // Debounce: limita frequenza chiamate a funzione
    debounce(func, wait = CONFIG.debounceDelay) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle: garantisce esecuzione al massimo ogni X ms
    throttle(func, limit = 16) { // 16ms = ~60fps
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                window.requestAnimationFrame(() => {
                    inThrottle = false;
                });
            }
        };
    },
    
    // Verifica se un elemento è visibile nel viewport
    isInViewport(element, offset = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
            rect.bottom >= 0 + offset &&
            rect.left <= (window.innerWidth || document.documentElement.clientWidth) - offset &&
            rect.right >= 0 + offset
        );
    },
    
    // Aggiunge classe con animazione 
    animateClass(element, className, duration = 300) {
        if (!element) return;
        
        element.classList.add(className);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(element);
            }, duration);
        });
    },
    
    // Transizione di elementi con fade
    fadeIn(element, duration = 300) {
        if (!element) return Promise.reject('Elemento non valido');
        
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            setTimeout(() => {
                element.style.transition = `opacity ${duration}ms ease`;
                element.style.opacity = '1';
                
                setTimeout(() => {
                    element.style.transition = '';
                    resolve(element);
                }, duration);
            }, 10);
        });
    },
    
    fadeOut(element, duration = 300) {
        if (!element) return Promise.reject('Elemento non valido');
        
        return new Promise(resolve => {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.style.display = 'none';
                element.style.transition = '';
                resolve(element);
            }, duration);
        });
    },
    
    // Calcola offset di un elemento rispetto al documento
    getOffset(element) {
        const rect = element.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        return {
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft,
            width: rect.width,
            height: rect.height
        };
    }
};

// Cache elementi DOM (miglioramento performance)
const DOM = {
    // Elementi principali
    body: document.body,
    header: document.querySelector('.site-header'),
    menuToggle: document.querySelector('.menu-toggle'),
    navList: document.querySelector('.nav-list'),
    navLinks: document.querySelectorAll('.nav-link'),
    backToTopBtn: document.getElementById('backToTop'),
    preloader: document.querySelector('.preloader'),
    yearEl: document.getElementById('currentYear'),
    
    // Sezioni e componenti
    sections: document.querySelectorAll('section[id]'),
    faqItems: document.querySelectorAll('.faq-item'),
    skillBars: document.querySelectorAll('.skill-progress'),
    counterElements: document.querySelectorAll('.counter-number'),
    contactForm: document.getElementById('contactForm'),
    
    // Testimonial carousel
    testimonialSlides: document.querySelectorAll('.testimonial-slide'),
    testimonialIndicators: document.querySelectorAll('.indicator'),
    testimonialPrev: document.querySelector('.control-prev'),
    testimonialNext: document.querySelector('.control-next'),
    
    // Portfolio
    portfolioItems: document.querySelectorAll('.portfolio-item'),
    portfolioFilters: document.querySelectorAll('.filter-btn'),
    portfolioModal: document.querySelector('.portfolio-modal'),
    modalContent: document.querySelector('.modal-content'),
    modalClose: document.querySelector('.modal-close'),
    
    // Configuratore
    configuratorSteps: document.querySelectorAll('.step'),
    
    // Cursore personalizzato
    cursor: {
        dot: document.querySelector('.cursor-dot'),
        outline: document.querySelector('.cursor-dot-outline')
    }
};

// Gestore preloader e inizializzazione
const PreloaderManager = {
    startTime: performance.now(),
    preloaderRemoved: false,
    
    init() {
        if (!DOM.preloader) return;
        
        // Configura il contatore del preloader se presente
        const counterElement = DOM.preloader.querySelector('.loader-text');
        if (counterElement) {
            let counter = 0;
            const interval = setInterval(() => {
                counter += 1;
                if (counter <= 100) {
                    counterElement.textContent = `${counter}%`;
                } else {
                    clearInterval(interval);
                }
            }, 15);
        }
        
        // Aggiungi fallback di sicurezza
        setTimeout(() => this.forceRemovePreloader(), CONFIG.preloaderMaxDuration);
        
        // Ascolta evento load per rimuovere il preloader
        window.addEventListener('load', () => this.removePreloader());
    },
    
    removePreloader() {
        if (this.preloaderRemoved) return;
        
        const currentTime = performance.now();
        const elapsedTime = currentTime - this.startTime;
        const remainingTime = Math.max(0, CONFIG.preloaderMinDuration - elapsedTime);
        
        // Rispetta la durata minima del preloader per evitare flash
        setTimeout(() => {
            if (DOM.preloader) {
                DOM.preloader.style.opacity = '0';
                
                setTimeout(() => {
                    DOM.preloader.style.display = 'none';
                    DOM.body.classList.add('content-loaded');
                    this.preloaderRemoved = true;
                    
                    // Esegui animazioni post-caricamento
                    this.runPostLoadAnimations();
                }, 300);
            }
        }, remainingTime);
    },
    
    forceRemovePreloader() {
        if (!this.preloaderRemoved && DOM.preloader) {
            console.warn('Forced preloader removal after timeout');
            DOM.preloader.style.opacity = '0';
            DOM.preloader.style.display = 'none';
            DOM.body.classList.add('content-loaded');
            this.preloaderRemoved = true;
            
            // Esegui animazioni post-caricamento
            this.runPostLoadAnimations();
        }
    },
    
    runPostLoadAnimations() {
        // Avvia le animazioni che richiedono DOM completamente caricato
        safeExecute(() => {
            initSkillBars();
            initCounters();
            
            // Trigger evento personalizzato per altri moduli
            const event = new CustomEvent('devvision:contentLoaded');
            document.dispatchEvent(event);
        });
    }
};

// Gestore header e menu di navigazione
const HeaderManager = {
    lastScrollTop: 0,
    scrollDelta: 5,
    isHeaderSticky: false,
    
    init() {
        if (!DOM.header) return;
        
        // Listener per eventi e comportamenti dell'header
        window.addEventListener('scroll', Utils.throttle(this.handleScroll.bind(this), 10));
        
        // Inizializza comportamento menu mobile
        this.initMobileMenu();
        
        // Inizializza evidenziazione link di navigazione
        this.highlightNavLink();
    },
    
    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Gestisci header sticky
        if (scrollTop > CONFIG.scrollThreshold) {
            if (!this.isHeaderSticky) {
                DOM.header.classList.add('scrolled');
                this.isHeaderSticky = true;
            }
        } else {
            if (this.isHeaderSticky) {
                DOM.header.classList.remove('scrolled');
                this.isHeaderSticky = false;
            }
        }
        
        // Gestisci pulsante back-to-top
        if (DOM.backToTopBtn) {
            if (scrollTop > window.innerHeight * 0.5) {
                DOM.backToTopBtn.classList.add('visible');
            } else {
                DOM.backToTopBtn.classList.remove('visible');
            }
        }
        
        // Evidenzia link di navigazione in base alla sezione visibile
        this.highlightNavLink();
        
        this.lastScrollTop = scrollTop;
    },
    
    initMobileMenu() {
        if (!DOM.menuToggle || !DOM.navList) return;
        
        // Toggle menu mobile
        DOM.menuToggle.addEventListener('click', () => {
            CONFIG.isMenuOpen = !CONFIG.isMenuOpen;
            DOM.body.classList.toggle('menu-open', CONFIG.isMenuOpen);
            
            // Gestisci accessibilità
            DOM.menuToggle.setAttribute('aria-expanded', CONFIG.isMenuOpen ? 'true' : 'false');
            
            // Gestisci focus per accessibilità keyboard
            if (CONFIG.isMenuOpen) {
                DOM.navLinks[0].focus();
            }
        });
        
        // Chiudi menu al click su link
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                DOM.body.classList.remove('menu-open');
                CONFIG.isMenuOpen = false;
                DOM.menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Chiudi menu cliccando fuori
        document.addEventListener('click', (e) => {
            if (
                CONFIG.isMenuOpen && 
                !DOM.navList.contains(e.target) && 
                !DOM.menuToggle.contains(e.target)
            ) {
                DOM.body.classList.remove('menu-open');
                CONFIG.isMenuOpen = false;
                DOM.menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Gestione tasto Escape per chiudere menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && CONFIG.isMenuOpen) {
                DOM.body.classList.remove('menu-open');
                CONFIG.isMenuOpen = false;
                DOM.menuToggle.setAttribute('aria-expanded', 'false');
                DOM.menuToggle.focus();
            }
        });
    },
    
    highlightNavLink() {
        if (!DOM.sections.length || !DOM.navLinks.length) return;
        
        const scrollPosition = window.scrollY + 100;
        let activeSection = null;
        
        // Trova la sezione corrente
        DOM.sections.forEach(section => {
            const sectionTop = Utils.getOffset(section).top;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                activeSection = section.getAttribute('id');
            }
        });
        
        // Rimuovi classe active da tutti i link
        DOM.navLinks.forEach(link => {
            link.classList.remove('active');
            
            // Se trovi il link corrispondente alla sezione attiva, aggiungilo
            const href = link.getAttribute('href');
            if (href && href === `#${activeSection}`) {
                link.classList.add('active');
            }
        });
    }
};

// Gestore del pulsante Torna in cima
const BackToTopManager = {
    init() {
        if (!DOM.backToTopBtn) return;
        
        DOM.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Gestione accessibilità da tastiera
        DOM.backToTopBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    }
};

// Inizializzazione barre delle competenze
function initSkillBars() {
    safeExecute(() => {
        if (!DOM.skillBars || DOM.skillBars.length === 0) return;
        
        const animateSkill = (bar) => {
            const level = bar.getAttribute('data-level');
            if (!level) return;
            
            // Reset width
            bar.style.width = '0';
            
            // Timeout minimo per garantire reset visibile
            setTimeout(() => {
                bar.style.width = level;
                bar.classList.add('animated');
            }, 50);
        };
        
        if (CONFIG.supportsIntersectionObserver) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateSkill(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });
            
            DOM.skillBars.forEach(bar => observer.observe(bar));
        } else {
            // Fallback senza IntersectionObserver
            DOM.skillBars.forEach((bar, index) => {
                setTimeout(() => animateSkill(bar), 100 * index);
            });
        }
    });
}

// Inizializzazione contatori
function initCounters() {
    safeExecute(() => {
        if (!DOM.counterElements || DOM.counterElements.length === 0) return;
        
        const animateCounter = (counter, target, duration = CONFIG.counterAnimationDuration) => {
            // Reset
            counter.textContent = '0';
            counter.classList.remove('completed');
            
            const formatter = new Intl.NumberFormat('it-IT');
            let startTime = null;
            
            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                
                // Usa easeOutExpo per accelerazione naturale
                const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                
                const currentValue = Math.floor(easeProgress * target);
                counter.textContent = formatter.format(currentValue);
                
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    counter.textContent = formatter.format(target);
                    counter.classList.add('completed');
                }
            };
            
            requestAnimationFrame(step);
        };
        
        if (CONFIG.supportsIntersectionObserver) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = parseInt(entry.target.getAttribute('data-count'), 10);
                        if (!isNaN(target)) {
                            // Calcola durata proporzionale alla grandezza del numero
                            const duration = Math.min(1500 + (target / 100), 3000);
                            
                            // Aggiungi ritardo staggered per counter multipli nella stessa area
                            const index = Array.from(DOM.counterElements).indexOf(entry.target);
                            setTimeout(() => {
                                animateCounter(entry.target, target, duration);
                            }, index * 150);
                        }
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            DOM.counterElements.forEach(counter => observer.observe(counter));
        } else {
            // Fallback senza IntersectionObserver
            DOM.counterElements.forEach((counter, index) => {
                const target = parseInt(counter.getAttribute('data-count'), 10);
                if (!isNaN(target)) {
                    const duration = Math.min(1500 + (target / 100), 3000);
                    setTimeout(() => {
                        animateCounter(counter, target, duration);
                    }, 500 + (index * 150));
                }
            });
        }
    });
}

// Gestore testimonianze/carousel
const TestimonialManager = {
    currentIndex: 0,
    totalSlides: 0,
    autoplayInterval: null,
    isAnimating: false,
    touchStartX: 0,
    touchEndX: 0,
    
    init() {
        if (!DOM.testimonialSlides.length) return;
        
        this.totalSlides = DOM.testimonialSlides.length;
        
        // Event listeners
        if (DOM.testimonialPrev) {
            DOM.testimonialPrev.addEventListener('click', () => this.prevSlide());
        }
        
        if (DOM.testimonialNext) {
            DOM.testimonialNext.addEventListener('click', () => this.nextSlide());
        }
        
        // Indicatori
        if (DOM.testimonialIndicators.length) {
            DOM.testimonialIndicators.forEach((indicator, index) => {
                indicator.addEventListener('click', () => this.goToSlide(index));
            });
        }
        
        // Supporto swipe per touch device
        if (CONFIG.isTouchDevice) {
            const carousel = DOM.testimonialSlides[0].parentNode;
            
            carousel.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            carousel.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            }, { passive: true });
        }
        
        // Gestione accessibilità da tastiera
        [DOM.testimonialPrev, DOM.testimonialNext].forEach(control => {
            if (control) {
                control.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        control.click();
                    }
                });
            }
        });
        
        DOM.testimonialIndicators.forEach(indicator => {
            indicator.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    indicator.click();
                }
            });
        });
        
        // Gestione visibilità pagina (pausa rotazione se pagina non visibile)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoplay();
            } else {
                this.startAutoplay();
            }
        });
        
        // Avvia rotazione automatica
        this.startAutoplay();
    },
    
    goToSlide(index) {
        if (this.isAnimating || index === this.currentIndex) return;
        this.isAnimating = true;
        
        // Calcola direzione per animazione
        const direction = index > this.currentIndex ? 'next' : 'prev';
        
        // Slide corrente
        const currentSlide = DOM.testimonialSlides[this.currentIndex];
        // Prossima slide
        const nextSlide = DOM.testimonialSlides[index];
        
        // Prepara animazione
        if (direction === 'next') {
            nextSlide.style.transform = 'translateX(100%)';
        } else {
            nextSlide.style.transform = 'translateX(-100%)';
        }
        
        // Mostra entrambe le slide per l'animazione
        currentSlide.style.display = 'block';
        nextSlide.style.display = 'block';
        
        // Forza reflow per garantire che i cambiamenti vengano applicati
        nextSlide.offsetWidth;
        
        // Imposta transizioni
        currentSlide.style.transition = 'transform 0.6s ease-in-out';
        nextSlide.style.transition = 'transform 0.6s ease-in-out';
        
        // Anima lo slide
        if (direction === 'next') {
            currentSlide.style.transform = 'translateX(-100%)';
            nextSlide.style.transform = 'translateX(0)';
        } else {
            currentSlide.style.transform = 'translateX(100%)';
            nextSlide.style.transform = 'translateX(0)';
        }
        
        // Pulisci dopo l'animazione
        setTimeout(() => {
            currentSlide.style.display = '';
            currentSlide.style.transform = '';
            currentSlide.style.transition = '';
            currentSlide.classList.remove('active');
            
            nextSlide.style.transition = '';
            nextSlide.classList.add('active');
            
            // Aggiorna indicatori
            this.updateIndicators(index);
            
            // Aggiorna indice corrente
            this.currentIndex = index;
            
            // Sblocca animazione
            this.isAnimating = false;
            
            // Resetta intervallo autoplay
            this.restartAutoplay();
        }, 600);
    },
    
    nextSlide() {
        const newIndex = (this.currentIndex + 1) % this.totalSlides;
        this.goToSlide(newIndex);
    },
    
    prevSlide() {
        const newIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(newIndex);
    },
    
    updateIndicators(index) {
        DOM.testimonialIndicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
            indicator.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
    },
    
    startAutoplay() {
        this.stopAutoplay(); // Cancella eventuale intervallo esistente
        this.autoplayInterval = setInterval(() => {
            this.nextSlide();
        }, CONFIG.testimonialRotationTime);
    },
    
    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    },
    
    restartAutoplay() {
        this.stopAutoplay();
        this.startAutoplay();
    },
    
    handleSwipe() {
        const swipeThreshold = 50; // Soglia minima per considerare il gesto uno swipe
        const swipeDistance = this.touchEndX - this.touchStartX;
        
        if (swipeDistance > swipeThreshold) {
            // Swipe verso destra -> slide precedente
            this.prevSlide();
        } else if (swipeDistance < -swipeThreshold) {
            // Swipe verso sinistra -> slide successiva
            this.nextSlide();
        }
    }
};

// Gestore FAQ Accordion
const FAQManager = {
    init() {
        if (!DOM.faqItems.length) return;
        
        DOM.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            if (!question || !answer) return;
            
            // Accessibilità: aria attributes
            question.setAttribute('aria-expanded', 'false');
            answer.setAttribute('aria-hidden', 'true');
            
            question.addEventListener('click', () => {
                this.toggleItem(item);
            });
            
            // Accessibilità: supporto tastiera
            question.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleItem(item);
                }
                
                // Aggiunta navigazione con tasti freccia per accessibilità
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    
                    const faqItems = Array.from(DOM.faqItems);
                    const currentIndex = faqItems.indexOf(item);
                    let newIndex;
                    
                    if (e.key === 'ArrowDown') {
                        newIndex = (currentIndex + 1) % faqItems.length;
                    } else {
                        newIndex = (currentIndex - 1 + faqItems.length) % faqItems.length;
                    }
                    
                    const nextQuestion = faqItems[newIndex].querySelector('.faq-question');
                    if (nextQuestion) nextQuestion.focus();
                }
            });
        });
    },
    
    toggleItem(item) {
        const isActive = item.classList.contains('active');
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        // Chiudi tutti gli items aperti
        DOM.faqItems.forEach(faqItem => {
            if (faqItem !== item) {
                faqItem.classList.remove('active');
                
                const q = faqItem.querySelector('.faq-question');
                const a = faqItem.querySelector('.faq-answer');
                
                if (q && a) {
                    q.setAttribute('aria-expanded', 'false');
                    a.setAttribute('aria-hidden', 'true');
                }
            }
        });
        
        // Toggle elemento corrente
        item.classList.toggle('active', !isActive);
        
        if (question && answer) {
            question.setAttribute('aria-expanded', !isActive ? 'true' : 'false');
            answer.setAttribute('aria-hidden', !isActive ? 'false' : 'true');
            
            // Scroll automatico per mobile se necessario
            if (!isActive && window.innerWidth <= CONFIG.mobileBreakpoint) {
                setTimeout(() => {
                    const offset = Utils.getOffset(answer);
                    window.scrollTo({
                        top: offset.top - 20,
                        behavior: 'smooth'
                    });
                }, 300);
            }
        }
    }
};

// Gestore Portfolio
const PortfolioManager = {
    filterAnimationInProgress: false,
    
    init() {
        if (!DOM.portfolioItems.length) return;
        
        // Inizializza filtri portfolio
        this.initFilters();
        
        // Inizializza modal portfolio
        this.initModal();
    },
    
    initFilters() {
        if (!DOM.portfolioFilters.length) return;
        
        DOM.portfolioFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                // Previene click multipli durante animazioni
                if (this.filterAnimationInProgress) return;
                this.filterAnimationInProgress = true;
                
                // Cambia stato attivo del pulsante filtro
                DOM.portfolioFilters.forEach(filterBtn => {
                    filterBtn.classList.remove('active');
                });
                
                btn.classList.add('active');
                
                // Filtra gli elementi
                const filter = btn.getAttribute('data-filter');
                this.filterItems(filter);
            });
            
            // Accessibilità: supporto tastiera
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
    },
    
    filterItems(filter) {
        if (!DOM.portfolioItems.length) return;
        
        // Tieni traccia delle animazioni completate
        let itemsToAnimate = DOM.portfolioItems.length;
        let itemsAnimated = 0;
        
        // Proprietà di animazione
        const baseDuration = 300;
        const staggerDelay = 50;
        
        DOM.portfolioItems.forEach((item, index) => {
            const itemCategory = item.getAttribute('data-category');
            const shouldShow = filter === 'all' || itemCategory === filter;
            
            // Calcola delay staggered in base all'indice
            const delay = index * staggerDelay;
            
            // Anima uscita se elemento non corrisponde al filtro
            if (!shouldShow) {
                setTimeout(() => {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    
                    setTimeout(() => {
                        item.style.display = 'none';
                        
                        // Incrementa contatore e controlla se tutte le animazioni sono complete
                        itemsAnimated++;
                        if (itemsAnimated >= itemsToAnimate) {
                            this.filterAnimationInProgress = false;
                        }
                    }, baseDuration);
                }, delay);
            } else {
                // Anima entrata per elementi corrispondenti
                setTimeout(() => {
                    item.style.display = 'block';
                    
                    // Forza reflow per garantire che il display:block sia applicato
                    item.offsetHeight;
                    
                    item.style.opacity = '1';
                    item.style.transform = 'scale(1)';
                    
                    // Incrementa contatore e controlla se tutte le animazioni sono complete
                    setTimeout(() => {
                        itemsAnimated++;
                        if (itemsAnimated >= itemsToAnimate) {
                            this.filterAnimationInProgress = false;
                        }
                    }, baseDuration);
                }, delay + (filter !== 'all' ? 150 : 0)); // Ritardo aggiuntivo per filtri specifici
            }
        });
    },
    
    initModal() {
        const modalLinks = document.querySelectorAll('.item-link');
        if (!modalLinks.length || !DOM.portfolioModal || !DOM.modalContent || !DOM.modalClose) return;
        
        // Apri modal al click
        modalLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal(link);
            });
            
            // Accessibilità: supporto tastiera
            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openModal(link);
                }
            });
        });
        
        // Chiudi modal con pulsante di chiusura
        DOM.modalClose.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Chiudi modal cliccando fuori
        DOM.portfolioModal.addEventListener('click', (e) => {
            if (e.target === DOM.portfolioModal) {
                this.closeModal();
            }
        });
        
        // Chiudi modal con tasto ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && CONFIG.isModalOpen) {
                this.closeModal();
            }
        });
    },
    
    openModal(link) {
        if (!DOM.portfolioModal || !DOM.modalContent) return;
        
        // Ottieni ID progetto
        const projectId = link.getAttribute('data-project');
        if (!projectId) return;
        
        // Simula caricamento dati progetto
        DOM.modalContent.innerHTML = `
            <div class="modal-loading">
                <div class="spinner"></div>
                <p>Caricamento progetto...</p>
            </div>
        `;
        
        // Mostra il modal con animazione
        DOM.portfolioModal.style.display = 'flex';
        setTimeout(() => {
            DOM.portfolioModal.style.opacity = '1';
            
            // Anima container modal in entrata
            const modalContainer = DOM.portfolioModal.querySelector('.modal-container');
            if (modalContainer) {
                modalContainer.style.transform = 'translateY(0)';
            }
        }, 10);
        
        CONFIG.isModalOpen = true;
        
        // Simula caricamento dei dati (in un'app reale questo sarebbe un fetch)
        setTimeout(() => {
            this.loadProjectContent(projectId);
        }, 800);
        
        // Blocca lo scroll del body mentre il modal è aperto
        document.body.style.overflow = 'hidden';
        
        // Accessibilità: focus su chiusura modal
        setTimeout(() => {
            DOM.modalClose.focus();
        }, 100);
    },
    
    closeModal() {
        if (!DOM.portfolioModal) return;
        
        // Anima uscita modal
        DOM.portfolioModal.style.opacity = '0';
        
        // Anima container modal in uscita
        const modalContainer = DOM.portfolioModal.querySelector('.modal-container');
        if (modalContainer) {
            modalContainer.style.transform = 'translateY(20px)';
        }
        
        setTimeout(() => {
            DOM.portfolioModal.style.display = 'none';
            CONFIG.isModalOpen = false;
            
            // Riabilita lo scroll del body
            document.body.style.overflow = '';
        }, 300);
    },
    
    loadProjectContent(projectId) {
        // Qui simuliamo il caricamento dinamico del contenuto del progetto
        // In un'app reale, questo potrebbe essere un fetch da un'API
        
        const projectsData = {
            'project-1': {
                title: 'NordicEssence',
                category: 'E-commerce Premium',
                image: 'assets/img/portfolio/portfolio-large-1.jpg',
                client: 'EcoNordic',
                date: '2023',
                description: 'Piattaforma e-commerce per prodotti di design scandinavo, caratterizzata da un\'interfaccia minimalista che enfatizza il prodotto e semplifica il percorso d\'acquisto. L\'architettura visiva privilegia lo spazio negativo e la tipografia per creare un\'esperienza raffinata che riflette l\'estetica dei prodotti venduti.',
                challenge: 'La sfida principale è stata creare un equilibrio perfetto tra minimalismo estetico e ricchezza funzionale, implementando avanzate capacità di filtraggio e visualizzazione prodotto senza compromettere la pulizia visiva. Il secondo obiettivo era ottimizzare i tempi di caricamento pur mantenendo immagini di alta qualità.',
                solution: 'Abbiamo implementato un\'architettura modulare con caricamento progressivo delle immagini e filtri contestuali che appaiono solo quando necessari. L\'esperienza prodotto è stata arricchita con visualizzazioni 3D leggere e microinterazioni sottili che guidano l\'utente senza distrarlo. L\'intero frontend è stato ottimizzato con tecniche di code splitting e lazy loading.',
                technologies: ['React', 'Node.js', 'MongoDB', 'AWS', 'Stripe API']
            },
            'project-2': {
                title: 'FinovaGroup',
                category: 'Corporate Identity',
                image: 'assets/img/portfolio/portfolio-large-2.jpg',
                client: 'Finova Financial Services',
                date: '2022',
                description: 'Redesign completo dell\'identità digitale per un gruppo finanziario storico che necessitava di modernizzare la propria immagine mantenendo valori di solidità e affidabilità. Il design equilibra autorevolezza e accessibilità attraverso una palette cromatica sofisticata e una navigazione stratificata che guida diversi segmenti di utenza.',
                challenge: 'Bilanciare tradizione e innovazione per un target eterogeneo, dai clienti storici abituati all\'interfaccia precedente ai potenziali nuovi clienti più giovani e digitalmente esigenti. Il sito doveva inoltre integrare strumenti finanziari complessi mantenendo semplicità d\'uso.',
                solution: 'Abbiamo creato un sistema di design modulare che unisce elementi visivi tradizionali e contemporanei, con percorsi utente personalizzati in base al segmento. Gli strumenti finanziari sono stati riprogettati con un\'interfaccia semplificata supportata da microinterazioni intuitive e tooltip contestuali.',
                technologies: ['HTML5', 'SASS', 'JavaScript', 'Greensock', 'PHP']
            },
            'project-3': {
                title: 'ArtisanVision',
                category: 'Portfolio Creativo',
                image: 'assets/img/portfolio/portfolio-large-3.jpg',
                client: 'Studio Berti Architecture',
                date: '2023',
                description: `Portfolio visivo per uno studio di architettura d'interni che trasforma i loro progetti in esperienze digitali immersive. L'interfaccia utilizza un layout asimmetrico dinamico che si adatta ai contenuti, creando un percorso visivo unico per ogni visitatore.`,
                challenge: `Creare un'esperienza digitale che catturasse l'essenza dei progetti architettonici fisici, trasmettendo sensazioni spaziali e dettagli materici attraverso uno schermo piatto. Il portfolio doveva inoltre funzionare perfettamente su dispositivi di ogni dimensione mantenendo l'impatto visivo.`,
                solution: `Abbiamo implementato un sistema di visualizzazione con parallasse progressivo che crea una sensazione di profondità, combinato con zoom contestuali che rivelano dettagli dei materiali. Il layout utilizza una griglia fluida che ridispone dinamicamente gli elementi mantenendo relazioni proporzionali su qualsiasi dispositivo.`,
                technologies: ['React', 'GSAP', 'CSS Modules', 'WebGL', 'Contentful']
            },
            'project-4': {
                title: 'QuantumLaunch',
                category: 'Landing Page',
                image: 'assets/img/portfolio/portfolio-large-4.jpg',
                client: 'QuantumTech Innovations',
                date: '2023',
                description: `Landing page ad alto tasso di conversione per il lancio di un prodotto tecnologico innovativo. La struttura narrativa guida il visitatore attraverso un percorso emotivo calibrato, culminando in una call-to-action irresistibile.`,
                challenge: `Comunicare un concetto tecnologico complesso in modo immediato e coinvolgente, mantenendo l'attenzione dell'utente lungo tutto il percorso di conversione. La pagina doveva inoltre caricarsi estremamente velocemente per minimizzare l'abbandono.`,
                solution: `Abbiamo progettato una struttura narrativa visiva che scompone il concetto complesso in elementi comprensibili, utilizzando animazioni contestuali che appaiono durante lo scroll per mantenere l'engagement. L'intera pagina è stata ottimizzata per caricarsi in meno di 2 secondi anche su connessioni mobili.`,
                technologies: ['HTML5', 'CSS3', 'JavaScript', 'Lottie', 'AWS CloudFront']
            }
        };
        
        // Recupera i dati del progetto
        const projectData = projectsData[projectId] || {
            title: 'Progetto',
            category: 'Categoria',
            image: 'assets/img/portfolio/portfolio-1.jpg',
            client: 'Cliente',
            date: '2023',
            description: 'Descrizione del progetto non disponibile.',
            challenge: 'Informazioni non disponibili.',
            solution: 'Informazioni non disponibili.',
            technologies: ['HTML', 'CSS', 'JavaScript']
        };
        
        // Crea contenuto HTML
        const content = `
            <h2>${projectData.title}</h2>
            <div class="project-gallery">
                <img src="${projectData.image}" alt="${projectData.title}" class="project-image-large">
            </div>
            <div class="project-details">
                <div class="project-meta">
                    <div class="meta-item">
                        <span class="meta-label">Cliente:</span>
                        <span class="meta-value">${projectData.client}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Categoria:</span>
                        <span class="meta-value">${projectData.category}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Anno:</span>
                        <span class="meta-value">${projectData.date}</span>
                    </div>
                </div>
                
                <h3>Il Progetto</h3>
                <p>${projectData.description}</p>
                
                <h3>La Sfida</h3>
                <p>${projectData.challenge}</p>
                
                <h3>La Soluzione</h3>
                <p>${projectData.solution}</p>
                
                <h3>Tecnologie Utilizzate</h3>
                <ul class="tech-list">
                    ${projectData.technologies.map(tech => `<li>${tech}</li>`).join('')}
                </ul>
                
                <div class="project-cta">
                    <a href="#" class="btn btn-primary">Visita il Sito</a>
                    <a href="#contatti" class="btn btn-secondary">Richiedi un Progetto Simile</a>
                </div>
            </div>
        `;
        
        // Inseriamo il contenuto nel modal con animazione
        DOM.modalContent.style.opacity = '0';
        
        setTimeout(() => {
            DOM.modalContent.innerHTML = content;
            
            setTimeout(() => {
                DOM.modalContent.style.opacity = '1';
                
                // Triggera animazioni degli elementi interni
                const elements = DOM.modalContent.querySelectorAll('h2, h3, p, .project-meta, .tech-list, .project-cta');
                elements.forEach((el, index) => {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }, 100 + (index * 100));
                });
            }, 50);
        }, 300);
    }
};

// Gestore Form Contatti
const FormManager = {
    init() {
        if (!DOM.contactForm) return;
        
        // Inizializza validazione real-time
        this.initRealTimeValidation();
        
        // Gestione submit form
        DOM.contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            this.handleSubmit();
        }.bind(this));
    },
    
    initRealTimeValidation() {
        const formInputs = DOM.contactForm.querySelectorAll('input, textarea, select');
        
        formInputs.forEach(input => {
            // Validazione durante digitazione (debounced)
            input.addEventListener('input', Utils.debounce(() => {
                this.validateInput(input);
            }, 300));
            
            // Validazione alla perdita di focus
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });
        });
    },
    
    validateInput(input) {
        const parent = input.closest('.form-group') || input.parentNode;
        const errorElement = parent.querySelector('.error-message') || (function() {
            const span = document.createElement('span');
            span.className = 'error-message';
            parent.appendChild(span);
            return span;
        })();
        
        let isValid = true;
        let errorMessage = '';
        
        // Rimuovi classi esistenti
        input.classList.remove('is-valid', 'is-invalid');
        
        // Campo obbligatorio vuoto
        if (input.required && !input.value.trim()) {
            isValid = false;
            errorMessage = 'Questo campo è obbligatorio';
        }
        // Email non valida
        else if (input.type === 'email' && input.value) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(input.value)) {
                isValid = false;
                errorMessage = `Inserisci un indirizzo email valido`;
            }
        }
        // Lunghezza minima messaggio
        else if (input.id === 'message' && input.value.trim().length < 10) {
            isValid = false;
            errorMessage = 'Il messaggio deve contenere almeno 10 caratteri';
        }
        // Select non selezionato
        else if (input.nodeName === 'SELECT' && input.required && input.value === '') {
            isValid = false;
            errorMessage = `Seleziona un'opzione`;
        }
        
        // Aggiorna UI in base alla validazione
        if (isValid) {
            input.classList.add('is-valid');
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        } else {
            input.classList.add('is-invalid');
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
            
            // Aggiungi effetto shake solo se l'errore è nuovo
            if (!input.dataset.hadError) {
                errorElement.classList.add('shake-animation');
                setTimeout(() => {
                    errorElement.classList.remove('shake-animation');
                }, 600);
                input.dataset.hadError = 'true';
            }
        }
        
        return isValid;
    },
    
    validateForm() {
        const formInputs = DOM.contactForm.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        formInputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    },
    
    async handleSubmit(e) {
        e.preventDefault();
        
        // Evita invii multipli
        if (this.state.isSubmitting) return;
        
        // Attiva validazione
        this.state.validationActive = true;
        
        // Valida tutti i campi
        if (!this.validateForm()) {
            // Focus sul primo campo con errore
            const firstInvalid = this.elements.form.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
                
                // Scroll al primo campo con errore
                window.scrollTo({
                    top: firstInvalid.getBoundingClientRect().top + window.pageYOffset - 120,
                    behavior: 'smooth'
                });
            }
            return;
        }
        
        // Crea FormData
        const formData = new FormData(this.elements.form);
        formData.append('submission_id', this.state.submissionId);
        
        // Aggiorna UI per invio
        this.state.isSubmitting = true;
        const originalText = this.elements.submitBtn.textContent;
        this.elements.submitBtn.innerHTML = `<span class="loading-spinner"></span> Invio in corso...`;
        this.elements.submitBtn.disabled = true;
        this.elements.submitBtn.classList.add('btn-loading');
        
        try {
            // Invia richiesta
            const response = await fetch('process-form.php', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            // Analizza risposta
            const result = await response.json();
            
            // Gestisci risultato
            if (result.success) {
                // Mostra feedback successo
                this.showFeedback('success', 'Messaggio inviato con successo!', 'Grazie per avermi contattato. Ti risponderò al più presto.');
                
                // Resetta form
                this.elements.form.reset();
                this.elements.inputs.forEach(input => {
                    input.classList.remove('is-valid', 'is-invalid');
                });
                
                // Genera nuovo ID per eventuale altra submission
                this.state.submissionId = this.generateSubmissionId();
                
                // Aggiorna UI
                this.elements.submitBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg> Messaggio Inviato`;
                this.elements.submitBtn.classList.remove('btn-loading');
                this.elements.submitBtn.classList.add('btn-success');
                
                // Scroll to success message
                setTimeout(() => {
                    window.scrollTo({
                        top: this.elements.feedbackContainer.getBoundingClientRect().top + window.pageYOffset - 120,
                        behavior: 'smooth'
                    });
                }, 300);
                
                // Reset button after delay
                setTimeout(() => {
                    this.elements.submitBtn.textContent = originalText;
                    this.elements.submitBtn.disabled = false;
                    this.elements.submitBtn.classList.remove('btn-success');
                }, 5000);
                
            } else {
                // Errore
                this.elements.submitBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M15 9L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg> Errore`;
                this.elements.submitBtn.classList.remove('btn-loading');
                this.elements.submitBtn.classList.add('btn-error');
                
                // Errori specifici
                if (result.data && result.data.errors) {
                    this.showFeedback('error', 'Perfezionamento necessario', result.data.errors.join('<br>'));
                } else {
                    this.showFeedback('error', 'Si è verificato un problema', result.message || 'Si prega di riprovare tra qualche istante.');
                }
                
                // Reset button after delay
                setTimeout(() => {
                    this.elements.submitBtn.textContent = originalText;
                    this.elements.submitBtn.disabled = false;
                    this.elements.submitBtn.classList.remove('btn-error');
                }, 3000);
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            
            // Feedback errore generico
            this.showFeedback('error', 'Connessione non riuscita', 'Si è verificato un problema tecnico. Riprova tra qualche istante o contattami direttamente via email.');
            
            // Reset button
            this.elements.submitBtn.textContent = originalText;
            this.elements.submitBtn.disabled = false;
            this.elements.submitBtn.classList.remove('btn-loading');
        }
        
        // Reset submission state
        this.state.isSubmitting = false;
    },
    
    // Mostra feedback
    showFeedback(type, title, message) {
        // Clear previous feedback
        this.elements.feedbackContainer.innerHTML = '';
        
        // Create feedback element
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `form-${type}-message`;
        
        feedbackElement.innerHTML = `
            <div class="feedback-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    ${type === 'success' 
                      ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                      : '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/>'}
                </svg>
                <h4>${title}</h4>
            </div>
            <p>${message}</p>
        `;
        
        // Add and animate
        this.elements.feedbackContainer.appendChild(feedbackElement);
        
        // Fade in animation
        feedbackElement.style.opacity = '0';
        feedbackElement.style.transform = 'translateY(10px)';
        setTimeout(() => {
            feedbackElement.style.opacity = '1';
            feedbackElement.style.transform = 'translateY(0)';
        }, 10);
    },
    
    // Utility: Debounce
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Inizializza quando DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
    ContactForm.init();
});

// Gestore cursore personalizzato
const CursorManager = {
    init() {
        if (!DOM.cursor.dot || !DOM.cursor.outline || CONFIG.isTouchDevice) return;
        
        // Cache mouse coordinates and current positions
        let mouseX = 0, mouseY = 0;
        let dotX = 0, dotY = 0, outlineX = 0, outlineY = 0;
        
        // Speeds per easing (lower values = smoother)
        const dotSpeed = 0.2;
        const outlineSpeed = 0.1;
        
        // Update mouse coordinates
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            // Ensure the custom cursor is visible
            DOM.cursor.dot.style.opacity = '1';
            DOM.cursor.outline.style.opacity = '1';
        });
        
        // Hover state changes
        const hoverElements = document.querySelectorAll('a, button, input, textarea, select, .nav-link, .btn, .social-link, .portfolio-item, .option-card');
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                DOM.cursor.dot.classList.add('cursor-hover');
                DOM.cursor.outline.classList.add('cursor-hover');
            });
            element.addEventListener('mouseleave', () => {
                DOM.cursor.dot.classList.remove('cursor-hover');
                DOM.cursor.outline.classList.remove('cursor-hover');
            });
        });
        
        // Show/hide custom cursor when leaving/entering window
        document.addEventListener('mouseleave', () => {
            DOM.cursor.dot.style.opacity = '0';
            DOM.cursor.outline.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            DOM.cursor.dot.style.opacity = '1';
            DOM.cursor.outline.style.opacity = '1';
        });
        
        // Animate cursor using translate3d for GPU acceleration
        function animateCursor() {
            dotX += (mouseX - dotX) * dotSpeed;
            dotY += (mouseY - dotY) * dotSpeed;
            outlineX += (mouseX - outlineX) * outlineSpeed;
            outlineY += (mouseY - outlineY) * outlineSpeed;
            
            // Apply scaling to dot when hovered: shrink if 'cursor-hover' is active
            const scale = DOM.cursor.dot.classList.contains('cursor-hover') ? 0.7 : 1;
            DOM.cursor.dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%) scale(${scale})`;
            DOM.cursor.outline.style.transform = `translate3d(${outlineX}px, ${outlineY}px, 0) translate(-50%, -50%)`;
            
            requestAnimationFrame(animateCursor);
        }
        
        requestAnimationFrame(animateCursor);
    }
};

// Inizializzazione smooth scroll
function initSmoothScroll() {
    safeExecute(() => {
        const anchors = document.querySelectorAll('a[href^="#"]');
        if (!anchors.length) return;
        
        anchors.forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Salta se href vuoto o solo "#"
                if (href === '#' || href === '') return;
                
                // Trova l'elemento target
                const targetElement = document.querySelector(href);
                if (!targetElement) return;
                
                e.preventDefault();
                
                try {
                    // Calcola l'offset rispetto all'header sticky
                    const headerHeight = DOM.header ? DOM.header.offsetHeight : 0;
                    const targetPosition = Utils.getOffset(targetElement).top - headerHeight - 20;
                    
                    // Smooth scroll con comportamento nativo
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                } catch (error) {
                    // Fallback per browser che non supportano scrollTo con behavior
                    console.warn('Smooth scroll fallback:', error.message);
                    targetElement.scrollIntoView();
                }
            });
        });
    });
}

// Inizializzazione anno corrente nel footer
function initCurrentYear() {
    safeExecute(() => {
        if (DOM.yearEl) {
            DOM.yearEl.textContent = new Date().getFullYear();
        }
    });
}

// Inizializzazione applicazione
document.addEventListener('DOMContentLoaded', () => {
    console.info('DevVision - Inizializzazione applicazione');
    
    // Rileva preferenze utente
    CONFIG.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (CONFIG.prefersReducedMotion) {
        DOM.body.classList.add('reduced-motion');
    }
    
    // Inizializzazione componenti principali
    PreloaderManager.init();
    HeaderManager.init();
    BackToTopManager.init();
    initCurrentYear();
    TestimonialManager.init();
    FAQManager.init();
    PortfolioManager.init();
    FormManager.init();
    
    // Inizializza smooth scroll
    initSmoothScroll();
    
    // Inizializza cursore personalizzato solo su desktop
    if (!CONFIG.isMobile && !CONFIG.isTouchDevice) {
        CursorManager.init();
    }
    
    // Configura event listener per cambio preferenza riduzione movimento
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
        CONFIG.prefersReducedMotion = event.matches;
        DOM.body.classList.toggle('reduced-motion', event.matches);
    });
});

// Fornisci funzioni helper a livello globale
window.DevVision = {
    utils: Utils,
    scrollToElement: function(selector) {
        const element = document.querySelector(selector);
        if (element) {
            const headerHeight = DOM.header ? DOM.header.offsetHeight : 0;
            const elementPosition = Utils.getOffset(element).top - headerHeight - 20;
            
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }
};