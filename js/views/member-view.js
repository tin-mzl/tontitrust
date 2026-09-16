// =============================================================================
// MEMBER VIEWS (S-07, S-09, S-10, S-12, S-13, S-14, S-15, S-16, S-17, S-18, S-19)
// =============================================================================

import { store } from '../engine/store.js';
import { PaymentAdapter } from '../engine/payment-adapter.js';
import { TontineManager } from '../engine/tontine-manager.js';
import { formatCurrency, formatDate, formatDateTime, maskPhone, ContributionStatus } from '../engine/models.js';

export function renderMemberView(container, onNavigate) {
  const currentUser = store.state.currentUser;
  let activeTab = 'home'; // home, tontines, history, notifs, support
  let selectedTontineId = null;
  let modalState = null; // null | 'pay' | 'receipt' | 'join' | 'ticket'
  let modalData = null;

  function render() {
    // Filter user's memberships & tontines
    const userMemberships = store.state.memberships.filter(m => m.user_id === currentUser.id);
    const myTontineIds = userMemberships.map(m => m.tontine_id);
    const myTontines = store.state.tontines.filter(t => myTontineIds.includes(t.id) || t.organizer_id === currentUser.id);

    // Find active next contribution for currentUser
    let nextContribution = null;
    let nextCycle = null;
    let nextTontine = null;

    for (const t of myTontines) {
      if (t.status === 'ACTIVE') {
        const mem = userMemberships.find(m => m.tontine_id === t.id);
        if (mem) {
          const contrib = store.state.contributions.find(c => c.member_id === mem.id && [ContributionStatus.PENDING, ContributionStatus.OVERDUE].includes(c.status));
          if (contrib) {
            nextContribution = contrib;
            nextCycle = store.state.cycles.find(cy => cy.id === contrib.cycle_id);
            nextTontine = t;
            break;
          }
        }
      }
    }

    const unreadNotifsCount = store.state.notifications.filter(n => n.user_id === currentUser.id && !n.is_read).length;

    container.innerHTML = `
      <div class="flex flex-col h-full bg-slate-50 min-h-[750px]">
        <!-- Top App Bar -->
        <header class="bg-blue-900 text-white p-4 pt-6 shadow-md flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl overflow-hidden bg-blue-800 border-2 border-blue-400/30 flex items-center justify-center font-bold text-sm">
              <img src="./assets/logo.jpg" alt="TontiTrust" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='./public/logo.jpg'"/>
            </div>
            <div>
              <div class="text-xs font-semibold text-blue-200">Espace Membre</div>
              <div class="text-sm font-bold truncate max-w-[160px]">${currentUser.name}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-open-join" class="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 rounded-xl text-xs font-bold flex items-center gap-1 transition">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Rejoindre</span>
            </button>
            <button id="btn-tab-notifs" class="p-2 bg-blue-800/80 hover:bg-blue-700 rounded-xl relative transition">
              <svg class="w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              ${unreadNotifsCount > 0 ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-black flex items-center justify-center text-white">${unreadNotifsCount}</span>` : ''}
            </button>
          </div>
        </header>

        <!-- Main Body Content Area -->
        <main class="flex-1 p-4 overflow-y-auto space-y-4">
          ${renderTabContent(activeTab, { nextContribution, nextCycle, nextTontine, myTontines, userMemberships, selectedTontineId })}
        </main>

        <!-- Bottom Navigation Bar -->
        <nav class="bg-white border-t border-slate-200 py-2 px-3 flex items-center justify-around text-xs font-semibold text-slate-500">
          <button id="nav-home" class="flex flex-col items-center gap-1 p-1 ${activeTab === 'home' ? 'text-blue-600' : 'hover:text-slate-700'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span>Accueil</span>
          </button>
          <button id="nav-tontines" class="flex flex-col items-center gap-1 p-1 ${activeTab === 'tontines' ? 'text-blue-600' : 'hover:text-slate-700'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span>Mes Groupes</span>
          </button>
          <button id="nav-history" class="flex flex-col items-center gap-1 p-1 ${activeTab === 'history' ? 'text-blue-600' : 'hover:text-slate-700'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            <span>Reçus</span>
          </button>
          <button id="nav-support" class="flex flex-col items-center gap-1 p-1 ${activeTab === 'support' ? 'text-blue-600' : 'hover:text-slate-700'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <span>Support</span>
          </button>
        </nav>

        <!-- Modals Container -->
        <div id="modal-container">
          ${renderModal(modalState, modalData)}
        </div>
      </div>
    `;

    attachEvents();
  }

  function renderTabContent(tab, data) {
    if (tab === 'home') {
      return `
        <!-- Next Contribution Card -->
        ${data.nextContribution ? `
          <div class="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-3xl p-5 text-white shadow-xl">
            <div class="flex items-center justify-between text-xs text-blue-200">
              <span class="font-bold uppercase tracking-wider">Prochaine Échéance</span>
              <span class="bg-blue-500/30 px-2 py-0.5 rounded-full border border-blue-400/20">Cycle #${data.nextCycle.cycle_number}</span>
            </div>
            <div class="mt-2 text-3xl font-extrabold tracking-tight">
              ${formatCurrency(data.nextContribution.amount_due_minor, data.nextTontine.currency)}
            </div>
            <div class="mt-1 text-xs text-blue-200 flex items-center gap-1">
              <span>${data.nextTontine.name}</span> • <span>Échéance : ${formatDate(data.nextCycle.due_at)}</span>
            </div>

            <div class="mt-4 pt-3 border-t border-blue-400/20 flex items-center justify-between">
              <span class="badge ${data.nextContribution.status === 'OVERDUE' ? 'badge-overdue' : 'badge-pending'} text-[11px]">
                ${data.nextContribution.status === 'OVERDUE' ? '⚠️ Retard (Grâce active)' : '⏳ En attente'}
              </span>
              <button id="btn-pay-now" data-contrib-id="${data.nextContribution.id}" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                <span>Cotiser maintenant</span>
              </button>
            </div>
          </div>
        ` : `
          <div class="bg-white rounded-3xl p-5 text-center border border-slate-200 shadow-sm">
            <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 class="font-bold text-slate-800 text-sm">À jour de toutes vos cotisations !</h3>
            <p class="text-xs text-slate-500 mt-1">Aucun paiement en attente sur vos tontines actives.</p>
          </div>
        `}

        <!-- Active Groups List -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Mes Tontines Actives</h3>
            <span class="text-xs text-blue-600 font-bold">${data.myTontines.length} groupe(s)</span>
          </div>
          <div class="space-y-3">
            ${data.myTontines.map(t => {
              const mem = data.userMemberships.find(m => m.tontine_id === t.id);
              return `
                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition cursor-pointer card-tontine" data-id="${t.id}">
                  <div class="flex items-start justify-between">
                    <div>
                      <h4 class="font-bold text-slate-900 text-sm">${t.name}</h4>
                      <p class="text-xs text-slate-500 mt-0.5">${formatCurrency(t.amount_minor, t.currency)} • ${t.frequency}</p>
                    </div>
                    <span class="badge badge-${t.status.toLowerCase()}">${t.status}</span>
                  </div>
                  <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Position : <strong>${mem && mem.position ? '#' + mem.position : 'En attente'}</strong></span>
                    <span class="text-blue-600 font-bold">Voir détails →</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else if (tab === 'tontines') {
      const selectedT = store.state.tontines.find(t => t.id === selectedTontineId) || data.myTontines[0];
      if (!selectedT) return `<div class="p-6 text-center text-xs text-slate-500">Aucune tontine sélectionnée.</div>`;

      const cycles = store.state.cycles.filter(c => c.tontine_id === selectedT.id).sort((a, b) => a.cycle_number - b.cycle_number);
      const members = store.state.memberships.filter(m => m.tontine_id === selectedT.id);

      return `
        <div class="space-y-4">
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div class="flex items-start justify-between">
              <div>
                <span class="badge badge-${selectedT.status.toLowerCase()} mb-1">${selectedT.status}</span>
                <h2 class="text-lg font-extrabold text-slate-900">${selectedT.name}</h2>
                <p class="text-xs text-slate-500 mt-1">${selectedT.description || 'Groupe d\'épargne collective'}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
              <div class="bg-slate-50 p-3 rounded-xl">
                <span class="text-slate-500 block">Cotisation unitaire</span>
                <strong class="text-slate-800 text-sm font-bold">${formatCurrency(selectedT.amount_minor, selectedT.currency)}</strong>
              </div>
              <div class="bg-slate-50 p-3 rounded-xl">
                <span class="text-slate-500 block">Cagnotte par cycle</span>
                <strong class="text-emerald-700 text-sm font-bold">${formatCurrency(selectedT.amount_minor * selectedT.member_limit, selectedT.currency)}</strong>
              </div>
            </div>
          </div>

          <!-- Cycles & Schedule (S-12) -->
          <div>
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Calendrier des Cycles & Bénéficiaires</h3>
            <div class="space-y-2">
              ${cycles.map(c => {
                const benMem = members.find(m => m.id === c.beneficiary_membership_id);
                const benUser = benMem ? store.state.users.find(u => u.id === benMem.user_id) : null;
                const contribs = store.state.contributions.filter(ct => ct.cycle_id === c.id);
                const paidCount = contribs.filter(ct => ct.status === 'PAID').length;

                return `
                  <div class="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-xl font-black bg-blue-50 text-blue-800 flex items-center justify-center">
                        #${c.cycle_number}
                      </div>
                      <div>
                        <div class="font-bold text-slate-900">Bénéficiaire : ${benUser ? benUser.name : 'Attribué'}</div>
                        <div class="text-[11px] text-slate-500">Échéance : ${formatDate(c.due_at)} • Collecte : ${paidCount}/${contribs.length}</div>
                      </div>
                    </div>
                    <span class="badge badge-${c.status.toLowerCase()}">${c.status}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    } else if (tab === 'history') {
      const myTransactions = store.state.transactions.slice(0, 10);
      return `
        <div>
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Reçus et Historique Financier (FR-REP-001)</h3>
          <div class="space-y-3">
            ${myTransactions.map(tx => `
              <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-slate-900">${formatCurrency(tx.amount_minor, tx.currency)}</div>
                  <div class="text-[11px] text-slate-500 font-mono mt-0.5">${tx.provider_reference}</div>
                  <div class="text-[10px] text-slate-400 mt-1">${formatDateTime(tx.created_at)}</div>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <span class="badge badge-${tx.status.toLowerCase()}">${tx.status}</span>
                  <button class="btn-view-receipt text-blue-600 hover:text-blue-800 font-bold text-[11px]" data-tx-id="${tx.id}">
                    Voir reçu →
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (tab === 'support') {
      const tickets = store.state.supportTickets;
      return `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Tickets de Support (FR-SUP-001)</h3>
            <button id="btn-create-ticket" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">
              + Nouveau Ticket
            </button>
          </div>
          <div class="space-y-3">
            ${tickets.map(tk => `
              <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${tk.category}</span>
                    <h4 class="font-bold text-slate-900 text-sm mt-0.5">${tk.subject}</h4>
                  </div>
                  <span class="badge badge-${tk.status.toLowerCase()}">${tk.status}</span>
                </div>
                <p class="text-slate-600 mt-2">${tk.description}</p>
                <div class="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Ticket #${tk.id.slice(0, 8)}</span>
                  <span>${formatDate(tk.created_at)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  function renderModal(type, data) {
    if (!type) return '';

    if (type === 'pay') {
      return `
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div class="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 class="font-bold text-slate-900 text-sm">Règlement de cotisation</h3>
              <button class="btn-close-modal text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>
            <div>
              <span class="text-xs text-slate-500">Montant à verser</span>
              <div class="text-2xl font-black text-slate-900">${formatCurrency(data.contrib.amount_due_minor, 'CDF')}</div>
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-700 uppercase">Opérateur Mobile Money</label>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" class="btn-provider p-2.5 rounded-xl border-2 border-blue-600 bg-blue-50 font-bold text-xs text-blue-900" data-provider="M-PESA">M-Pesa</button>
                <button type="button" class="btn-provider p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700" data-provider="ORANGE_MONEY">Orange</button>
                <button type="button" class="btn-provider p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700" data-provider="AIRTEL_MONEY">Airtel</button>
              </div>
            </div>

            <div class="pt-3">
              <button id="btn-confirm-payment" data-contrib-id="${data.contrib.id}" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition">
                Confirmer le débit simulé
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (type === 'receipt') {
      return `
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div id="printable-receipt" class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-xs border border-slate-200">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center text-white font-black text-xs">TT</div>
                <div>
                  <h4 class="font-extrabold text-slate-900 text-sm">TONTITRUST</h4>
                  <span class="text-[10px] text-slate-500">Reçu Officiel de Paiement</span>
                </div>
              </div>
              <button class="btn-close-modal text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center">
              <span class="text-[10px] font-bold text-emerald-800 uppercase">Paiement Validé (SUCCEEDED)</span>
              <div class="text-2xl font-black text-emerald-800 my-1">${data.receipt.amount}</div>
              <span class="text-[10px] text-emerald-700 font-mono">${data.receipt.providerReference}</span>
            </div>

            <div class="space-y-2 text-slate-600">
              <div class="flex justify-between"><span>Groupe :</span> <strong class="text-slate-900">${data.receipt.tontineName}</strong></div>
              <div class="flex justify-between"><span>Cycle :</span> <strong class="text-slate-900">#${data.receipt.cycleNumber}</strong></div>
              <div class="flex justify-between"><span>Membre :</span> <strong class="text-slate-900">${data.receipt.memberName}</strong></div>
              <div class="flex justify-between"><span>Date :</span> <strong class="text-slate-900">${formatDateTime(data.receipt.date)}</strong></div>
            </div>

            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center gap-3">
              <div class="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-mono text-[9px] text-center p-1">
                QR CODE CERTIFIÉ
              </div>
              <div class="text-[10px] text-slate-500 leading-tight">
                Empreinte cryptographique immuable inscrite au registre TontiTrust.
              </div>
            </div>

            <div class="pt-2 flex gap-2">
              <button onclick="window.print()" class="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
                Imprimer / PDF
              </button>
              <button class="btn-close-modal px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">
                Fermer
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (type === 'join') {
      return `
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 class="font-bold text-slate-900 text-sm">Rejoindre une Tontine (S-10)</h3>
              <button class="btn-close-modal text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Code d'invitation</label>
              <input id="input-join-code" type="text" placeholder="Ex: MATONGE26 ou GOMBE2026" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl uppercase font-mono font-bold text-sm focus:ring-2 focus:ring-blue-600" />
            </div>
            <div class="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600">
              🔒 En soumettant votre adhésion, vous acceptez expressément le règlement du groupe et le calendrier de rotation.
            </div>
            <button id="btn-submit-join" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition">
              Soumettre la demande
            </button>
          </div>
        </div>
      `;
    }

    return '';
  }

  function attachEvents() {
    container.querySelectorAll('#nav-home, #nav-tontines, #nav-history, #nav-support').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.id.replace('nav-', '');
        activeTab = id;
        render();
      });
    });

    const openJoinBtn = container.querySelector('#btn-open-join');
    if (openJoinBtn) {
      openJoinBtn.addEventListener('click', () => {
        modalState = 'join';
        render();
      });
    }

    const payBtn = container.querySelector('#btn-pay-now');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        const contribId = payBtn.dataset.contribId;
        const contrib = store.state.contributions.find(c => c.id === contribId);
        modalState = 'pay';
        modalData = { contrib };
        render();
      });
    }

    container.querySelectorAll('.card-tontine').forEach(card => {
      card.addEventListener('click', () => {
        selectedTontineId = card.dataset.id;
        activeTab = 'tontines';
        render();
      });
    });

    container.querySelectorAll('.btn-view-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        const txId = btn.dataset.txId;
        const tx = store.state.transactions.find(t => t.id === txId);
        const contrib = store.state.contributions.find(c => c.id === tx.contribution_id);
        const cycle = store.state.cycles.find(cy => cy.id === contrib.cycle_id);
        const tontine = store.state.tontines.find(t => t.id === cycle.tontine_id);
        const receipt = PaymentAdapter.generateReceipt(tx, contrib, cycle, tontine);
        modalState = 'receipt';
        modalData = { receipt };
        render();
      });
    });

    container.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        modalState = null;
        modalData = null;
        render();
      });
    });

    const confirmPayBtn = container.querySelector('#btn-confirm-payment');
    if (confirmPayBtn) {
      confirmPayBtn.addEventListener('click', () => {
        const contribId = confirmPayBtn.dataset.contribId;
        const res = PaymentAdapter.initiateContributionPayment(contribId, 'M-PESA', null, true);
        modalState = 'receipt';
        modalData = { receipt: res.receipt };
        render();
      });
    }

    const submitJoinBtn = container.querySelector('#btn-submit-join');
    if (submitJoinBtn) {
      submitJoinBtn.addEventListener('click', () => {
        const code = container.querySelector('#input-join-code').value.trim().toUpperCase();
        const inv = store.state.invitations.find(i => i.code === code);
        if (inv) {
          try {
            TontineManager.requestMembership(inv.tontine_id, currentUser.id, currentUser.phone_e164);
            alert('Demande d\'adhésion transmise à l\'organisateur avec succès !');
            modalState = null;
            render();
          } catch (err) {
            alert(err.message);
          }
        } else {
          alert('Code d\'invitation invalide ou expiré.');
        }
      });
    }
  }

  render();
}
