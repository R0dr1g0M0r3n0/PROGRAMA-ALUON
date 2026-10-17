import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import Sidebar, { ModuleKey } from './components/Sidebar';
import { JiraFloatingButton } from './features/jira-shortcut/JiraFloatingButton';
import { onNavigateToDocument, onNavigateToModule } from './services/moduleNavigation';
import { onBudgetWizardLaunch, startBudgetWizard } from './features/budget-wizard/services/budgetWizardLaunch';
import { loadCurrentStaff, StaffUser } from './services/staffAuthApi';

const CustomerManagement = lazy(() => import('./features/customer-management/CustomerManagement'));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const AdminManagement = lazy(() => import('./features/admin-management/AdminManagement'));
const WorkOrders = lazy(() => import('./features/work-orders/WorkOrders'));
const RegistrationRequests = lazy(() => import('./features/registration-requests/RegistrationRequests'));
const Settings = lazy(() => import('./features/settings/Settings'));
const Cutlist = lazy(() => import('./features/cutlist/Cutlist'));
const BudgetWizard = lazy(() => import('./features/budget-wizard/BudgetWizard').then(module => ({ default: module.BudgetWizard })));
const DoorVisualSimulation = lazy(() => import('./features/door-visual-simulation/DoorVisualSimulation').then(module => ({ default: module.DoorVisualSimulation })));
const ProjectManagement = lazy(() => import('./features/project-management/ProjectManagement').then(module => ({ default: module.ProjectManagement })));
const OrderConfigurator = lazy(() => import('./features/order-configurator/OrderConfigurator'));
const StaffLoginPanel = lazy(() => import('./components/StaffLoginPanel'));

const App = () => {
  const [activeModule, setActiveModule] = useState<ModuleKey>('clientes');
  const [openNewRequest, setOpenNewRequest] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [budgetWizardSessionKey, setBudgetWizardSessionKey] = useState(0);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    loadCurrentStaff().then(setStaffUser).catch(() => setStaffUser(null));
  }, []);

  useEffect(() => onNavigateToModule(setActiveModule), []);
  useEffect(() => onNavigateToDocument((documentId) => {
    setActiveModule('gestion-documentos');
    setPendingDocumentId(documentId);
  }), []);
  useEffect(() => onBudgetWizardLaunch(() => {
    setBudgetWizardSessionKey(session => session + 1);
  }), []);

  const handleSelectModule = (module: ModuleKey) => {
    if (module === 'presupuestos') {
      startBudgetWizard();
      setActiveModule('presupuestos');
      return;
    }
    setActiveModule(module);
  };

  const breadcrumb = useMemo(() => {
    switch (activeModule) {
      case 'ordenes':
        return 'Órdenes de trabajo';
      case 'dashboard':
        return 'Dashboard';
      case 'gestion-documentos':
        return 'Gestión Documentos';
      case 'despiece':
        return 'Despiece';
      case 'presupuestos':
        return 'Presupuestos';
      case 'configurador':
        return 'Configurador de pedidos';
      case 'simulacion-puertas':
        return 'Simulación Visual de Puertas';
      case 'inscripciones':
        return 'Inscripciones Pendientes';
      case 'ajustes':
        return 'Ajustes';
      case 'administracion':
        return 'Administración';
      case 'clientes':
      default:
        return 'Clientes (CRM)';
    }
  }, [activeModule]);

  return (
    <div className="aluon-app flex h-screen overflow-hidden" style={{ backgroundColor: '#f8f9fb' }}>
      <Sidebar
        activeModule={activeModule}
        onSelect={handleSelectModule}
        onNewOrder={() => {
          setActiveModule('ordenes');
          setOpenNewRequest(true);
        }}
        isOpen={sidebarOpen}
      />

      <div id="main-layout" className="flex-1 flex flex-col min-w-0 relative">
        <div className="fixed left-0 top-0 h-full w-3 z-40" />
        {/* Topbar */}
        <header
          className="h-16 flex-shrink-0 flex items-center justify-between px-8 sticky top-0 z-30"
          style={{ background: '#ffffff', borderBottom: '1px solid #e8eaed' }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
            <button
              type="button"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ color: '#8b949e' }}
              onClick={() => setSidebarOpen(prev => !prev)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f8f9fb';
                (e.currentTarget as HTMLButtonElement).style.color = '#0d1117';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#8b949e';
              }}
              aria-label={sidebarOpen ? 'Ocultar sidebar' : 'Mostrar sidebar'}
              title={sidebarOpen ? 'Ocultar sidebar' : 'Mostrar sidebar'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span style={{ color: '#8b949e' }}>ALUON</span>
            <span style={{ color: '#8b949e' }}>/</span>
            <span style={{ color: '#0d1117' }}>{breadcrumb}</span>
          </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Notificaciones"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200"
            style={{ color: '#8b949e' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f8f9fb';
              (e.currentTarget as HTMLButtonElement).style.color = '#0d1117';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#8b949e';
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full ring-2 ring-white" />
          </button>

          <div className="w-px h-6" style={{ backgroundColor: '#e8eaed' }} />

          <button className="flex items-center gap-2.5 px-2 py-1 rounded-xl transition-all duration-200 group"
            onClick={() => setLoginOpen(true)}
            style={{ color: '#0d1117' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fb')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
              style={{ backgroundColor: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-shadow-soft)' }}
            >
              {staffUser ? `${staffUser.nombre?.[0] || ''}${staffUser.apellidos?.[0] || ''}` : 'LO'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-black uppercase leading-tight" style={{ color: '#0d1117' }}>{staffUser ? `${staffUser.nombre} ${staffUser.apellidos}` : 'Modo local'}</div>
              <div className="text-xs font-semibold uppercase" style={{ color: '#8b949e', fontSize: 10 }}>{staffUser?.role || 'Sin sesión'}</div>
            </div>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8b949e' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </header>

        {/* Content */}
        <main className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="w-full p-3 md:p-4 animate-fade-up flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">
            <Suspense fallback={<div className="flex min-h-48 items-center justify-center text-sm font-semibold text-slate-500">Cargando módulo…</div>}>
            {activeModule === 'clientes' && <CustomerManagement />}
            {activeModule === 'gestion-documentos' && (
              <ProjectManagement
                openRowId={pendingDocumentId}
                onOpenRowHandled={() => setPendingDocumentId(null)}
              />
            )}
            {activeModule === 'simulacion-puertas' && <DoorVisualSimulation />}
            {activeModule === 'presupuestos' && <BudgetWizard key={budgetWizardSessionKey} />}
            {activeModule === 'configurador' && <OrderConfigurator />}
            {activeModule === 'inscripciones' && <RegistrationRequests />}
            {activeModule === 'ordenes' && (
              <WorkOrders
                openNewRequest={openNewRequest}
                onNewRequestHandled={() => setOpenNewRequest(false)}
              />
            )}
            {activeModule === 'despiece' && <Cutlist />}
            {activeModule === 'dashboard' && <Dashboard />}
            {activeModule === 'ajustes' && <Settings />}
            {activeModule === 'administracion' && <AdminManagement />}
            </Suspense>
          </div>
        </main>

        <JiraFloatingButton moduleKey={activeModule} moduleLabel={breadcrumb} />
      </div>

      {loginOpen && (
        <Suspense fallback={null}>
          <StaffLoginPanel
            onAuthenticated={setStaffUser}
            onClose={() => setLoginOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default App;
