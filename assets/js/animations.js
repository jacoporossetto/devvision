/**
 * DevVision - Animations & Microinteractions
 * 
 * Sistema avanzato di microinterazioni che trasforma l'interfaccia 
 * in una narrazione visiva fluida dove ogni elemento risponde con 
 * precisione millimetrica e naturalezza ai gesti dell'utente.
 * 
 * @version 2.0.0
 * @author DevVision Studio
 */

// Modalità strict per prevenire errori comuni e ottimizzare performance
'use strict';

// Cache per riferimenti DOM e stato dell'applicazione
const AnimationState = {
    // Stato delle animazioni
    initialized: false,
    preloaderRemoved: false,
    observersCollection: new Set(),
    
    // Rilevamento feature e preferenze utente
    features: {
        supportsIntersectionObserver: 'IntersectionObserver' in window,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        isTouchDevice: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    },
    
    // Tempistiche
    timings: {
        preloaderMinDuration: 800,  // Durata minima visualizzazione preloader (ms)
        preloaderMaxDuration: 3000, // Timeout di sicurezza
        typingSpeed: {
            base: 40,               // Velocità base digitazione (ms)
            variance: 30            // Varianza casuale per effetto realistico (ms)
        },
        codeAnimationDelay: 800,    // Ritardo prima dell'inizio animazione codice
        counterDuration: 2000,      // Durata animazione contatori numerici
        parallaxThrottle: 10,       // Limitazione frame parallasse (ms)
        scrollThrottle: 16,         // 60fps per eventi scroll
        skillAnimDelay: 50          // Delay tra animazioni barre competenze
    }
};

// Utilities per performance ottimizzata
const AnimUtils = {
    /**
     * Throttle: Limita la frequenza di chiamate a una funzione
     * Ideale per eventi ad alta frequenza come scroll, resize, mousemove
     * 
     * @param {Function} fn - Funzione da eseguire 
     * @param {Number} delay - Intervallo minimo tra le esecuzioni in ms
     * @return {Function} - Funzione con throttle applicato
     */
    throttle(fn, delay = 16) { // 16ms ~ 60fps default
        let lastCall = 0;
        return function(...args) {
            const now = performance.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return fn.apply(this, args);
            }
        };
    },
    
    /**
     * Debounce: Esegue la funzione solo dopo un periodo di inattività
     * Utile per eventi che possono generare molte chiamate consecutive
     * 
     * @param {Function} fn - Funzione da eseguire
     * @param {Number} wait - Tempo di attesa dopo l'ultima chiamata in ms
     * @return {Function} - Funzione con debounce applicato
     */
    debounce(fn, wait = 100) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), wait);
        };
    },
    
    /**
     * Esecuzione sicura di funzioni con fallback
     * Previene crash e garantisce resilienza
     * 
     * @param {Function} fn - Funzione da eseguire
     * @param {Function} fallback - Funzione alternativa in caso di errore
     * @param {...any} args - Argomenti da passare alla funzione
     * @return {*} - Risultato dell'esecuzione
     */
    safeExecute(fn, fallback = () => {}, ...args) {
        try {
            if (typeof fn === 'function') return fn(...args);
            return fallback(...args);
        } catch (error) {
            console.warn(`Animation error: ${error.message}`);
            return fallback(...args);
        }
    },
    
    /**
     * Animazione di fade in elemento DOM
     * 
     * @param {HTMLElement} element - Elemento da animare
     * @param {Number} duration - Durata animazione in ms
     * @return {Promise} Promise risolta alla fine dell'animazione
     */
    fadeIn(element, duration = 300) {
        if (!element) return Promise.reject('Invalid element');
        
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            // Force reflow to ensure opacity transition works
            element.offsetHeight;
            
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '1';
            
            setTimeout(() => {
                element.style.transition = '';
                resolve(element);
            }, duration);
        });
    },
    
    /**
     * Animazione di fade out elemento DOM
     * 
     * @param {HTMLElement} element - Elemento da animare
     * @param {Number} duration - Durata animazione in ms
     * @return {Promise} Promise risolta alla fine dell'animazione
     */
    fadeOut(element, duration = 300) {
        if (!element) return Promise.reject('Invalid element');
        
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
    
    /**
     * Calcola l'offset di un elemento rispetto al documento
     * Utile per calcoli di posizionamento precisi
     * 
     * @param {HTMLElement} element - Elemento di cui calcolare l'offset
     * @return {Object} Oggetto con proprietà top, left, width, height
     */
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
    },
    
    /**
     * Verifica se un elemento è visibile nel viewport
     * 
     * @param {HTMLElement} element - Elemento da verificare
     * @param {Number} offset - Offset opzionale per attivazione anticipata
     * @return {Boolean} true se l'elemento è visibile
     */
    isInViewport(element, offset = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top <= (windowHeight - offset) &&
            rect.bottom >= (0 + offset) &&
            rect.left <= (windowWidth - offset) &&
            rect.right >= (0 + offset)
        );
    },
    
    /**
     * Crea una funzione di easing personalizzata
     * 
     * @param {String} type - Tipo di easing (linear, easeOut, easeIn, easeInOut)
     * @param {Number} power - Potenza della curva (2 = quadratica, 3 = cubica, ecc.)
     * @return {Function} Funzione di easing
     */
    createEasing(type = 'easeOut', power = 2) {
        switch(type) {
            case 'linear':
                return t => t;
            case 'easeIn':
                return t => Math.pow(t, power);
            case 'easeOut':
                return t => 1 - Math.pow(1 - t, power);
            case 'easeInOut':
                return t => t < 0.5
                    ? Math.pow(2 * t, power) / 2
                    : 1 - Math.pow(-2 * t + 2, power) / 2;
            case 'elastic':
                return t => {
                    const c4 = (2 * Math.PI) / 3;
                    return t === 0 ? 0 
                        : t === 1 ? 1 
                        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
                };
            default:
                return t => t;
        }
    }
};

// Gestore preloader e transizione iniziale
const PreloaderManager = {
    startTime: performance.now(),
    
    /**
     * Inizializza il gestore del preloader
     */
    init() {
        const preloader = document.querySelector('.preloader');
        if (!preloader) return;
        
        // Contatore animato nel preloader
        const loaderText = preloader.querySelector('.loader-text');
        if (loaderText) {
            let counter = 0;
            const counterInterval = setInterval(() => {
                counter += 1;
                if (counter <= 100) {
                    loaderText.textContent = `${counter}%`;
                } else {
                    clearInterval(counterInterval);
                }
            }, 20);
        }
        
        // Fallback di sicurezza per prevenire blocchi UI
        setTimeout(() => this.forceRemovePreloader(), AnimationState.timings.preloaderMaxDuration);
        
        // Evento load per rimozione automatica
        window.addEventListener('load', () => this.removePreloader());
    },
    
    /**
     * Rimuove il preloader con animazione fluida
     */
    removePreloader() {
        if (AnimationState.preloaderRemoved) return;
        
        const preloader = document.querySelector('.preloader');
        if (!preloader) return;
        
        const currentTime = performance.now();
        const elapsedTime = currentTime - this.startTime;
        const minDuration = AnimationState.timings.preloaderMinDuration;
        
        // Garantisce durata minima per evitare flash di contenuto
        const remainingTime = Math.max(0, minDuration - elapsedTime);
        
        setTimeout(() => {
            preloader.style.opacity = '0';
            
            setTimeout(() => {
                preloader.style.display = 'none';
                document.body.classList.add('content-loaded');
                AnimationState.preloaderRemoved = true;
                
                // Avvia le animazioni post-caricamento
                this.initializePostLoadAnimations();
            }, 300); // Durata transizione opacity
        }, remainingTime);
    },
    
    /**
     * Forza la rimozione del preloader (failsafe)
     */
    forceRemovePreloader() {
        if (AnimationState.preloaderRemoved) return;
        
        const preloader = document.querySelector('.preloader');
        if (!preloader) return;
        
        console.warn('Forced preloader removal after timeout');
        preloader.style.opacity = '0';
        preloader.style.display = 'none';
        document.body.classList.add('content-loaded');
        AnimationState.preloaderRemoved = true;
        
        // Avvia le animazioni post-caricamento
        this.initializePostLoadAnimations();
    },
    
    /**
     * Inizializza animazioni che richiedono DOM completamente caricato
     */
    initializePostLoadAnimations() {
        AnimUtils.safeExecute(() => {
            // Se l'utente preferisce ridurre il movimento, minimizziamo animazioni
            if (AnimationState.features.prefersReducedMotion) {
                document.body.classList.add('reduced-motion');
                this.applyReducedMotion();
                return;
            }
            
            // Inizializza animazioni principali
            initAnimateCodeSection();
            initScrollRevealAnimations();
            initSkillBars();
            initCounterAnimations();
            initParallaxEffects();
            
            // Solo per desktop: effetti avanzati
            if (!AnimationState.features.isMobile && !AnimationState.features.isTouchDevice) {
                initTiltEffects();
            }
            
            // Marca sistema come inizializzato
            AnimationState.initialized = true;
            
            // Attiva visibilità animata
            document.body.classList.add('animations-ready');
            
            // Personalizza approccio in base al dispositivo
            if (AnimationState.features.isMobile) {
                // Riduce animazioni parallasse su mobile per performance migliori
                document.querySelectorAll('[data-parallax]').forEach(el => {
                    el.setAttribute('data-parallax', Math.min(
                        0.05, 
                        parseFloat(el.getAttribute('data-parallax') || 0.1)
                    ));
                });
            }
        });
    },
    
    /**
     * Applica configurazione per movimento ridotto
     * Garantisce accessibilità e rispetto preferenze utente
     */
    applyReducedMotion() {
        // Assicura che tutti gli elementi siano immediatamente visibili
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
            el.classList.add('active');
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        
        // Disattiva parallasse
        document.querySelectorAll('[data-parallax]').forEach(el => {
            el.style.transform = 'none';
        });
        
        // Disattiva tilt
        document.querySelectorAll('.project-card, .portfolio-item, .value-card').forEach(el => {
            el.style.transform = 'none';
            el.style.transition = 'none';
        });
        
        // Mostra skill bars immediatamente
        document.querySelectorAll('.skill-progress').forEach(bar => {
            const level = bar.getAttribute('data-level');
            if (level) bar.style.width = level;
        });
        
        // Imposta contatori direttamente al valore finale
        document.querySelectorAll('.counter-number').forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'), 10);
            if (!isNaN(target)) {
                const formatter = new Intl.NumberFormat('it-IT');
                counter.textContent = formatter.format(target);
            }
        });
    }
};

/**
 * Anima la sezione di codice nella hero section
 * Effetto di digitazione linea per linea del codice
 */
function initAnimateCodeSection() {
    const codeElement = document.querySelector('.code-animation code');
    if (!codeElement) return;
    
    // Salva il contenuto originale
    const originalCode = codeElement.textContent;
    codeElement.textContent = '';
    
    // Aggiungi il cursore
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';
    codeElement.appendChild(cursor);
    
    // Suddividi in linee
    const codeLines = originalCode.trim().split('\n');
    let lineIndex = 0;
    let charIndex = 0;
    
    // Animazione di digitazione con timing naturale
    function typeNextCharacter() {
        if (lineIndex < codeLines.length) {
            if (charIndex < codeLines[lineIndex].length) {
                // Aggiungi un carattere alla volta
                const char = codeLines[lineIndex].charAt(charIndex);
                codeElement.textContent += char;
                
                // Riposiziona cursore
                codeElement.appendChild(cursor);
                
                charIndex++;
                
                // Timing variabile per effetto realistico
                const { base, variance } = AnimationState.timings.typingSpeed;
                const randomDelay = Math.random() * variance;
                
                // Pausa più lunga dopo punteggiatura
                const punctuationDelay = /[,.;:{}()]/.test(char) ? 180 : 0;
                
                // Delay leggermente superiore alla fine della parola
                const wordEndDelay = /\s/.test(char) ? 50 : 0;
                
                const totalDelay = base + randomDelay + punctuationDelay + wordEndDelay;
                
                setTimeout(typeNextCharacter, totalDelay);
            } else {
                // Vai a capo per nuova linea
                codeElement.textContent += '\n';
                codeElement.appendChild(cursor);
                lineIndex++;
                charIndex = 0;
                
                // Pausa tra le linee
                setTimeout(typeNextCharacter, 200);
            }
        } else {
            // Completa l'animazione aggiungendo l'effetto di lampeggio al cursore
            cursor.classList.add('blink');
        }
    }
    
    // Avvia con un piccolo ritardo
    setTimeout(typeNextCharacter, AnimationState.timings.codeAnimationDelay);
}

/**
 * Configura le animazioni di rivelazione al scroll
 * Elementi entrano nel viewport con effetti eleganti
 */
function initScrollRevealAnimations() {
    // Esci se non supportato o se poche animazioni
    if (!AnimationState.features.supportsIntersectionObserver) {
        // Fallback: mostra tutti gli elementi
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
            el.classList.add('active');
        });
        return;
    }
    
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (!elements.length) return;
    
    // Funzione callback per l'observer
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // Calcola delay staggered per elementi fratelli
                const siblings = Array.from(element.parentNode.children).filter(el => {
                    return el.classList.contains('reveal') ||
                           el.classList.contains('reveal-left') ||
                           el.classList.contains('reveal-right');
                });
                
                const index = siblings.indexOf(element);
                const delay = Math.min(index * 100, 500); // Max 500ms ritardo
                
                // Attiva con ritardo progressivo
                setTimeout(() => {
                    element.classList.add('active');
                }, delay);
                
                // Smetti di osservare dopo l'animazione
                observer.unobserve(element);
            }
        });
    };
    
    // Configura intersection observer
    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px' // Attiva un po' prima del viewport
    });
    
    // Osserva ogni elemento
    elements.forEach(element => {
        revealObserver.observe(element);
    });
    
    // Aggiungi alla collezione di observer attivi
    AnimationState.observersCollection.add(revealObserver);
}

/**
 * Inizializza animazioni barre competenze
 * Anima progressivamente le barre al livello specificato
 */
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    if (!skillBars.length) return;
    
    // Funzione per animare una barra
    const animateSkill = (bar) => {
        const level = bar.getAttribute('data-level');
        if (!level) return;
        
        // Reset width
        bar.style.width = '0';
        
        // Timeout minimo per garantire reset visibile
        setTimeout(() => {
            bar.style.width = level;
            bar.classList.add('animated');
        }, AnimationState.timings.skillAnimDelay);
    };
    
    if (AnimationState.features.supportsIntersectionObserver) {
        // Usa IntersectionObserver per trigger al momento giusto
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkill(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        skillBars.forEach(bar => observer.observe(bar));
        AnimationState.observersCollection.add(observer);
    } else {
        // Fallback: anima con delay staggered
        skillBars.forEach((bar, index) => {
            setTimeout(() => animateSkill(bar), 50 * index);
        });
    }
}

/**
 * Inizializza contatori numerici animati
 * Incrementa progressivamente fino al target con easing
 */
function initCounterAnimations() {
    const counters = document.querySelectorAll('.counter-number');
    if (!counters.length) return;
    
    // Funzione per animare un contatore
    const animateCounter = (counter, target, duration = AnimationState.timings.counterDuration) => {
        if (isNaN(target)) return;
        
        // Reset
        counter.textContent = '0';
        
        const startValue = 0;
        const formatter = new Intl.NumberFormat('it-IT');
        
        // Timestamp iniziale per l'animazione
        let startTimestamp = null;
        
        // Funzione di easing cubica
        const easeOutCubic = AnimUtils.createEasing('easeOut', 3);
        
        // Funzione di animazione per ogni frame
        function step(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            
            const elapsed = timestamp - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);
            
            // Applica easing per movimento naturale
            const easedProgress = easeOutCubic(progress);
            
            // Calcola valore corrente
            const currentValue = Math.floor(easedProgress * (target - startValue));
            
            // Aggiorna contatore con separatore migliaia
            counter.textContent = formatter.format(currentValue);
            
            // Continua finché non completato
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                // Assicura valore finale esatto
                counter.textContent = formatter.format(target);
                counter.classList.add('completed');
            }
        }
        
        // Avvia animazione
        requestAnimationFrame(step);
    };
    
    if (AnimationState.features.supportsIntersectionObserver) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-count'), 10);
                    
                    // Calcola durata progressiva basata sul valore
                    const duration = Math.min(
                        AnimationState.timings.counterDuration + (target / 100), 
                        3000 // Max 3s
                    );
                    
                    // Delay staggered per counter vicini
                    const parent = counter.closest('.project-counters, .counter-container');
                    if (parent) {
                        const siblings = Array.from(parent.querySelectorAll('.counter-number'));
                        const index = siblings.indexOf(counter);
                        const delay = index * 150;
                        
                        setTimeout(() => {
                            animateCounter(counter, target, duration);
                        }, delay);
                    } else {
                        animateCounter(counter, target, duration);
                    }
                    
                    observer.unobserve(counter);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: "0px 0px -10% 0px"
        });
        
        counters.forEach(counter => observer.observe(counter));
        AnimationState.observersCollection.add(observer);
    } else {
        // Fallback senza IntersectionObserver
        counters.forEach((counter, index) => {
            const target = parseInt(counter.getAttribute('data-count'), 10);
            const delay = index * 150;
            
            setTimeout(() => {
                animateCounter(counter, target);
            }, 500 + delay);
        });
    }
}

/**
 * Inizializza effetti parallasse per elementi di sfondo
 * Crea sensazione di profondità durante lo scroll
 */
function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    if (!parallaxElements.length) return;
    
    // Handler ottimizzato per parallasse
    const parallaxHandler = AnimUtils.throttle(() => {
        const scrollTop = window.pageYOffset;
        const viewportHeight = window.innerHeight;
        
        parallaxElements.forEach(element => {
            // Calcola posizione rispetto allo viewport
            const rect = element.getBoundingClientRect();
            const inView = (rect.bottom > 0 && rect.top < viewportHeight);
            
            if (inView) {
                // Ottieni velocità parallasse dall'attributo data
                const speed = parseFloat(element.getAttribute('data-parallax')) || 0.1;
                
                // Calcola offset in base alla posizione di scroll
                const elementTop = rect.top + scrollTop;
                const elementCenter = elementTop + (rect.height / 2);
                const windowCenter = scrollTop + (viewportHeight / 2);
                const distanceFromCenter = elementCenter - windowCenter;
                
                // Calcola l'offset parallasse in base alla distanza dal centro
                const offset = -distanceFromCenter * speed;
                
                // Applica trasformazione ottimizzata per GPU
                element.style.transform = `translate3d(0, ${offset}px, 0)`;
            }
        });
    }, AnimationState.timings.parallaxThrottle);
    
    // Aggiungi listener per scroll e resize
    window.addEventListener('scroll', parallaxHandler);
    window.addEventListener('resize', AnimUtils.debounce(parallaxHandler, 200));
    
    // Esegui subito per posizionamento iniziale
    parallaxHandler();
}

/**
 * Inizializza effetti tilt 3D per elementi interattivi
 * Crea effetto di profondità al passaggio del mouse
 */
function initTiltEffects() {
    // Applica solo su desktop/non-touch
    if (AnimationState.features.isTouchDevice) return;
    
    const tiltElements = document.querySelectorAll('.project-card, .portfolio-item, .value-card, .service-category');
    if (!tiltElements.length) return;
    
    tiltElements.forEach(element => {
        let isHovering = false;
        
        // Utilità per calcolare ammontare del tilt
        function calculateTiltAmount(x, y, rect) {
            // Calcola la distanza dal centro in percentuale
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Distanza normalizzata (0-1)
            const distance = Math.min(
                1, 
                Math.sqrt(Math.pow((x - centerX) / centerX, 2) + Math.pow((y - centerY) / centerY, 2))
            );
            
            // Attenua basandosi sulla distanza (più lontano = più attenuato)
            const attenuationFactor = 1 - Math.pow(distance, 2);
            
            // Base tilt in gradi
            const baseTilt = 5;
            
            return baseTilt * attenuationFactor;
        }
        
        // Handler per effetto tilt
        function handleTilt(e) {
            if (!isHovering) return;
            
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Posizione relativa (-1 a 1)
            const xPercent = (x / rect.width - 0.5) * 2;
            const yPercent = (y / rect.height - 0.5) * 2;
            
            // Calcola tilt basato sulla distanza
            const tiltAmount = calculateTiltAmount(x, y, rect);
            const tiltX = yPercent * tiltAmount;
            const tiltY = -xPercent * tiltAmount;
            
            // Calcola posizione effetto luce
            const glareX = (xPercent + 1) / 2 * 100;
            const glareY = (yPercent + 1) / 2 * 100;
            
            // Applica trasformazioni ottimizzate
            element.style.transform = `
                perspective(1000px) 
                rotateX(${tiltX}deg) 
                rotateY(${tiltY}deg) 
                scale3d(1.02, 1.02, 1.02)
            `;
            
            // Crea effetto glare dinamico
            const glareOpacity = Math.min(0.15, Math.abs(xPercent * yPercent) * 0.15);
            element.style.backgroundImage = `
                radial-gradient(
                    circle at ${glareX}% ${glareY}%, 
                    rgba(255,255,255,${glareOpacity}) 0%, 
                    rgba(255,255,255,0) 60%
                )
            `;
            
            // Aggiungi ombra dinamica
            const shadowX = -xPercent * 10;
            const shadowY = -yPercent * 10;
            element.style.boxShadow = `
                0 5px 15px rgba(0,0,0,0.1),
                ${shadowX}px ${shadowY}px 20px rgba(0,0,0,0.15)
            `;
        }
        
        // Gestione eventi mouse
        element.addEventListener('mouseenter', () => {
            isHovering = true;
            element.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease';
        });
        
        element.addEventListener('mousemove', AnimUtils.throttle(handleTilt, 16));
        
        element.addEventListener('mouseleave', () => {
            isHovering = false;
            
            // Reset stato
            element.style.transition = 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), background-image 0.4s ease';
            element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            element.style.backgroundImage = 'none';
            element.style.boxShadow = '';
        });
    });
}

/**
 * Garantisce visibilità degli elementi anche in caso di errori
 * Meccanismo di sicurezza per usabilità
 */
function ensureVisibility() {
    console.info("Applying fallback visibility to all elements");
    
    // Rimuovi preloader
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => { preloader.style.display = 'none'; }, 300);
    }
    
    // Rendi visibili tutti gli elementi
    document.body.classList.add('animations-ready', 'content-loaded');
    
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('active');
    });
    
    // Mostra skill bars
    document.querySelectorAll('.skill-progress').forEach(bar => {
        const level = bar.getAttribute('data-level');
        if (level) bar.style.width = level;
    });
    
    // Imposta contatori al valore finale
    document.querySelectorAll('.counter-number').forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'), 10);
        if (!isNaN(target)) {
            counter.textContent = new Intl.NumberFormat('it-IT').format(target);
        }
    });
}

/**
 * Gestisce configurazioni per movimento ridotto
 * Rispetta preferenze di accessibilità
 */
function handleReducedMotionPreference() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Funzione handler per cambio preferenza
    function handleMotionPreferenceChange(event) {
        AnimationState.features.prefersReducedMotion = event.matches;
        
        if (event.matches) {
            document.body.classList.add('reduced-motion');
            
            // Disattiva animazioni
            AnimationState.observersCollection.forEach(observer => {
                if (observer && typeof observer.disconnect === 'function') {
                    observer.disconnect();
                }
            });
            
            // Applica subito stati finali
            PreloaderManager.applyReducedMotion();
            
        } else {
            document.body.classList.remove('reduced-motion');
            
            // Reinizializza animazioni se necessario
            if (AnimationState.initialized && AnimationState.preloaderRemoved) {
                initScrollRevealAnimations();
                initParallaxEffects();
                initSkillBars();
                initCounterAnimations();
            }
        }
    }
    
    // Aggiungi listener per cambio preferenza
    prefersReducedMotion.addEventListener('change', handleMotionPreferenceChange);
    
    // Imposta stato iniziale
    handleMotionPreferenceChange(prefersReducedMotion);
}

// Inizializzazione al caricamento del DOM
document.addEventListener('DOMContentLoaded', () => {
    console.info("DOM Content Loaded - Starting animation system");
    
    // Inizializza preloader
    PreloaderManager.init();
    
    // Rileva preferenze utente per riduzione movimento
    handleReducedMotionPreference();
    
    // Fallback di sicurezza: garantisci visibilità anche in caso di problemi
    setTimeout(() => {
        if (!AnimationState.initialized || !AnimationState.preloaderRemoved) {
            console.warn('Animation initialization safety timeout reached, applying fallback');
            ensureVisibility();
        }
    }, 5000);
});

// Assicura che elementi siano visibili dopo caricamento completo
window.addEventListener('load', function() {
    setTimeout(() => {
        // Verifica se le animazioni sono state inizializzate correttamente
        if (!document.body.classList.contains('animations-ready')) {
            console.warn('Incomplete animation initialization detected, applying fallback');
            ensureVisibility();
        }
    }, 2500);
});