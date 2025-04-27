/**
 * DevVision - Project Configurator
 * 
 * Sistema interattivo che trasforma il processo di preventivazione
 * in un'esperienza coinvolgente, guidando il cliente attraverso
 * la scoperta delle possibilità creative in modo fluido ed elegante.
 * 
 * @version 2.1.0
 * @author DevVision Studio
 */

(function() {
    'use strict';
    
    // Modello dati per il configuratore
    const ConfiguratorModel = {
        // Stato attuale della configurazione
        state: {
            currentStep: 1,
            totalSteps: 5,
            configData: {
                siteType: '',
                features: [],
                designStyle: '',
                timeline: '',
                budget: 0
            },
            isValid: {
                step1: false,
                step2: false,
                step3: false,
                step4: false
            }
        },
        
        // Prezzi base e moltiplicatori 
        pricing: {
            basePrice: {
                landing: 200,    // Landing Page
                website: 350,    // Sito Multi-pagina
                blog: 280,       // Blog Personale
                portfolio: 300   // Portfolio Creativo
            },
            featurePrice: {
                responsive: 0,           // Incluso di base
                gallery: 40,             // Galleria immagini
                contact: 30,             // Form di contatto
                seo: 50,                 // Ottimizzazione SEO
                analytics: 40,           // Google Analytics
                blog: 80,                // Sezione blog
                multilanguage: 100,      // Supporto multilingua
                newsletter: 60,          // Integrazione newsletter
                animation: 70,           // Animazioni e microinterazioni
                social: 30,              // Integrazione social
                cms: 120                 // CMS semplice
            },
            designMultiplier: {
                minimal: 1,        // Design essenziale
                creative: 1.2,     // Design distintivo
                corporate: 1.1     // Design professionale
            },
            timelineMultiplier: {
                standard: 1,      // Processo creativo normale
                fast: 1.3         // Processo accelerato
            },
            // Descrizioni dettagliate per ogni configurazione
            descriptions: {
                siteType: {
                    landing: "Una Landing Page elegante che presenta in modo efficace il tuo servizio o prodotto, con layout minimalista e call-to-action strategicamente posizionate",
                    website: "Un sito web completo con architettura informativa chiara e navigazione intuitiva, perfetto per presentare la tua attività o i tuoi contenuti",
                    blog: "Un blog personale dal design essenziale che mette in risalto i tuoi contenuti, con una leggibilità ottimale e una struttura che favorisce la scoperta",
                    portfolio: "Un portfolio creativo che valorizza i tuoi lavori attraverso una presentazione visiva d'impatto, con spazi negativi calibrati e transizioni fluide"
                },
                designStyle: {
                    minimal: "Design essenziale che privilegia lo spazio negativo e la tipografia per un'esperienza pulita e focalizzata sul contenuto",
                    creative: "Design distintivo con elementi grafici caratterizzanti ed effetti interattivi per un'esperienza memorabile e coinvolgente",
                    corporate: "Design professionale con equilibrio tra autorevolezza e accessibilità per comunicare solidità e affidabilità"
                },
                timeline: {
                    standard: "Processo creativo organico che rispetta i tempi necessari per l'approfondimento e il perfezionamento (3-6 settimane)",
                    fast: "Processo intensivo con priorità dedicata per una consegna accelerata del progetto (2-4 settimane)"
                }
            }
        },
        
        // Tempo stimato in settimane
        getTimeEstimate() {
            if (!this.state.configData.siteType || !this.state.configData.timeline) {
                return { min: 0, max: 0 };
            }
            
            let baseTime = {
                landing: { min: 1, max: 3 },
                website: { min: 3, max: 6 },
                blog: { min: 2, max: 4 },
                portfolio: { min: 2, max: 5 }
            }[this.state.configData.siteType];
            
            // Aggiungi tempo per feature complesse
            const complexFeatures = ['multilanguage', 'cms', 'blog'].filter(
                feature => this.state.configData.features.includes(feature)
            );
            
            baseTime.min += complexFeatures.length * 0.5;
            baseTime.max += complexFeatures.length * 1;
            
            // Applica moltiplicatore timeline
            if (this.state.configData.timeline === 'fast') {
                baseTime.min = Math.ceil(baseTime.min * 0.7);
                baseTime.max = Math.ceil(baseTime.max * 0.7);
            }
            
            return baseTime;
        },
        
        // Calcola il preventivo completo
        calculateEstimate() {
            if (!this.state.configData.siteType) return 0;
            
            // Prezzo base per tipologia
            let basePrice = this.pricing.basePrice[this.state.configData.siteType] || 0;
            
            // Calcola costo feature aggiuntive
            let featuresPrice = this.state.configData.features.reduce((total, feature) => {
                return total + (this.pricing.featurePrice[feature] || 0);
            }, 0);
            
            // Applica moltiplicatore design
            let designMultiplier = 1;
            if (this.state.configData.designStyle) {
                designMultiplier = this.pricing.designMultiplier[this.state.configData.designStyle] || 1;
            }
            
            // Applica moltiplicatore timeline
            let timelineMultiplier = 1;
            if (this.state.configData.timeline) {
                timelineMultiplier = this.pricing.timelineMultiplier[this.state.configData.timeline] || 1;
            }
            
            // Calcolo del prezzo finale
            let totalPrice = (basePrice + featuresPrice) * designMultiplier * timelineMultiplier;
            
            // Arrotonda alle decine
            return Math.round(totalPrice / 10) * 10;
        },
        
        // Verifica la validità del passo corrente
        validateCurrentStep() {
            const step = this.state.currentStep;
            
            switch(step) {
                case 1:
                    this.state.isValid.step1 = !!this.state.configData.siteType;
                    return this.state.isValid.step1;
                case 2:
                    // Almeno 2 feature selezionate per procedere
                    this.state.isValid.step2 = this.state.configData.features.length >= 2;
                    return this.state.isValid.step2;
                case 3:
                    this.state.isValid.step3 = !!this.state.configData.designStyle;
                    return this.state.isValid.step3;
                case 4:
                    this.state.isValid.step4 = !!this.state.configData.timeline;
                    return this.state.isValid.step4;
                default:
                    return true;
            }
        },
        
        // Vai al passo successivo se il corrente è valido
        nextStep() {
            if (this.validateCurrentStep() && this.state.currentStep < this.state.totalSteps) {
                this.state.currentStep++;
                return true;
            }
            return false;
        },
        
        // Vai al passo precedente
        prevStep() {
            if (this.state.currentStep > 1) {
                this.state.currentStep--;
                return true;
            }
            return false;
        },
        
        // Vai a un passo specifico
        goToStep(step) {
            if (step >= 1 && step <= this.state.totalSteps) {
                if (step > this.state.currentStep) {
                    // Verifica tutti i passi precedenti prima di avanzare
                    for (let i = this.state.currentStep; i < step; i++) {
                        this.state.currentStep = i;
                        if (!this.validateCurrentStep()) {
                            return false;
                        }
                    }
                }
                this.state.currentStep = step;
                return true;
            }
            return false;
        },
        
        // Resetta il configuratore
        reset() {
            this.state.currentStep = 1;
            this.state.configData = {
                siteType: '',
                features: [],
                designStyle: '',
                timeline: '',
                budget: 0
            };
            this.state.isValid = {
                step1: false,
                step2: false,
                step3: false,
                step4: false
            };
        },
        
        // Aggiorna lo stato con i dati del form
        updateFromForm(formData) {
            // Tipologia sito
            if (formData.has('siteType')) {
                this.state.configData.siteType = formData.get('siteType');
            }
            
            // Feature selezionate
            if (formData.has('features')) {
                const features = formData.getAll('features');
                this.state.configData.features = Array.isArray(features) ? features : [features];
            }
            
            // Stile design
            if (formData.has('designStyle')) {
                this.state.configData.designStyle = formData.get('designStyle');
            }
            
            // Timeline
            if (formData.has('timeline')) {
                this.state.configData.timeline = formData.get('timeline');
            }
            
            // Ricalcola budget
            this.state.configData.budget = this.calculateEstimate();
        }
    };
    
    // Vista per il configuratore (gestisce DOM)
    const ConfiguratorView = {
        // Elementi DOM
        elements: {
            configurator: null,
            steps: null,
            panels: null,
            nextButtons: null,
            prevButtons: null,
            submitButton: null,
            resultPanel: null,
            inputs: {
                siteType: null,
                features: null,
                designStyle: null,
                timeline: null
            }
        },
        
        // Inizializza riferimenti DOM
        init() {
            this.elements.configurator = document.querySelector('.configurator-container');
            
            if (!this.elements.configurator) {
                console.error('Configurator container not found');
                return false;
            }
            
            this.elements.steps = document.querySelectorAll('.step');
            this.elements.panels = document.querySelectorAll('.configurator-panel');
            this.elements.nextButtons = document.querySelectorAll('.btn-next');
            this.elements.prevButtons = document.querySelectorAll('.btn-prev');
            this.elements.submitButton = document.querySelector('.btn-save');
            this.elements.resultPanel = document.querySelector('.estimate-content');
            
            this.elements.inputs.siteType = document.querySelectorAll('input[name="siteType"]');
            this.elements.inputs.features = document.querySelectorAll('input[name="features"]');
            this.elements.inputs.designStyle = document.querySelectorAll('input[name="designStyle"]');
            this.elements.inputs.timeline = document.querySelectorAll('input[name="timeline"]');
            
            return !!this.elements.panels.length;
        },
        
        // Mostra un pannello specifico
        showPanel(step) {
            // Nascondi tutti i pannelli
            this.elements.panels.forEach(panel => {
                panel.classList.remove('active');
                
                // Effetto di dissolvenza in uscita
                panel.style.opacity = '0';
                panel.style.transform = 'translateY(10px)';
            });
            
            // Mostra il pannello corrente
            const currentPanel = document.querySelector(`.configurator-panel[data-panel="${step}"]`);
            if (currentPanel) {
                currentPanel.classList.add('active');
                
                // Animazione di entrata
                setTimeout(() => {
                    currentPanel.style.opacity = '1';
                    currentPanel.style.transform = 'translateY(0)';
                }, 50);
            }
            
            // Aggiorna indicatori step
            this.updateStepIndicators(step);
            
            // Scorri alla sezione del configuratore se necessario
            const configSection = document.querySelector('.configurator-section');
            if (configSection && window.scrollY < configSection.offsetTop) {
                window.scrollTo({
                    top: configSection.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        },
        
        // Aggiorna indicatori di progressione
        updateStepIndicators(currentStep) {
            this.elements.steps.forEach(step => {
                step.classList.remove('active', 'completed');
                const stepNum = parseInt(step.getAttribute('data-step'));
                
                if (stepNum === currentStep) {
                    step.classList.add('active');
                } else if (stepNum < currentStep) {
                    step.classList.add('completed');
                }
            });
        },
        
        // Evidenzia campi invalidi
        highlightInvalidFields(step) {
            switch(step) {
                case 1:
                    this.toggleFieldValidation('.option-card input[name="siteType"]', 'Seleziona una tipologia di progetto');
                    break;
                case 2:
                    this.toggleFieldValidation('input[name="features"]', 'Seleziona almeno 2 funzionalità');
                    break;
                case 3:
                    this.toggleFieldValidation('.option-card input[name="designStyle"]', 'Seleziona una direzione estetica');
                    break;
                case 4:
                    this.toggleFieldValidation('.option-card input[name="timeline"]', 'Seleziona una timeline');
                    break;
            }
        },
        
        // Attiva/disattiva messaggi di validazione
        toggleFieldValidation(selector, message) {
            const container = document.querySelector(`.configurator-panel[data-panel="${ConfiguratorModel.state.currentStep}"]`);
            const warningElement = container.querySelector('.validation-warning') || document.createElement('div');
            
            let anyChecked = false;
            const inputs = container.querySelectorAll(selector);
            
            if (selector.includes('features')) {
                anyChecked = Array.from(inputs).filter(input => input.checked).length >= 2;
            } else {
                anyChecked = Array.from(inputs).some(input => input.checked);
            }
            
            if (!anyChecked) {
                // Mostra messaggio di errore
                warningElement.className = 'validation-warning';
                warningElement.textContent = message;
                
                // Aggiungi shake animation
                warningElement.classList.add('shake-animation');
                
                // Rimuovi e riattacca per riattivare animazione
                if (warningElement.parentNode) {
                    warningElement.parentNode.removeChild(warningElement);
                }
                
                container.querySelector('.panel-nav').insertAdjacentElement('beforebegin', warningElement);
                
                // Rimuovi animazione dopo che è completa
                setTimeout(() => {
                    warningElement.classList.remove('shake-animation');
                }, 600);
                
                // Aggiungi classe di errore alle cards
                container.querySelectorAll('.option-card, .custom-checkbox').forEach(card => {
                    card.classList.add('validation-highlight');
                });
                
                return false;
            } else {
                // Rimuovi messaggi di errore e highlight
                if (warningElement.parentNode) {
                    warningElement.parentNode.removeChild(warningElement);
                }
                
                container.querySelectorAll('.option-card, .custom-checkbox').forEach(card => {
                    card.classList.remove('validation-highlight');
                });
                
                return true;
            }
        },
        
        // Raccoglie dati dal form
        collectFormData() {
            const form = document.getElementById('projectConfigurator');
            return new FormData(form);
        },
        
        // Aggiorna il pannello risultato - VERSIONE OTTIMIZZATA
        updateResultPanel() {
            const price = ConfiguratorModel.calculateEstimate();
            const timeEstimate = ConfiguratorModel.getTimeEstimate();
            
            console.log("Generazione preventivo avviata. Prezzo:", price, "Tempo:", timeEstimate);
            
            // Verifica che l'elemento risultato esista
            const resultPanel = document.querySelector('.estimate-content');
            if (!resultPanel) {
                console.error("Elemento .estimate-content non trovato");
                return;
            }
            
            // Aggiungi animazione di loading
            resultPanel.innerHTML = `
                <div class="estimate-loading">
                    <div class="loader-dot"></div>
                    <div class="loader-dot"></div>
                    <div class="loader-dot"></div>
                </div>
            `;
            
            // Simula calcolo server-side con timeout ridotto (800ms invece di 1200ms)
            setTimeout(() => {
                try {
                    // Prepara descrizioni dettagliate
                    const typeDesc = ConfiguratorModel.pricing.descriptions.siteType[ConfiguratorModel.state.configData.siteType] || '';
                    const designDesc = ConfiguratorModel.pricing.descriptions.designStyle[ConfiguratorModel.state.configData.designStyle] || '';
                    const timelineDesc = ConfiguratorModel.pricing.descriptions.timeline[ConfiguratorModel.state.configData.timeline] || '';
                    
                    // Formatta le feature in gruppi logici
                    const featureGroups = {
                        'Funzionalità Base': ['responsive', 'contact', 'seo', 'analytics', 'social'],
                        'Contenuti & Design': ['gallery', 'animation', 'blog'],
                        'Funzionalità Avanzate': ['multilanguage', 'cms', 'newsletter']
                    };
                    
                    let featuresHtml = '';
                    
                    for (const [groupName, groupFeatures] of Object.entries(featureGroups)) {
                        const selectedFeatures = groupFeatures.filter(f => 
                            ConfiguratorModel.state.configData.features.includes(f)
                        );
                        
                        if (selectedFeatures.length > 0) {
                            featuresHtml += `<h4 class="feature-group">${groupName}</h4><ul class="feature-list">`;
                            
                            selectedFeatures.forEach(feature => {
                                // Traduci codici feature in etichette leggibili
                                const featureLabels = {
                                    responsive: 'Design Responsivo',
                                    gallery: 'Galleria Immagini',
                                    contact: 'Form di Contatto',
                                    seo: 'Ottimizzazione SEO',
                                    analytics: 'Google Analytics',
                                    blog: 'Sezione Blog',
                                    multilanguage: 'Supporto Multilingua',
                                    newsletter: 'Integrazione Newsletter',
                                    animation: 'Animazioni e Microinterazioni',
                                    social: 'Integrazione Social Media',
                                    cms: 'CMS Semplice'
                                };
                                
                                featuresHtml += `<li>${featureLabels[feature] || feature}</li>`;
                            });
                            
                            featuresHtml += `</ul>`;
                        }
                    }
                    
                    // Formatta il prezzo con separatore migliaia
                    const formattedPrice = new Intl.NumberFormat('it-IT', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(price);
                    
                    console.log("Prezzo formattato:", formattedPrice);
                    
                    // Crea risultato HTML
                    let resultHTML = `
                        <div class="result-header">
                            <h3 class="fade-in">La Tua Proposta Personalizzata</h3>
                            <div class="result-price fade-in">${formattedPrice}</div>
                        </div>
                        
                        <div class="result-overview fade-in">
                            <p>Questa proposta è basata sulle tue preferenze e rappresenta un punto di partenza per la nostra collaborazione.</p>
                        </div>
                        
                        <div class="result-details fade-in">
                            <div class="result-column">
                                <div class="result-item">
                                    <span class="result-label">Tipologia:</span>
                                    <span class="result-value">${ConfiguratorModel.state.configData.siteType || 'Non specificato'}</span>
                                    <p class="result-description">${typeDesc}</p>
                                </div>
                                
                                <div class="result-item">
                                    <span class="result-label">Design:</span>
                                    <span class="result-value">${ConfiguratorModel.state.configData.designStyle || 'Standard'}</span>
                                    <p class="result-description">${designDesc}</p>
                                </div>
                                
                                <div class="result-item">
                                    <span class="result-label">Tempistiche:</span>
                                    <span class="result-value">${ConfiguratorModel.state.configData.timeline || 'Standard'}</span>
                                    <p class="result-description">${timelineDesc}</p>
                                    <p class="time-estimate">Tempo stimato: ${timeEstimate.min}-${timeEstimate.max} settimane</p>
                                </div>
                            </div>
                            
                            <div class="result-column">
                                <div class="result-item features-section">
                                    <span class="result-label">Funzionalità:</span>
                                    ${featuresHtml || '<p>Nessuna funzionalità aggiuntiva selezionata</p>'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="result-note fade-in">
                            <p><strong>Nota:</strong> Questo preventivo è una stima indicativa basata sulle tue selezioni. Come studente di 17 anni appassionato di sviluppo web, offro soluzioni digitali di qualità a prezzi accessibili.</p>
                        </div>
                        
                        <div class="result-cta fade-in">
                            <div class="cta-buttons">
                                <a href="#contatti" class="btn btn-primary">Richiedi Consulenza Dettagliata</a>
                                <button class="btn btn-secondary restart-configurator">Riconfigura</button>
                            </div>
                        </div>
                    `;
                    
                    // Aggiorna con animazione di fade-in
                    resultPanel.innerHTML = resultHTML;
                    
                    console.log("HTML risultato generato con successo");
                    
                    // Attiva animazioni con delay progressivo
                    const animatedElements = document.querySelectorAll('.fade-in');
                    animatedElements.forEach((el, index) => {
                        setTimeout(() => {
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                        }, index * 150);
                    });
                    
                    // Aggiungi event listener al pulsante di restart
                    const restartButton = document.querySelector('.restart-configurator');
                    if (restartButton) {
                        restartButton.addEventListener('click', (e) => {
                            e.preventDefault();
                            ConfiguratorController.resetConfigurator();
                        });
                    }
                    
                    // Aggiungi event listener al pulsante di contatto
                    const contactButton = document.querySelector('.result-cta .btn-primary');
                    if (contactButton) {
                        contactButton.addEventListener('click', (e) => {
                            // Prepopola il form di contatto
                            const contactForm = document.getElementById('contactForm');
                            if (contactForm) {
                                // Seleziona tipologia progetto
                                const projectTypeSelect = contactForm.querySelector('#projectType');
                                if (projectTypeSelect) {
                                    const typeMapping = {
                                        'landing': 'landing',
                                        'website': 'business',
                                        'blog': 'blog',
                                        'portfolio': 'portfolio'
                                    };
                                    
                                    const typeValue = typeMapping[ConfiguratorModel.state.configData.siteType] || '';
                                    if (typeValue) {
                                        for (const option of projectTypeSelect.options) {
                                            if (option.value === typeValue) {
                                                option.selected = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                
                                // Seleziona budget
                                const budgetSelect = contactForm.querySelector('#budget');
                                if (budgetSelect) {
                                    let budgetValue;
                                    
                                    if (price < 300) budgetValue = 'low';
                                    else if (price < 400) budgetValue = 'medium';
                                    else budgetValue = 'high';
                                    
                                    for (const option of budgetSelect.options) {
                                        if (option.value === budgetValue) {
                                            option.selected = true;
                                            break;
                                        }
                                    }
                                }
                                
                                // Popola messaggio con dettagli progetto
                                const messageField = contactForm.querySelector('#message');
                                if (messageField) {
                                    const configDetails = `
Tipo di Progetto: ${ConfiguratorModel.state.configData.siteType}
Design: ${ConfiguratorModel.state.configData.designStyle}
Timeline: ${ConfiguratorModel.state.configData.timeline}
Funzionalità: ${ConfiguratorModel.state.configData.features.join(', ')}
Budget Stimato: ${formattedPrice}
                                    `;
                                    
                                    messageField.value = configDetails + "\n\nDettagli aggiuntivi sul progetto:";
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.error("Errore nella generazione del preventivo:", error);
                    
                    // In caso di errore, mostra un messaggio di fallback
                    resultPanel.innerHTML = `
                        <div class="error-message">
                            <h3>Si è verificato un errore</h3>
                            <p>Non è stato possibile generare il preventivo. Per favore riprova o contattami direttamente.</p>
                            <a href="#contatti" class="btn btn-primary">Contattami</a>
                        </div>
                    `;
                }
            }, 800); // Timeout ridotto a 800ms per un'esperienza più reattiva
        }
    };
    
    // Controller per il configuratore (logica di business)
    const ConfiguratorController = {
        init() {
            if (!ConfiguratorView.init()) {
                console.error('Failed to initialize configurator view');
                return false;
            }
            
            this.bindEvents();
            ConfiguratorView.showPanel(ConfiguratorModel.state.currentStep);
            console.log("Project configurator initialized");
            
            return true;
        },
        
        // Associa eventi agli elementi UI
        bindEvents() {
            // Pulsanti "Avanti"
            ConfiguratorView.elements.nextButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleNextButtonClick();
                });
            });
            
            // Pulsanti "Indietro"
            ConfiguratorView.elements.prevButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handlePrevButtonClick();
                });
            });
            
            // Pulsante "Salva" per richiedere consulenza
            if (ConfiguratorView.elements.submitButton) {
                ConfiguratorView.elements.submitButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Redirect alla sezione contatti
                    window.location.href = '#contatti';
                });
            }
            
            // Click sugli step per navigazione diretta
            ConfiguratorView.elements.steps.forEach(step => {
                step.addEventListener('click', (e) => {
                    e.preventDefault();
                    const stepNum = parseInt(step.getAttribute('data-step'));
                    this.handleStepClick(stepNum);
                });
            });
            
            // Gestione input siteType
            ConfiguratorView.elements.inputs.siteType.forEach(input => {
                input.addEventListener('change', () => {
                    this.handleInputChange();
                    
                    // Abilita il pulsante next al click su una opzione
                    const nextBtn = document.querySelector('.configurator-panel[data-panel="1"] .btn-next');
                    if (nextBtn) {
                        nextBtn.classList.add('btn-enabled');
                    }
                });
            });
            
            // Gestione input features
            ConfiguratorView.elements.inputs.features.forEach(input => {
                input.addEventListener('change', () => {
                    this.handleInputChange();
                    
                    // Conta quante features sono selezionate
                    const checkedFeatures = Array.from(ConfiguratorView.elements.inputs.features)
                        .filter(input => input.checked);
                    
                    // Abilita il pulsante next se almeno 2 features sono selezionate
                    const nextBtn = document.querySelector('.configurator-panel[data-panel="2"] .btn-next');
                    if (nextBtn) {
                        if (checkedFeatures.length >= 2) {
                            nextBtn.classList.add('btn-enabled');
                        } else {
                            nextBtn.classList.remove('btn-enabled');
                        }
                    }
                });
            });
            
            // Gestione input designStyle
            ConfiguratorView.elements.inputs.designStyle.forEach(input => {
                input.addEventListener('change', () => {
                    this.handleInputChange();
                    
                    // Abilita il pulsante next al click su una opzione
                    const nextBtn = document.querySelector('.configurator-panel[data-panel="3"] .btn-next');
                    if (nextBtn) {
                        nextBtn.classList.add('btn-enabled');
                    }
                });
            });
            
            // Gestione input timeline
            ConfiguratorView.elements.inputs.timeline.forEach(input => {
                input.addEventListener('change', () => {
                    this.handleInputChange();
                    
                    // Abilita il pulsante next al click su una opzione
                    const nextBtn = document.querySelector('.configurator-panel[data-panel="4"] .btn-next');
                    if (nextBtn) {
                        nextBtn.classList.add('btn-enabled');
                    }
                });
            });
            
            // Salva riferimento al form completo
            this.form = document.getElementById('projectConfigurator');
        },
        
        // Gestione cambio input
        handleInputChange() {
            const formData = ConfiguratorView.collectFormData();
            ConfiguratorModel.updateFromForm(formData);
            
            // Verifica validità del passo corrente
            ConfiguratorModel.validateCurrentStep();
        },
        
        // Gestione click su Avanti
        handleNextButtonClick() {
            // Verifica validità del passo corrente
            if (!ConfiguratorModel.validateCurrentStep()) {
                // Evidenzia campi non validi
                ConfiguratorView.highlightInvalidFields(ConfiguratorModel.state.currentStep);
                return;
            }
            
            // Passa al pannello successivo
            if (ConfiguratorModel.nextStep()) {
                ConfiguratorView.showPanel(ConfiguratorModel.state.currentStep);
                
                // Se è l'ultimo step, aggiorna il risultato
                if (ConfiguratorModel.state.currentStep === ConfiguratorModel.state.totalSteps) {
                    ConfiguratorView.updateResultPanel();
                }
            }
        },
        
        // Gestione click su Indietro
        handlePrevButtonClick() {
            if (ConfiguratorModel.prevStep()) {
                ConfiguratorView.showPanel(ConfiguratorModel.state.currentStep);
            }
        },
        
        // Gestione click su Step
        handleStepClick(stepNum) {
            // Permetti di tornare a step precedenti o al corrente
            if (stepNum <= ConfiguratorModel.state.currentStep) {
                ConfiguratorModel.goToStep(stepNum);
                ConfiguratorView.showPanel(ConfiguratorModel.state.currentStep);
            }
        },
        
        // Resetta il configuratore
        resetConfigurator() {
            ConfiguratorModel.reset();
            
            // Resetta tutti gli input
            if (this.form) {
                this.form.reset();
            }
            
            // Mostra il primo pannello
            ConfiguratorView.showPanel(ConfiguratorModel.state.currentStep);
            
            // Resetta stato bottoni
            document.querySelectorAll('.btn-next').forEach(btn => {
                btn.classList.remove('btn-enabled');
            });
        },
        
        // Esponi API pubblica
        getPublicAPI() {
            return {
                goToStep: (step) => {
                    ConfiguratorModel.goToStep(step);
                    ConfiguratorView.showPanel(ConfiguratorModel.state.currentStep);
                },
                calculateEstimate: () => {
                    return ConfiguratorModel.calculateEstimate();
                },
                getConfigData: () => {
                    return { ...ConfiguratorModel.state.configData };
                },
                reset: () => {
                    this.resetConfigurator();
                }
            };
        }
    };
    
    // Inizializza il configuratore quando il DOM è caricato
    document.addEventListener('DOMContentLoaded', () => {
        safeExecute(() => {
            if (ConfiguratorController.init()) {
                // Esponi API pubblica
                window.projectConfigurator = ConfiguratorController.getPublicAPI();
                
                // Debug helper
                window.debugConfiguratorEstimate = function() {
                    console.log("Debug del preventivo: ", ConfiguratorModel.state.configData);
                    console.log("Prezzo calcolato: ", ConfiguratorModel.calculateEstimate());
                };
            }
        });
    });
    
    // Funzione di utility per esecuzione sicura
    function safeExecute(fn, fallback = () => {}, ...args) {
        try {
            if (typeof fn === 'function') return fn(...args);
            return fallback(...args);
        } catch (error) {
            console.warn(`Errore nell'esecuzione del configuratore: ${error.message}`);
            return fallback(...args);
        }
    }
})();

/* Aggiungi questi stili CSS al tuo file style.css o crea un nuovo file CSS dedicato */
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se esiste già un tag style per questi stili
    if (!document.querySelector('style#configurator-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'configurator-styles';
        styleEl.textContent = `
            /* Animazioni più fluide per il pannello risultati */
            .estimate-content {
                transition: opacity 0.4s ease, transform 0.4s ease;
            }

            /* Miglioramenti per gli elementi animati */
            .fade-in {
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.5s ease, transform 0.5s ease;
            }

            /* Styling avanzato per il prezzo */
            .result-price {
                font-family: 'Poppins', sans-serif;
                font-weight: 700;
                font-size: 2.5rem;
                color: #00E0FF;
                margin: 1rem 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                display: inline-block;
                position: relative;
            }

            .result-price::after {
                content: '';
                position: absolute;
                bottom: -5px;
                left: 0;
                width: 40px;
                height: 3px;
                background: #00E0FF;
                border-radius: 2px;
            }

            /* Miglioramento dell'animazione di caricamento */
            .estimate-loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 120px;
            }

            .loader-dot {
                width: 12px;
                height: 12px;
                background: #00E0FF;
                border-radius: 50%;
                margin: 0 6px;
                animation: pulse 1.2s infinite ease-in-out;
            }

            .loader-dot:nth-child(2) {
                animation-delay: 0.2s;
            }

            .loader-dot:nth-child(3) {
                animation-delay: 0.4s;
            }

            @keyframes pulse {
                0%, 100% {
                    transform: scale(0.6);
                    opacity: 0.6;
                }
                50% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            /* Layout migliorato per i dettagli del preventivo */
            .result-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                margin: 2rem 0;
            }

            @media (max-width: 768px) {
                .result-details {
                    grid-template-columns: 1fr;
                }
            }

            /* Miglioramento dello stile degli elementi del preventivo */
            .result-item {
                margin-bottom: 1.5rem;
                padding-bottom: 1.5rem;
                border-bottom: 1px solid rgba(0, 224, 255, 0.1);
            }

            .result-label {
                font-weight: 500;
                color: #00E0FF;
                margin-right: 0.5rem;
            }

            .result-value {
                font-weight: 600;
                text-transform: capitalize;
            }

            .result-description {
                margin-top: 0.5rem;
                font-size: 0.9rem;
                line-height: 1.5;
                color: rgba(255, 255, 255, 0.8);
            }

            /* Stili per la lista delle funzionalità */
            .feature-group {
                font-size: 1rem;
                margin: 1.2rem 0 0.5rem;
                color: #00E0FF;
            }

            .feature-list {
                list-style-type: none;
                padding-left: 0;
                margin: 0;
            }

            .feature-list li {
                padding-left: 1.2rem;
                position: relative;
                margin-bottom: 0.4rem;
                font-size: 0.9rem;
            }

            .feature-list li::before {
                content: '';
                position: absolute;
                left: 0;
                top: 8px;
                width: 6px;
                height: 6px;
                background-color: #00E0FF;
                border-radius: 50%;
            }

            /* Stile per la nota informativa */
            .result-note {
                background: rgba(0, 224, 255, 0.05);
                border-left: 3px solid #00E0FF;
                padding: 1rem;
                margin: 1.5rem 0;
                border-radius: 0 4px 4px 0;
            }

            .result-note p {
                margin: 0;
                font-size: 0.9rem;
            }

            /* Miglioramento dei pulsanti CTA */
            .result-cta {
                margin-top: 2rem;
            }

            .cta-buttons {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }

            /* Stile per messaggi di errore */
            .error-message {
                background: rgba(255, 100, 100, 0.1);
                border-left: 3px solid #ff6464;
                padding: 1.5rem;
                border-radius: 0 4px 4px 0;
                text-align: center;
            }

            .error-message h3 {
                color: #ff6464;
                margin-top: 0;
            }

            .error-message .btn {
                margin-top: 1rem;
            }
        `;
        document.head.appendChild(styleEl);
    }
});


// Soluzione diretta da inserire alla fine del tuo file configurator.js
document.addEventListener('DOMContentLoaded', function() {
    // Aggiungi un listener al pulsante finale che attiva il pannello dei risultati
    const finalStepButtons = document.querySelectorAll('.configurator-panel[data-panel="4"] .btn-next');
    if (finalStepButtons.length) {
        finalStepButtons.forEach(button => {
            button.addEventListener('click', function() {
                setTimeout(function() {
                    // Ottieni direttamente l'elemento del contenuto
                    const resultContent = document.querySelector('.estimate-content');
                    if (resultContent) {
                        // Verifica se contiene solo i loader dots e il testo introduttivo
                        if (resultContent.querySelector('.estimate-loading')) {
                            console.log("Generazione diretta del preventivo");
                            
                            // Calcola il prezzo manualmente (versione semplificata)
                            const siteType = document.querySelector('input[name="siteType"]:checked')?.value || 'landing';
                            const designStyle = document.querySelector('input[name="designStyle"]:checked')?.value || 'minimal';
                            const timeline = document.querySelector('input[name="timeline"]:checked')?.value || 'standard';
                            
                            // Prezzi base
                            const basePrices = {
                                landing: 200,
                                website: 350,
                                blog: 280,
                                portfolio: 300
                            };
                            
                            // Calcola un prezzo approssimativo
                            let basePrice = basePrices[siteType] || 200;
                            let finalPrice = basePrice;
                            
                            // Aggiungi extra per funzionalità selezionate
                            const features = document.querySelectorAll('input[name="features"]:checked');
                            finalPrice += features.length * 30;
                            
                            // Aggiusta per il design
                            if (designStyle === 'creative') finalPrice *= 1.2;
                            if (designStyle === 'corporate') finalPrice *= 1.1;
                            
                            // Aggiusta per timeline
                            if (timeline === 'fast') finalPrice *= 1.3;
                            
                            // Arrotonda alle decine
                            finalPrice = Math.round(finalPrice / 10) * 10;
                            
                            // Formatta il prezzo
                            const formattedPrice = new Intl.NumberFormat('it-IT', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(finalPrice);
                            
                            // Genera HTML risultato direttamente
                            resultContent.innerHTML = `
                                <div class="result-header">
                                    <h3 class="fade-in" style="opacity: 1; transform: translateY(0);">La Tua Proposta Personalizzata</h3>
                                    <div class="result-price fade-in" style="opacity: 1; transform: translateY(0); font-weight: 700; font-size: 2.5rem; color: #00E0FF; margin: 1rem 0; display: inline-block;">${formattedPrice}</div>
                                </div>
                                
                                <div class="result-overview" style="opacity: 1; transform: translateY(0);">
                                    <p>Questa proposta è basata sulle tue preferenze e rappresenta un punto di partenza per la nostra collaborazione.</p>
                                </div>
                                
                                <div class="result-details" style="margin: 2rem 0; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; opacity: 1; transform: translateY(0);">
                                    <div class="result-column">
                                        <div class="result-item" style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(0, 224, 255, 0.1);">
                                            <span style="font-weight: 500; color: #00E0FF;">Tipologia:</span>
                                            <span style="font-weight: 600; text-transform: capitalize;">${siteType}</span>
                                        </div>
                                        
                                        <div class="result-item" style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(0, 224, 255, 0.1);">
                                            <span style="font-weight: 500; color: #00E0FF;">Design:</span>
                                            <span style="font-weight: 600; text-transform: capitalize;">${designStyle}</span>
                                        </div>
                                        
                                        <div class="result-item" style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(0, 224, 255, 0.1);">
                                            <span style="font-weight: 500; color: #00E0FF;">Tempistiche:</span>
                                            <span style="font-weight: 600; text-transform: capitalize;">${timeline}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="result-column">
                                        <div class="result-item" style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(0, 224, 255, 0.1);">
                                            <span style="font-weight: 500; color: #00E0FF;">Funzionalità:</span>
                                            <ul style="list-style-type: none; padding-left: 0; margin-top: 0.5rem;">
                                                ${Array.from(features).map(f => 
                                                    `<li style="padding-left: 1.2rem; position: relative; margin-bottom: 0.4rem;">${f.value}</li>`
                                                ).join('')}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="result-note" style="background: rgba(0, 224, 255, 0.05); border-left: 3px solid #00E0FF; padding: 1rem; margin: 1.5rem 0; border-radius: 0 4px 4px 0; opacity: 1; transform: translateY(0);">
                                    <p style="margin: 0; font-size: 0.9rem;"><strong>Nota:</strong> Questo preventivo è una stima indicativa basata sulle tue selezioni. Come studente di 17 anni appassionato di sviluppo web, offro soluzioni digitali di qualità a prezzi accessibili.</p>
                                </div>
                                
                                <div class="result-cta" style="margin-top: 2rem; opacity: 1; transform: translateY(0);">
                                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                        <a href="#contatti" class="btn btn-primary">Richiedi Consulenza Dettagliata</a>
                                        <button class="btn btn-secondary restart-configurator">Riconfigura</button>
                                    </div>
                                </div>
                            `;
                            
                            // Aggiungi event listener al pulsante di restart
                            const restartButton = resultContent.querySelector('.restart-configurator');
                            if (restartButton) {
                                restartButton.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    // Reset del form
                                    document.getElementById('projectConfigurator').reset();
                                    // Torna al primo step
                                    const firstPanel = document.querySelector('.configurator-panel[data-panel="1"]');
                                    if (firstPanel) {
                                        document.querySelectorAll('.configurator-panel').forEach(p => p.classList.remove('active'));
                                        firstPanel.classList.add('active');
                                    }
                                });
                            }
                        }
                    }
                }, 1500);
            });
        });
    }
});

// Inserisci questo codice alla fine del tuo file configurator.js
document.addEventListener('DOMContentLoaded', function() {
    // Intercetta il momento cruciale di transizione all'ultimo step
    const finalButtons = document.querySelectorAll('.configurator-panel[data-panel="4"] .btn-next');
    finalButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Attesa calibrata per il completamento dei calcoli
        setTimeout(function() {
          const estimateContent = document.querySelector('.estimate-content');
          if (estimateContent && estimateContent.querySelector('.estimate-loading')) {
            console.log("Intervento diretto di rendering");
            
            // Accesso diretto al canvas DOM
            document.querySelector('.estimate-content').innerHTML = `
              <div class="result-header">
                <h3 class="fade-in" style="opacity:1;transform:translateY(0)">La Tua Proposta Personalizzata</h3>
                <div class="result-price fade-in" style="opacity:1;transform:translateY(0);font-size:2.5rem;color:#00E0FF;font-weight:700;margin:1rem 0">
                  €${window.projectConfigurator.calculateEstimate()}
                </div>
              </div>
              
              <div class="result-overview fade-in" style="opacity:1;transform:translateY(0)">
                <p>Questa proposta è basata sulle tue preferenze e rappresenta un punto di partenza per la nostra collaborazione.</p>
              </div>
              
              <div class="result-cta fade-in" style="margin-top:2rem;opacity:1;transform:translateY(0)">
                <div style="display:flex;gap:1rem;flex-wrap:wrap">
                  <a href="#contatti" class="btn btn-primary">Richiedi Consulenza Dettagliata</a>
                  <button onclick="window.projectConfigurator.reset();return false" class="btn btn-secondary">Riconfigura</button>
                </div>
              </div>
            `;
          }
        }, 1000);
      });
    });
  });



// Soluzione Raffinata con Purificazione del Canvas
(function() {
    console.log("⚡ DevVision Canvas System - Inizializzazione");
    
    // Funzione di rendering con pulizia completa del canvas
    function renderPreventivo() {
      const renderID = "dvs-" + Math.random().toString(36).substring(2, 9);
      console.log(`🔄 Purificazione canvas e rendering con ID: ${renderID}`);
      
      // Selettore per il container principale
      const container = document.querySelector('.estimate-content');
      if (!container) {
        console.warn("⚠️ Canvas non trovato, nuovo tentativo programmato");
        return false;
      }
      
      // ⭐ PURIFICAZIONE DEL CANVAS - Rimozione completa di qualsiasi stato precedente
      container.innerHTML = ''; // Reset totale del canvas
      
      // Ricostruzione dell'interfaccia con estetica purificata
      container.innerHTML = `
        <div id="${renderID}-content" style="opacity:1!important;visibility:visible!important;display:block!important;">
          <h3 style="margin-bottom:1.5rem;color:#fff;font-size:1.8rem;font-weight:600;">La Tua Proposta Personalizzata</h3>
          
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:2.5rem;color:#00E0FF;margin:1.5rem 0;display:block;position:relative;">
            €${window.projectConfigurator ? window.projectConfigurator.calculateEstimate() : "350"}
            <span style="position:absolute;bottom:-5px;left:0;width:40px;height:3px;background:#00E0FF;border-radius:2px;"></span>
          </div>
          
          <p style="margin:1.5rem 0;font-size:1rem;line-height:1.6;color:rgba(255,255,255,0.8);">
            Questa proposta è basata sulle tue preferenze e rappresenta un punto di partenza per la nostra collaborazione.
          </p>
          
          <div style="margin:2rem 0;padding:1rem;background:rgba(0,224,255,0.05);border-left:3px solid #00E0FF;border-radius:0 4px 4px 0;">
            <p style="margin:0;font-size:0.9rem;line-height:1.5;">
              <strong>Nota:</strong> Questo preventivo è una stima indicativa basata sulle tue selezioni. Come studente di 17 anni appassionato di sviluppo web, offro soluzioni digitali di qualità a prezzi accessibili.
            </p>
          </div>
          
          <div style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap;">
            <a href="#contatti" class="btn btn-primary" style="display:inline-block;">Richiedi Consulenza Dettagliata</a>
            <button id="${renderID}-reset" class="btn btn-secondary" style="display:inline-block;">Riconfigura</button>
          </div>
        </div>
      `;
      
      // Event listener con riferimento diretto
      const resetButton = document.getElementById(`${renderID}-reset`);
      if (resetButton) {
        resetButton.addEventListener('click', function(e) {
          e.preventDefault();
          document.getElementById('projectConfigurator').reset();
          
          // Ritorno al primo pannello con transizione elegante
          const panels = document.querySelectorAll('.configurator-panel');
          panels.forEach(p => p.classList.remove('active'));
          const firstPanel = document.querySelector('.configurator-panel[data-panel="1"]');
          if (firstPanel) {
            firstPanel.classList.add('active');
            // Animazione di entrata raffinata
            setTimeout(() => {
              firstPanel.style.opacity = '1';
              firstPanel.style.transform = 'translateY(0)';
            }, 50);
          }
          
          // Aggiornamento armonioso degli indicatori di stato
          const steps = document.querySelectorAll('.step');
          steps.forEach(s => s.classList.remove('active', 'completed'));
          const firstStep = document.querySelector('.step[data-step="1"]');
          if (firstStep) firstStep.classList.add('active');
        });
      }
      
      console.log(`✅ Canvas purificato e rendering completato: ${renderID}`);
      return true;
    }
    
    // Sistema di persistenza orchestrato
    function initCanvasSystem() {
      console.log("🚀 Sistema Canvas attivato");
      
      // Intercettazione elegante dell'interazione utente
      const finalButtons = document.querySelectorAll('.configurator-panel[data-panel="4"] .btn-next');
      if (finalButtons.length) {
        finalButtons.forEach(button => {
          button.addEventListener('click', function() {
            console.log("🔍 Interazione finale intercettata");
            
            // Sequenza temporale coreografata per garantire l'eleganza visiva
            const timepoints = [600, 1200, 1800, 2400];
            timepoints.forEach(delay => {
              setTimeout(() => {
                if (document.querySelector('.estimate-loading')) {
                  console.log(`⏱️ Momento visivo a ${delay}ms - Purificazione necessaria`);
                  renderPreventivo(); // Purificazione e renderizzazione
                }
              }, delay);
            });
          });
        });
      }
      
      // Sistema di controllo armonico
      let cicliControllo = 0;
      const controlloMax = 12;
      const intervalloControllo = setInterval(() => {
        cicliControllo++;
        if (cicliControllo > controlloMax) {
          clearInterval(intervalloControllo);
          return;
        }
        
        // Verifica della presenza simultanea di stati dissonanti
        const panelFinale = document.querySelector('.configurator-panel[data-panel="5"].active');
        const loadingElement = document.querySelector('.estimate-loading');
        
        if (panelFinale && loadingElement) {
          console.log(`🔄 Controllo #${cicliControllo}: Rilevata dissonanza visiva - Intervento`);
          renderPreventivo(); // Purificazione e renderizzazione
        }
      }, 800);
    }
    
    // Inizializzazione con sincronizzazione al DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCanvasSystem);
    } else {
      initCanvasSystem();
    }
  })();