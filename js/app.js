// =============================================================================
// MAIN APPLICATION ENTRYPOINT & COORDINATOR
// =============================================================================

import { store } from './engine/store.js';
import { renderAuthView } from './views/auth-view.js';
import { renderMemberView } from './views/member-view.js';
import { renderOrganizerView } from './views/organizer-view.js';
import { renderAdminView } from './views/admin-view.js';
import { DEMO_STEPS, DemoRunner } from './engine/demo-scenario.js';

class App {
  constructor() {
    this.viewport = document.getElementById('app-viewport');
    this.currentMode = 'member'; // member | organizer | admin | auth | demo
    this.currentDemoStep = 1;
    this.isFullFrame = false;

    this.init();
  }

  init() {
    this.setupGlobalControls();
    this.setupDemoTourControls();
    this.render();

    // Subscribe to store updates
    store.subscribe(() => {
      this.updatePersonaSelect();
      this.render();
    });
  }

  setupGlobalControls() {
    const personaSelect = document.getElementById('select-persona');
    if (personaSelect) {
      personaSelect.addEventListener('change', (e) => {
        store.setCurrentUser(e.target.value);
        if (['admin001', 'sup001'].includes(e.target.value)) {
          this.setMode('admin');
        } else if (e.target.value === 'u001') {
          this.setMode('organizer');
        } else {
          this.setMode('member');
        }
      });
    }

    const frameToggleBtn = document.getElementById('btn-toggle-frame');
    if (frameToggleBtn) {
      frameToggleBtn.addEventListener('click', () => {
        this.isFullFrame = !this.isFullFrame;
        this.viewport.classList.toggle('full-mode', this.isFullFrame);
      });
    }

    document.getElementById('btn-mode-member').addEventListener('click', () => this.setMode('member'));
    document.getElementById('btn-mode-organizer').addEventListener('click', () => this.setMode('organizer'));
    document.getElementById('btn-mode-admin').addEventListener('click', () => this.setMode('admin'));
    document.getElementById('btn-mode-demo').addEventListener('click', () => {
      const banner = document.getElementById('demo-tour-banner');
      banner.classList.toggle('hidden');
      this.setMode('demo');
      this.updateDemoStepUI();
    });
  }

  updatePersonaSelect() {
    const select = document.getElementById('select-persona');
    if (select && store.state.currentUser) {
      select.value = store.state.currentUser.id;
    }
  }

  setMode(mode) {
    this.currentMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('text-slate-400');
    });

    const activeBtn = document.getElementById(`btn-mode-${mode}`);
    if (activeBtn && mode !== 'demo') {
      activeBtn.classList.remove('text-slate-400');
      activeBtn.classList.add('bg-blue-600', 'text-white');
    }

    this.render();
  }

  setupDemoTourControls() {
    document.getElementById('btn-demo-prev').addEventListener('click', () => {
      if (this.currentDemoStep > 1) {
        this.currentDemoStep--;
        this.updateDemoStepUI();
      }
    });

    document.getElementById('btn-demo-next').addEventListener('click', () => {
      if (this.currentDemoStep < DEMO_STEPS.length) {
        this.currentDemoStep++;
        this.updateDemoStepUI();
      }
    });

    document.getElementById('btn-demo-action').addEventListener('click', () => {
      this.executeDemoStep(this.currentDemoStep);
    });
  }

  updateDemoStepUI() {
    const stepInfo = DEMO_STEPS.find(s => s.step === this.currentDemoStep);
    if (!stepInfo) return;

    document.getElementById('demo-step-badge').textContent = stepInfo.step;
    document.getElementById('demo-step-title').textContent = stepInfo.title;
    document.getElementById('demo-step-desc').textContent = stepInfo.description;
    document.getElementById('btn-demo-action').textContent = `Exécuter : ${stepInfo.actionName}`;

    const feedback = document.getElementById('demo-step-feedback');
    feedback.classList.add('hidden');
  }

  executeDemoStep(stepNum) {
    try {
      const res = DemoRunner.runStep(stepNum);
      const feedback = document.getElementById('demo-step-feedback');
      feedback.innerHTML = `✅ <strong>Étape ${stepNum} réussie :</strong> ${res.message}`;
      feedback.classList.remove('hidden');

      // Automatically adjust view mode for best visual experience
      if ([1, 2, 3, 4, 5].includes(stepNum)) {
        this.currentMode = 'organizer';
      } else if ([6, 7, 8].includes(stepNum)) {
        this.currentMode = 'member';
      } else if ([9, 10, 11].includes(stepNum)) {
        this.currentMode = 'admin';
      }

      this.render();
    } catch (err) {
      const feedback = document.getElementById('demo-step-feedback');
      feedback.innerHTML = `❌ <strong>Erreur à l'étape ${stepNum} :</strong> ${err.message}`;
      feedback.classList.remove('hidden');
    }
  }

  render() {
    this.viewport.innerHTML = '';

    if (this.currentMode === 'auth') {
      renderAuthView(this.viewport, (nextMode) => this.setMode(nextMode));
    } else if (this.currentMode === 'organizer') {
      renderOrganizerView(this.viewport);
    } else if (this.currentMode === 'admin') {
      renderAdminView(this.viewport);
    } else {
      // Default to member view
      renderMemberView(this.viewport, (mode) => this.setMode(mode));
    }
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.tontitrustApp = new App();
});
