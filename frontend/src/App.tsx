import Sidebar from './components/Sidebar';
import CustomerManagement from './pages/CustomerManagement';

const App = () => (
  <div className="flex min-h-screen font-sans" style={{ backgroundColor: '#f8f9fb' }}>
    <Sidebar />

    <div className="flex-1 flex flex-col min-w-0">
      {/* Topbar */}
      <header
        className="h-16 flex-shrink-0 flex items-center justify-between px-8 sticky top-0 z-30"
        style={{ background: '#ffffff', borderBottom: '1px solid #e8eaed' }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
          <span style={{ color: '#8b949e' }}>ALUON</span>
          <span style={{ color: '#8b949e' }}>/</span>
          <span style={{ color: '#0d1117' }}>Clientes (CRM)</span>
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
            style={{ color: '#0d1117' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fb')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
              style={{ backgroundColor: '#e5534b', boxShadow: '0 2px 8px rgba(229,83,75,0.30)' }}
            >
              RA
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-black uppercase leading-tight" style={{ color: '#0d1117' }}>Pedro Aluon</div>
              <div className="text-xs font-semibold uppercase" style={{ color: '#8b949e', fontSize: 10 }}>SuperAdmin</div>
            </div>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8b949e' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-screen-xl mx-auto animate-fade-up">
          <CustomerManagement />
        </div>
      </main>
    </div>
  </div>
);

export default App;
