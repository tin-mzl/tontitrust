// =============================================================================
// ADMIN CONSOLE VIEWS (A-01 to A-08)
// PRD Reference: Section 6.10 & 14 (Administration, support et opérations)
// =============================================================================

import { store } from '../engine/store.js';
import { TontineManager } from '../engine/tontine-manager.js';
import { PaymentAdapter } from '../engine/payment-adapter.js';
import { formatCurrency, formatDateTime, formatDate, maskPhone, ActorType, TicketStatus } from '../engine/models.js';

export function renderAdminView(container) {
  let adminSection = 'dashboard'; // dashboard | users | tontines | transactions | payouts | audit | tickets

  function render() {
    const totalUsers = store.state.users.length;
    const totalTontines = store.state.tontines.length;
    const activeTontines = store.state.tontines.filter(t => t.status === 'ACTIVE').length;
    const totalVolume = store.state.transactions.filter(t => t.status === 'SUCCEEDED').reduce((acc, tx) => acc + tx.amount_minor, 0);
    const pendingTickets = store.state.supportTickets.filter(t => [TicketStatus.OPEN, TicketStatus.IN_REVIEW].includes(t.status)).length;

    container.innerHTML = `
      <div class="flex flex-col h-full bg-slate-100 min-h-[750px]">
        <!-- Admin Header -->
        <header class="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xs">
              🛡️
            </div>
            <div>
              <h2 class="text-sm font-bold text-white">Console Super-Admin & Audit</h2>
              <span class="text-[10px] text-slate-400 font-mono">Environnement Démo Pilote • TT-PRD-TSD-001</span>
            </div>
          </div>
          <button id="btn-admin-reset-db" class="px-2.5 py-1.5 bg-rose-900/80 hover:bg-rose-700 text-rose-200 border border-rose-600/40 rounded-xl text-[11px] font-bold transition">
            🔄 Réinitialiser Données
          </button>
        </header>

        <!-- Admin Navigation Tabs -->
        <div class="bg-white border-b border-slate-200 px-4 flex items-center gap-4 text-xs font-bold text-slate-500 overflow-x-auto">
          <button class="tab-btn py-3 border-b-2 ${adminSection === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'}" data-sec="dashboard">
            Dashboard
          </button>
          <button class="tab-btn py-3 border-b-2 ${adminSection === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'}" data-sec="users">
            Utilisateurs (${totalUsers})
          </button>
          <button class="tab-btn py-3 border-b-2 ${adminSection === 'tontines' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'}" data-sec="tontines">
            Tontines (${totalTontines})
          </button>
          <button class="tab-btn py-3 border-b-2 ${adminSection === 'transactions' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'}" data-sec="transactions">
            Rapprochement (A-04)
          </button>
          <button class="tab-btn py-3 border-b-2 ${adminSection === 'payouts' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'}" data-sec="payouts">
            Payouts (A-05)
          </button>
          <button class="tab-btn py-3 border-b-2 ${adminSection === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'}" data-sec="audit">
            Audit Trail (A-08)
          </button>
          <button class="tab-btn py-3 border-b-2 ${adminSection === 'tickets' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'}" data-sec="tickets">
            Tickets (${pendingTickets})
          </button>
        </div>

        <!-- Admin Content Area -->
        <main class="flex-1 p-4 overflow-y-auto space-y-4">
          ${renderAdminSection(adminSection, { totalUsers, totalTontines, activeTontines, totalVolume, pendingTickets })}
        </main>
      </div>
    `;

    attachAdminEvents();
  }

  function renderAdminSection(section, data) {
    if (section === 'dashboard') {
      return `
        <!-- KPI Cards Grid (PRD §15.2) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-500 font-bold uppercase">Volume Transigé</span>
            <div class="text-xl font-black text-slate-900 mt-1">${formatCurrency(data.totalVolume, 'CDF')}</div>
            <span class="text-[10px] text-emerald-600 font-bold">100% rapproché</span>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-500 font-bold uppercase">Tontines Actives</span>
            <div class="text-xl font-black text-blue-600 mt-1">${data.activeTontines} / ${data.totalTontines}</div>
            <span class="text-[10px] text-slate-400 font-semibold">Taux complétion 92%</span>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-500 font-bold uppercase">Comptes Utilisateurs</span>
            <div class="text-xl font-black text-slate-900 mt-1">${data.totalUsers}</div>
            <span class="text-[10px] text-emerald-600 font-bold">0 suspendus</span>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-500 font-bold uppercase">Incidents / Tickets</span>
            <div class="text-xl font-black ${data.pendingTickets > 0 ? 'text-amber-600' : 'text-slate-900'} mt-1">${data.pendingTickets}</div>
            <span class="text-[10px] text-slate-400">SLA < 1h respecté</span>
          </div>
        </div>

        <!-- Quick Actions & System Health -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Garde-fous & Sécurité Financière (SEC-001 à SEC-016)</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <span class="text-emerald-600 text-lg">🛡️</span>
              <div>
                <strong>Non-Dépôt Direct</strong>
                <p class="text-[11px] text-slate-500">Fonds routés via Mobile Money agréé</p>
              </div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <span class="text-emerald-600 text-lg">🔒</span>
              <div>
                <strong>Idempotence & RLS</strong>
                <p class="text-[11px] text-slate-500">Unicité des clés & isolation Postgres</p>
              </div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <span class="text-emerald-600 text-lg">📜</span>
              <div>
                <strong>Grand Livre Append-Only</strong>
                <p class="text-[11px] text-slate-500">Écritures comptables inaltérables</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (section === 'users') {
      return `
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div class="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="font-bold text-slate-900">Annuaire des Utilisateurs (A-02)</h3>
            <span class="text-slate-500">${store.state.users.length} comptes enregistrés</span>
          </div>
          <div class="divide-y divide-slate-100">
            ${store.state.users.map(u => `
              <div class="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <strong class="text-slate-900 block text-sm">${u.name}</strong>
                  <span class="text-slate-500 font-mono">${maskPhone(u.phone_e164)} • ${u.city || 'Kinshasa'}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="badge badge-${u.status.toLowerCase()}">${u.status}</span>
                  <span class="bg-blue-50 text-blue-800 px-2 py-1 rounded-lg font-bold text-[10px]">${u.role}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (section === 'tontines') {
      return `
        <div class="space-y-3 text-xs">
          ${store.state.tontines.map(t => {
            const org = store.state.users.find(u => u.id === t.organizer_id);
            return `
              <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="badge badge-${t.status.toLowerCase()}">${t.status}</span>
                    <span class="text-slate-400 font-mono text-[10px]">#${t.id.slice(0, 8)}</span>
                  </div>
                  <h4 class="font-black text-slate-900 text-sm">${t.name}</h4>
                  <p class="text-slate-500 mt-1">Organisateur : <strong>${org ? org.name : 'N/A'}</strong> • ${formatCurrency(t.amount_minor, t.currency)} / ${t.frequency}</p>
                </div>
                <div>
                  ${t.status === 'ACTIVE' ? `
                    <button class="btn-pause-tontine px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl transition" data-id="${t.id}">
                      Suspendre (BR-013)
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (section === 'transactions') {
      return `
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div class="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-slate-900">Rapprochement des Flux Financiers (A-04)</h3>
              <p class="text-[11px] text-slate-500">Comparaison temps réel entre le registre TontiTrust et les prestataires agrégateurs</p>
            </div>
            <span class="badge badge-active">100% Concordance</span>
          </div>
          <div class="divide-y divide-slate-100">
            ${store.state.transactions.map(tx => `
              <div class="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <strong class="text-slate-900 block">${formatCurrency(tx.amount_minor, tx.currency)}</strong>
                  <span class="text-slate-500 font-mono text-[11px]">Réf: ${tx.provider_reference} (${tx.provider})</span>
                </div>
                <div class="text-right">
                  <span class="badge badge-${tx.status.toLowerCase()}">${tx.status}</span>
                  <div class="text-[10px] text-slate-400 mt-1">${formatDateTime(tx.created_at)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (section === 'payouts') {
      return `
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div class="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="font-bold text-slate-900">Supervision des Versements / Payouts (A-05)</h3>
            <span class="text-slate-500">Règle d'unicité (BR-011)</span>
          </div>
          <div class="divide-y divide-slate-100">
            ${store.state.payouts.map(po => {
              const ben = store.state.users.find(u => u.id === po.beneficiary_id);
              return `
                <div class="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <strong class="text-emerald-700 block text-sm font-black">${formatCurrency(po.amount_minor, po.currency)}</strong>
                    <span class="text-slate-600">Bénéficiaire : <strong>${ben ? ben.name : 'Utilisateur'}</strong></span>
                    <div class="text-[11px] text-slate-400 font-mono mt-0.5">${po.provider_reference}</div>
                  </div>
                  <div class="text-right">
                    <span class="badge badge-${po.status.toLowerCase()}">${po.status}</span>
                    <div class="text-[10px] text-slate-400 mt-1">${formatDateTime(po.paid_at || po.created_at)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else if (section === 'audit') {
      return `
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div class="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-slate-900">Journal d'Audit Append-Only (A-08 & SEC-004)</h3>
              <p class="text-[11px] text-slate-500">Traçabilité complète, horodatée et inaltérable de chaque événement critique</p>
            </div>
            <button onclick="alert('Export JSON/CSV généré et audité avec succès (FR-REP-003).')" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
              Exporter Audit (CSV/JSON)
            </button>
          </div>
          <div class="divide-y divide-slate-100 font-mono text-[11px]">
            ${store.state.auditLogs.map(al => `
              <div class="p-3.5 hover:bg-slate-50 space-y-1">
                <div class="flex items-center justify-between">
                  <strong class="text-blue-900 font-bold">${al.action}</strong>
                  <span class="text-slate-400 text-[10px]">${formatDateTime(al.created_at)}</span>
                </div>
                <div class="text-slate-600">
                  Acteur : <strong class="text-slate-800">${al.actor_type}</strong> • Entité : <strong>${al.entity_type}:${al.entity_id.slice(0, 8)}</strong>
                </div>
                ${al.after_json ? `
                  <div class="p-2 bg-slate-900 text-slate-200 rounded-lg text-[10px] overflow-x-auto">
                    ${JSON.stringify(al.after_json)}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (section === 'tickets') {
      return `
        <div class="space-y-3 text-xs">
          ${store.state.supportTickets.map(tk => `
            <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div class="flex items-start justify-between">
                <div>
                  <span class="badge badge-${tk.status.toLowerCase()} mb-1">${tk.status}</span>
                  <h4 class="font-bold text-slate-900 text-sm">${tk.subject}</h4>
                  <p class="text-slate-500 mt-0.5">Catégorie : ${tk.category} • Priorité : <strong class="text-rose-600">${tk.priority}</strong></p>
                </div>
                <button class="btn-resolve-ticket px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition" data-id="${tk.id}">
                  Résoudre Ticket
                </button>
              </div>
              <p class="text-slate-700 bg-slate-50 p-3 rounded-2xl">${tk.description}</p>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  function attachAdminEvents() {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        adminSection = btn.dataset.sec;
        render();
      });
    });

    const resetBtn = container.querySelector('#btn-admin-reset-db');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Réinitialiser toutes les données de la démo à l\'état initial de seed ?')) {
          store.resetToSeed();
          render();
        }
      });
    }

    container.querySelectorAll('.btn-pause-tontine').forEach(btn => {
      btn.addEventListener('click', () => {
        const reason = prompt('Motif obligatoire pour la suspension (BR-018) :', 'Vérification de sécurité conservatoire');
        if (reason) {
          try {
            TontineManager.suspendTontine('admin001', btn.dataset.id, reason);
            render();
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });

    container.querySelectorAll('.btn-resolve-ticket').forEach(btn => {
      btn.addEventListener('click', () => {
        const ticket = store.state.supportTickets.find(t => t.id === btn.dataset.id);
        if (ticket) {
          ticket.status = TicketStatus.RESOLVED;
          store.logAudit(ActorType.ADMIN, 'support.ticket_resolved', 'support_ticket', ticket.id, null, { status: 'RESOLVED' });
          store.saveState();
          render();
        }
      });
    });
  }

  render();
}
