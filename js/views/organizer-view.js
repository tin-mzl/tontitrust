// =============================================================================
// ORGANIZER VIEWS (S-08, S-11, Lock & Activate)
// =============================================================================

import { store } from '../engine/store.js';
import { TontineManager } from '../engine/tontine-manager.js';
import { formatCurrency, formatDate, TontineStatus, MembershipStatus } from '../engine/models.js';

export function renderOrganizerView(container) {
  const currentUser = store.state.currentUser;
  let viewMode = 'list'; // list | create | manage
  let managedTontineId = null;

  // New Tontine Form State
  let formData = {
    name: 'Tontine Espoir',
    description: 'Épargne collective de quartier',
    amount_minor: 1000000, // 10,000 CDF
    currency: 'CDF',
    frequency: 'WEEKLY',
    member_limit: 6,
    grace_period_hours: 24,
    start_date: new Date().toISOString().split('T')[0],
    order_mode: 'MANUAL'
  };

  function render() {
    const organizedTontines = store.state.tontines.filter(t => t.organizer_id === currentUser.id);

    if (viewMode === 'list') {
      container.innerHTML = `
        <div class="p-4 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-black text-slate-900">Gestion Organisateur</h2>
              <p class="text-xs text-slate-500">Configurez et pilotez vos cercles d'épargne</p>
            </div>
            <button id="btn-start-create" class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md flex items-center gap-1.5 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Créer une tontine</span>
            </button>
          </div>

          <div class="space-y-3">
            ${organizedTontines.map(t => {
              const members = store.state.memberships.filter(m => m.tontine_id === t.id);
              const approvedCount = members.filter(m => ['APPROVED', 'ACTIVE'].includes(m.status)).length;
              const pendingCount = members.filter(m => m.status === MembershipStatus.PENDING).length;

              return `
                <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="badge badge-${t.status.toLowerCase()} mb-1">${t.status}</span>
                      <h3 class="font-bold text-slate-900 text-sm">${t.name}</h3>
                      <p class="text-xs text-slate-500 mt-0.5">${formatCurrency(t.amount_minor, t.currency)} • ${t.frequency}</p>
                    </div>
                    <div class="text-right">
                      <span class="text-xs font-bold text-slate-700">${approvedCount}/${t.member_limit} membres</span>
                      ${pendingCount > 0 ? `<div class="text-[10px] text-amber-600 font-bold mt-0.5">${pendingCount} en attente</div>` : ''}
                    </div>
                  </div>

                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button class="btn-manage-group text-xs text-blue-600 hover:text-blue-800 font-bold" data-id="${t.id}">
                      Gérer le groupe & l'ordre →
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      container.querySelector('#btn-start-create').addEventListener('click', () => {
        viewMode = 'create';
        render();
      });

      container.querySelectorAll('.btn-manage-group').forEach(btn => {
        btn.addEventListener('click', () => {
          managedTontineId = btn.dataset.id;
          viewMode = 'manage';
          render();
        });
      });
    } else if (viewMode === 'create') {
      const grossPot = (formData.amount_minor * formData.member_limit);

      container.innerHTML = `
        <div class="p-4 space-y-4">
          <button id="btn-back-list" class="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-medium mb-2">
            ← Annuler
          </button>
          
          <div>
            <h2 class="text-lg font-black text-slate-900">Créer une Tontine (S-08)</h2>
            <p class="text-xs text-slate-500">Définissez les règles et paramètres du groupe (BR-001 à BR-009)</p>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 uppercase mb-1">Nom de la Tontine</label>
              <input id="in-name" type="text" value="${formData.name}" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Cotisation unitaire (CDF)</label>
                <input id="in-amount" type="number" step="500" value="${formData.amount_minor / 100}" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Capacité (2 à 50)</label>
                <input id="in-limit" type="number" min="2" max="50" value="${formData.member_limit}" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Fréquence</label>
                <select id="in-freq" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold">
                  <option value="WEEKLY" ${formData.frequency === 'WEEKLY' ? 'selected' : ''}>Hebdomadaire</option>
                  <option value="BIWEEKLY" ${formData.frequency === 'BIWEEKLY' ? 'selected' : ''}>Bi-mensuelle</option>
                  <option value="MONTHLY" ${formData.frequency === 'MONTHLY' ? 'selected' : ''}>Mensuelle</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 uppercase mb-1">Période de grâce</label>
                <select id="in-grace" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold">
                  <option value="24">24 heures</option>
                  <option value="48">48 heures</option>
                  <option value="72">72 heures</option>
                </select>
              </div>
            </div>

            <!-- Preview Card (FR-GRP-002, US-004) -->
            <div class="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
              <span class="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Prévisualisation Financière</span>
              <div class="flex items-center justify-between mt-2">
                <div>
                  <span class="text-slate-500 block">Cagnotte par cycle :</span>
                  <strong class="text-blue-950 text-base font-extrabold">${formatCurrency(grossPot, 'CDF')}</strong>
                </div>
                <div>
                  <span class="text-slate-500 block">Nombre de cycles :</span>
                  <strong class="text-blue-950 text-base font-extrabold">${formData.member_limit} cycles</strong>
                </div>
              </div>
            </div>

            <button id="btn-save-draft" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-lg transition">
              Enregistrer et Ouvrir le Recrutement
            </button>
          </div>
        </div>
      `;

      container.querySelector('#btn-back-list').addEventListener('click', () => { viewMode = 'list'; render(); });
      container.querySelector('#btn-save-draft').addEventListener('click', () => {
        const name = container.querySelector('#in-name').value;
        const amount = parseFloat(container.querySelector('#in-amount').value) * 100;
        const limit = parseInt(container.querySelector('#in-limit').value, 10);
        const freq = container.querySelector('#in-freq').value;
        const grace = parseInt(container.querySelector('#in-grace').value, 10);

        try {
          const t = TontineManager.createDraftTontine(currentUser.id, {
            name,
            amount_minor: amount,
            currency: 'CDF',
            frequency: freq,
            member_limit: limit,
            grace_period_hours: grace,
            start_date: new Date().toISOString().split('T')[0]
          });
          TontineManager.publishTontine(t.id);
          alert('Tontine créée et ouverte au recrutement avec succès !');
          viewMode = 'list';
          render();
        } catch (err) {
          alert(err.message);
        }
      });
    } else if (viewMode === 'manage') {
      const tontine = store.state.tontines.find(t => t.id === managedTontineId);
      const members = store.state.memberships.filter(m => m.tontine_id === tontine.id);
      const invitation = store.state.invitations.find(i => i.tontine_id === tontine.id);

      container.innerHTML = `
        <div class="p-4 space-y-4">
          <button id="btn-back-list2" class="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-medium mb-1">
            ← Retour à mes groupes
          </button>

          <div class="flex items-start justify-between">
            <div>
              <span class="badge badge-${tontine.status.toLowerCase()} mb-1">${tontine.status}</span>
              <h2 class="text-lg font-black text-slate-900">${tontine.name}</h2>
              <p class="text-xs text-slate-500">Code d'invitation : <strong class="font-mono text-blue-600">${invitation ? invitation.code : 'N/A'}</strong></p>
            </div>
          </div>

          <!-- Members Management (S-11) -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div class="flex items-center justify-between text-xs">
              <h3 class="font-bold text-slate-800 uppercase">Participants (${members.length}/${tontine.member_limit})</h3>
              <span class="text-slate-500">Ordre de passage</span>
            </div>

            <div class="space-y-2">
              ${members.map((m, idx) => {
                const u = store.state.users.find(user => user.id === m.user_id);
                return `
                  <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">
                        ${m.position ? '#' + m.position : (idx + 1)}
                      </span>
                      <div>
                        <strong class="text-slate-900 block">${u ? u.name : 'Utilisateur'}</strong>
                        <span class="text-[10px] text-slate-500">${u ? u.phone_e164 : ''}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="badge badge-${m.status.toLowerCase()} text-[10px]">${m.status}</span>
                      ${m.status === 'PENDING' ? `
                        <button class="btn-approve-mem px-2 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px]" data-id="${m.id}">
                          Approuver
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            ${tontine.status === 'RECRUITING' ? `
              <div class="pt-3 border-t border-slate-100 space-y-2">
                <button id="btn-lock-tontine" class="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs transition">
                  🔒 Verrouiller la configuration et l'ordre (BR-004)
                </button>
              </div>
            ` : tontine.status === 'READY' ? `
              <div class="pt-3 border-t border-slate-100 space-y-2">
                <button id="btn-activate-tontine" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-lg transition">
                  🚀 Activer la tontine & Générer les cycles (BR-006)
                </button>
              </div>
            ` : `
              <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs text-emerald-800 font-bold">
                ✓ Tontine active et cycles en cours d'exécution.
              </div>
            `}
          </div>
        </div>
      `;

      container.querySelector('#btn-back-list2').addEventListener('click', () => { viewMode = 'list'; render(); });

      container.querySelectorAll('.btn-approve-mem').forEach(btn => {
        btn.addEventListener('click', () => {
          TontineManager.approveMembership(currentUser.id, btn.dataset.id);
          render();
        });
      });

      const lockBtn = container.querySelector('#btn-lock-tontine');
      if (lockBtn) {
        lockBtn.addEventListener('click', () => {
          try {
            TontineManager.lockTontine(currentUser.id, tontine.id);
            alert('Tontine verrouillée avec succès !');
            render();
          } catch (err) {
            alert(err.message);
          }
        });
      }

      const actBtn = container.querySelector('#btn-activate-tontine');
      if (actBtn) {
        actBtn.addEventListener('click', () => {
          try {
            TontineManager.activateTontine(tontine.id);
            alert('Tontine activée avec succès ! Tous les cycles ont été générés.');
            render();
          } catch (err) {
            alert(err.message);
          }
        });
      }
    }
  }

  render();
}
