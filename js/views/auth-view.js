// =============================================================================
// AUTH & ONBOARDING VIEWS (S-01 to S-06)
// =============================================================================

import { store } from '../engine/store.js';
import { UserStatus, ActorType } from '../engine/models.js';

export function renderAuthView(container, onLoginSuccess) {
  let step = 'welcome'; // welcome, phone, otp, profile, consents
  let enteredPhone = '+243900000001';
  let generatedOtp = '123456';

  function render() {
    if (step === 'welcome') {
      container.innerHTML = `
        <div class="p-6 flex flex-col items-center justify-between h-full min-h-[600px] text-center">
          <div class="pt-8">
            <div class="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden shadow-xl border-4 border-blue-100 flex items-center justify-center bg-blue-900">
              <img src="./assets/logo.jpg" alt="TontiTrust" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='./public/logo.jpg'"/>
            </div>
            <h1 class="text-3xl font-extrabold text-blue-950 tracking-tight">TontiTrust</h1>
            <p class="text-xs font-semibold text-blue-600 uppercase tracking-widest mt-1">Infrastructure de Confiance</p>
            <p class="text-sm text-slate-600 mt-4 max-w-xs leading-relaxed">
              Modernisez vos tontines d'épargne collective en Afrique en toute transparence, sécurité et traçabilité.
            </p>
          </div>

          <div class="w-full space-y-3 pb-8">
            <button id="btn-start-login" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition transform active:scale-98 flex items-center justify-center gap-2">
              <span>Se Connecter / S'inscrire</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
            <button id="btn-quick-admin" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition">
              Accès Super-Administrateur / Audit
            </button>
          </div>
        </div>
      `;

      container.querySelector('#btn-start-login').addEventListener('click', () => {
        step = 'phone';
        render();
      });

      container.querySelector('#btn-quick-admin').addEventListener('click', () => {
        store.setCurrentUser('admin001');
        if (onLoginSuccess) onLoginSuccess('admin');
      });
    } else if (step === 'phone') {
      container.innerHTML = `
        <div class="p-6 flex flex-col justify-between h-full min-h-[500px]">
          <div>
            <button id="btn-back-welcome" class="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1 text-sm font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              Retour
            </button>
            <h2 class="text-2xl font-bold text-slate-900">Numéro de téléphone</h2>
            <p class="text-xs text-slate-500 mt-1">Saisissez votre numéro au format international (+243...) pour recevoir le code OTP.</p>
            
            <div class="mt-6">
              <label class="block text-xs font-bold text-slate-700 uppercase mb-2">Téléphone Mobile Money</label>
              <div class="relative">
                <input id="input-phone" type="tel" value="${enteredPhone}" class="w-full px-4 py-3.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-lg font-semibold tracking-wide" placeholder="+243 900 000 001" />
              </div>
              <div class="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                💡 <strong>Numéros de test démo :</strong><br/>
                • Organisateur : <code>+243 900 000 001</code><br/>
                • Membres : <code>+243 900 000 002</code> à <code>004</code>
              </div>
            </div>
          </div>

          <div class="pt-6">
            <button id="btn-send-otp" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition">
              Recevoir mon code OTP
            </button>
          </div>
        </div>
      `;

      container.querySelector('#btn-back-welcome').addEventListener('click', () => { step = 'welcome'; render(); });
      container.querySelector('#btn-send-otp').addEventListener('click', () => {
        enteredPhone = container.querySelector('#input-phone').value.trim();
        step = 'otp';
        render();
      });
    } else if (step === 'otp') {
      container.innerHTML = `
        <div class="p-6 flex flex-col justify-between h-full min-h-[500px]">
          <div>
            <button id="btn-back-phone" class="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1 text-sm font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              Modifier le numéro
            </button>
            <h2 class="text-2xl font-bold text-slate-900">Vérification OTP</h2>
            <p class="text-xs text-slate-500 mt-1">Code à 6 chiffres envoyé au <strong class="text-slate-800">${enteredPhone}</strong></p>

            <div class="my-8">
              <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center mb-6">
                <span class="text-xs font-semibold text-emerald-800 uppercase tracking-wider">SMS Reçu (Simulateur)</span>
                <div class="text-3xl font-black text-emerald-700 tracking-widest my-1">${generatedOtp}</div>
                <span class="text-[11px] text-emerald-600">Valide pendant 10 minutes (FR-AUTH-001)</span>
              </div>

              <label class="block text-xs font-bold text-slate-700 uppercase mb-2 text-center">Entrez le code OTP</label>
              <input id="input-otp" type="text" maxlength="6" value="${generatedOtp}" class="w-full text-center tracking-widest text-2xl font-bold px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-600" />
            </div>
          </div>

          <div class="pt-4">
            <button id="btn-verify-otp" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition">
              Valider et Continuer
            </button>
          </div>
        </div>
      `;

      container.querySelector('#btn-back-phone').addEventListener('click', () => { step = 'phone'; render(); });
      container.querySelector('#btn-verify-otp').addEventListener('click', () => {
        // Authenticate or find user
        let user = store.state.users.find(u => u.phone_e164.replace(/\s+/g, '') === enteredPhone.replace(/\s+/g, ''));
        if (!user) {
          user = {
            id: 'u_' + Date.now(),
            phone_e164: enteredPhone,
            name: 'Nouvel Utilisateur',
            city: 'Kinshasa',
            role: 'MEMBER',
            status: UserStatus.ACTIVE,
            kycLevel: 1
          };
          store.state.users.push(user);
        }
        store.setCurrentUser(user.id);
        store.logAudit(ActorType.USER, 'user.authenticated', 'user', user.id, null, { phone: enteredPhone });
        if (onLoginSuccess) onLoginSuccess('member');
      });
    }
  }

  render();
}
