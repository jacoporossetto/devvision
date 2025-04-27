/**
 * DevVision - Cookie Consent System
 * 
 * Sistema modulare e conformte GDPR per la gestione dei consensi cookie,
 * con microinterazioni fluide e architettura elegante che bilancia
 * perfettamente requisiti legali ed esperienza utente raffinata.
 * 
 * @version 1.0.0
 */

(function() {
    'use strict';

    // Configurazione del sistema cookie
    const CookieConfig = {
        // Nome dei cookie
        cookieNames: {
            consent: 'devvision_cookie_consent',
            preferences: 'devvision_cookie_preferences'
        },
        
        // Durata cookie in giorni
        cookieDuration: 180,
        
        // Ritardi per animazioni
        animationDelays: {
            initialDisplay: 1500,      // Ritardo prima di mostrare il banner all'utente
            modalTransition: 300,      // Durata transizione per modal
            buttonRipple: 600,         // Durata effetto ripple sui pulsanti
            settingsButtonDisplay: 500 // Ritardo prima di mostrare pulsante impostazioni
        },
        
        // Testi per elementi UI dinamici
        uiText: {
            toggleOn: 'Attivo',
            toggleOff: 'Disattivato'
        },
        
        // Proprietà analytics
        analyticsCallback: null,
        
        // Debug mode
        debug: false
    };

    // Cache elementi DOM per performance ottimizzata
    const DOM = {
        // Banner principale
        banner: document.getElementById('cookie-consent-banner'),
        acceptAllBtn: document.getElementById('accept-all-cookies'),
        preferencesBtn: document.getElementById('cookie-preferences'),
        acceptNecessaryBtn: document.getElementById('accept-necessary-cookies'),
        
        // Modal preferenze
        modal: document.getElementById('cookie-preferences-modal'),
        modalContainer: document.querySelector('.cookie-modal-container'),
        modalClose: document.querySelector('.cookie-modal-close'),
        savePreferencesBtn: document.getElementById('save-preferences'),
        overlay: document.getElementById('cookie-modal-overlay'),
        
        // Toggles cookie
        essentialToggle: document.getElementById('essential-cookies'),
        analyticsToggle: document.getElementById('analytics-cookies'),
        marketingToggle: document.getElementById('marketing-cookies'),
        
        // Pulsante impostazioni persistente
        settingsToggle: document.getElementById('cookie-settings-toggle'),
        
        // Links to Privacy Policy and Terms
        privacyLink: document.getElementById('privacy-link'),
        termsLink: document.getElementById('terms-link')
    };

    /**
     * Utility Functions
     */
    const CookieUtils = {
        // Imposta un cookie con nome, valore e durata
        setCookie(name, value, days = CookieConfig.cookieDuration) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = `expires=${date.toUTCString()}`;
            document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
            this.logDebug(`Cookie impostato: ${name}=${value}, scade in ${days} giorni`);
        },
        
        // Ottiene il valore di un cookie
        getCookie(name) {
            const nameEQ = `${name}=`;
            const cookies = document.cookie.split(';');
            
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i];
                while (cookie.charAt(0) === ' ') {
                    cookie = cookie.substring(1);
                }
                if (cookie.indexOf(nameEQ) === 0) {
                    return cookie.substring(nameEQ.length);
                }
            }
            return null;
        },
        
        // Elimina un cookie
        deleteCookie(name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
            this.logDebug(`Cookie eliminato: ${name}`);
        },
        
        // Salva le preferenze utente
        savePreferences(preferences) {
            this.setCookie(
                CookieConfig.cookieNames.preferences, 
                JSON.stringify(preferences)
            );
            this.logDebug('Preferenze salvate', preferences);
        },
        
        // Ottiene le preferenze utente
        getPreferences() {
            const preferencesStr = this.getCookie(CookieConfig.cookieNames.preferences);
            if (!preferencesStr) return null;
            
            try {
                return JSON.parse(preferencesStr);
            } catch (e) {
                this.logDebug('Errore nel parsing delle preferenze', e);
                return null;
            }
        },
        
        // Cancella tutte le preferenze
        clearPreferences() {
            this.deleteCookie(CookieConfig.cookieNames.consent);
            this.deleteCookie(CookieConfig.cookieNames.preferences);
            this.logDebug('Preferenze cancellate');
        },
        
        // Controlla se il consenso è già stato dato
        hasConsent() {
            return !!this.getCookie(CookieConfig.cookieNames.consent);
        },
        
        // Log di debug
        logDebug(message, data) {
            if (CookieConfig.debug) {
                console.log(`[Cookie Consent] ${message}`, data || '');
            }
        }
    };

    /**
     * UI Manager - Gestisce l'interfaccia utente
     */
    const UIManager = {
        // Mostra il banner
        showBanner() {
            if (!DOM.banner) return;
            
            setTimeout(() => {
                DOM.banner.classList.add('show');
            }, CookieConfig.animationDelays.initialDisplay);
        },
        
        // Nasconde il banner
        hideBanner() {
            if (!DOM.banner) return;
            
            DOM.banner.classList.remove('show');
        },
        
        // Mostra il modal delle preferenze
        showModal() {
            if (!DOM.modal || !DOM.overlay) return;
            
            // Mostra modal e overlay
            DOM.modal.classList.add('show');
            DOM.overlay.classList.add('show');
            
            // Blocca scroll della pagina
            document.body.style.overflow = 'hidden';
            
            // Focus trap per accessibilità
            setTimeout(() => {
                DOM.modalClose.focus();
            }, 10);
        },
        
        // Nasconde il modal delle preferenze
        hideModal() {
            if (!DOM.modal || !DOM.overlay) return;
            
            DOM.modal.classList.remove('show');
            DOM.overlay.classList.remove('show');
            
            // Ripristina scroll
            document.body.style.overflow = '';
        },
        
        // Mostra il pulsante delle impostazioni
        showSettingsButton() {
            if (!DOM.settingsToggle) return;
            
            setTimeout(() => {
                DOM.settingsToggle.classList.add('show');
            }, CookieConfig.animationDelays.settingsButtonDisplay);
        },
        
        // Nasconde il pulsante delle impostazioni
        hideSettingsButton() {
            if (!DOM.settingsToggle) return;
            
            DOM.settingsToggle.classList.remove('show');
        },
        
        // Aggiorna lo stato dei toggle in base alle preferenze
        updateTogglesFromPreferences(preferences) {
            if (!preferences) return;
            
            if (DOM.analyticsToggle) {
                DOM.analyticsToggle.checked = preferences.analytics || false;
                this.updateToggleStatus(DOM.analyticsToggle);
            }
            
            if (DOM.marketingToggle) {
                DOM.marketingToggle.checked = preferences.marketing || false;
                this.updateToggleStatus(DOM.marketingToggle);
            }
        },
        
        // Aggiorna lo stato visivo di un toggle
        updateToggleStatus(toggleInput) {
            if (!toggleInput) return;
            
            const statusLabel = toggleInput.parentNode.querySelector('.toggle-status');
            if (statusLabel) {
                statusLabel.textContent = toggleInput.checked 
                    ? CookieConfig.uiText.toggleOn 
                    : CookieConfig.uiText.toggleOff;
            }
        },
        
        // Applica effetto ripple a un pulsante
        applyRippleEffect(button) {
            if (!button) return;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, CookieConfig.animationDelays.buttonRipple);
        }
    };

    /**
     * Consent Manager - Gestisce la logica del consenso
     */
    const ConsentManager = {
        // Inizializza il sistema di gestione consenso
        init() {
            this.bindEvents();
            this.checkConsentStatus();
            
            // Inizializza toggles
            if (DOM.analyticsToggle) {
                UIManager.updateToggleStatus(DOM.analyticsToggle);
            }
            if (DOM.marketingToggle) {
                UIManager.updateToggleStatus(DOM.marketingToggle);
            }
            
            CookieUtils.logDebug('Cookie Consent System inizializzato');
        },
        
        // Verifica lo stato del consenso
        checkConsentStatus() {
            if (CookieUtils.hasConsent()) {
                // L'utente ha già dato il consenso
                UIManager.hideBanner();
                UIManager.showSettingsButton();
                
                // Carica preferenze salvate
                const preferences = CookieUtils.getPreferences();
                if (preferences) {
                    UIManager.updateTogglesFromPreferences(preferences);
                    this.applyConsent(preferences);
                }
            } else {
                // Mostra banner per ottenere il consenso
                UIManager.showBanner();
            }
        },
        
        // Gestisce tutti gli eventi dell'interfaccia
        bindEvents() {
            // Bottone "Accetta tutti"
            if (DOM.acceptAllBtn) {
                DOM.acceptAllBtn.addEventListener('click', () => {
                    this.acceptAllCookies();
                });
            }
            
            // Bottone "Personalizza"
            if (DOM.preferencesBtn) {
                DOM.preferencesBtn.addEventListener('click', () => {
                    UIManager.showModal();
                });
            }
            
            // Bottone "Solo essenziali"
            if (DOM.acceptNecessaryBtn) {
                DOM.acceptNecessaryBtn.addEventListener('click', () => {
                    this.acceptNecessaryCookies();
                });
            }
            
            // Chiusura modal
            if (DOM.modalClose) {
                DOM.modalClose.addEventListener('click', () => {
                    UIManager.hideModal();
                });
            }
            
            // Click su overlay
            if (DOM.overlay) {
                DOM.overlay.addEventListener('click', () => {
                    UIManager.hideModal();
                });
            }
            
            // Salva preferenze dal modal
            if (DOM.savePreferencesBtn) {
                DOM.savePreferencesBtn.addEventListener('click', () => {
                    this.saveCustomPreferences();
                });
            }
            
            // Toggle impostazioni
            if (DOM.settingsToggle) {
                DOM.settingsToggle.addEventListener('click', () => {
                    // Carica preferenze salvate
                    const preferences = CookieUtils.getPreferences();
                    if (preferences) {
                        UIManager.updateTogglesFromPreferences(preferences);
                    }
                    UIManager.showModal();
                });
            }
            
            // Events for toggle status updates
            [DOM.analyticsToggle, DOM.marketingToggle].forEach(toggle => {
                if (toggle) {
                    toggle.addEventListener('change', () => {
                        UIManager.updateToggleStatus(toggle);
                    });
                }
            });
            
            // Tasto ESC per chiudere modal
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    UIManager.hideModal();
                }
            });
        },
        
        // Accetta tutti i cookie
        acceptAllCookies() {
            const preferences = {
                essential: true,
                analytics: true,
                marketing: true
            };
            
            this.giveConsent(preferences);
        },
        
        // Accetta solo i cookie necessari
        acceptNecessaryCookies() {
            const preferences = {
                essential: true,
                analytics: false,
                marketing: false
            };
            
            this.giveConsent(preferences);
        },
        
        // Salva preferenze personalizzate
        saveCustomPreferences() {
            const preferences = {
                essential: true, // Sempre attivi
                analytics: DOM.analyticsToggle ? DOM.analyticsToggle.checked : false,
                marketing: DOM.marketingToggle ? DOM.marketingToggle.checked : false
            };
            
            this.giveConsent(preferences);
            UIManager.hideModal();
        },
        
        // Registra il consenso
        giveConsent(preferences) {
            // Salva stato di consenso
            CookieUtils.setCookie(CookieConfig.cookieNames.consent, 'true');
            
            // Salva preferenze
            CookieUtils.savePreferences(preferences);
            
            // Applica preferenze
            this.applyConsent(preferences);
            
            // Aggiorna UI
            UIManager.hideBanner();
            UIManager.showSettingsButton();
        },
        
        // Applica le preferenze di consenso
        applyConsent(preferences) {
            if (!preferences) return;
            
            // Cookie analitici
            if (preferences.analytics) {
                this.enableAnalytics();
            } else {
                this.disableAnalytics();
            }
            
            // Cookie marketing
            if (preferences.marketing) {
                this.enableMarketing();
            } else {
                this.disableMarketing();
            }
            
            CookieUtils.logDebug('Preferenze applicate', preferences);
        },
        
        // Abilita Analytics
        enableAnalytics() {
            // Implementazione specifica per Google Analytics o altro sistema
            if (typeof CookieConfig.analyticsCallback === 'function') {
                CookieConfig.analyticsCallback(true);
            }
            
            CookieUtils.logDebug('Analytics abilitato');
        },
        
        // Disabilita Analytics
        disableAnalytics() {
            // Disattiva tracking
            if (typeof CookieConfig.analyticsCallback === 'function') {
                CookieConfig.analyticsCallback(false);
            }
            
            CookieUtils.logDebug('Analytics disabilitato');
        },
        
        // Abilita Marketing
        enableMarketing() {
            // Implementazione specifica per cookie marketing/advertising
            CookieUtils.logDebug('Marketing abilitato');
        },
        
        // Disabilita Marketing
        disableMarketing() {
            // Rimuovi cookie marketing se presenti
            CookieUtils.logDebug('Marketing disabilitato');
        }
    };

    /**
     * Event handler per i link di navigazione
     */
    function handleNavigationLinks() {
        if (DOM.privacyLink) {
            DOM.privacyLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Qui puoi aggiungere un reindirizzamento alla pagina Privacy Policy
                // window.location.href = '/privacy-policy.html';
                CookieUtils.logDebug('Link alla Privacy Policy cliccato');
                // Per ora mostriamo un alert di esempio
                alert('La Privacy Policy sarà caricata qui');
            });
        }
        
        if (DOM.termsLink) {
            DOM.termsLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Qui puoi aggiungere un reindirizzamento alla pagina Termini di Servizio
                // window.location.href = '/terms.html';
                CookieUtils.logDebug('Link ai Termini di Servizio cliccato');
                // Per ora mostriamo un alert di esempio
                alert('I Termini di Servizio saranno caricati qui');
            });
        }
    }

    // Inizializza tutto quando il DOM è pronto
    function initCookieConsent() {
        if (!DOM.banner) {
            console.error('[Cookie Consent] Elementi DOM non trovati');
            return;
        }
        
        // Inizializza la gestione del consenso
        ConsentManager.init();
        
        // Inizializza handler per i link
        handleNavigationLinks();
    }

    // Check if the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCookieConsent);
    } else {
        initCookieConsent();
    }

    // Esporta API pubblica (opzionale)
    window.DevVisionCookies = {
        // Reimposta tutto il sistema di consenso
        reset: function() {
            CookieUtils.clearPreferences();
            UIManager.showBanner();
            UIManager.hideSettingsButton();
            
            // Reset toggles
            if (DOM.analyticsToggle) {
                DOM.analyticsToggle.checked = false;
                UIManager.updateToggleStatus(DOM.analyticsToggle);
            }
            if (DOM.marketingToggle) {
                DOM.marketingToggle.checked = false;
                UIManager.updateToggleStatus(DOM.marketingToggle);
            }
            
            CookieUtils.logDebug('Cookie consent system resettato');
        },
        
        // Controlla se l'utente ha dato il consenso per una specifica categoria
        hasConsent: function(category) {
            const preferences = CookieUtils.getPreferences();
            if (!preferences) return false;
            
            return preferences[category] === true;
        },
        
        // Configura il callback per l'analytics
        setAnalyticsCallback: function(callback) {
            if (typeof callback === 'function') {
                CookieConfig.analyticsCallback = callback;
                CookieUtils.logDebug('Analytics callback impostato');
            }
        },
        
        // Attiva/Disattiva modalità debug
        setDebugMode: function(enable) {
            CookieConfig.debug = !!enable;
        }
    };
})();