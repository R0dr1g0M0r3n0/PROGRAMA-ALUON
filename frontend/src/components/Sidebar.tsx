import logo from '../assets/logo.png';

interface NavItemProps {
  label:  string;
  active?: boolean;
  icon:   React.ReactNode;
}

const NavItem = ({ label, active, icon }: NavItemProps) => (
  <a href="#" className={`nav-item ${active ? 'nav-item-active' : ''}`}>
    <span className={`icon-box ${active ? 'icon-box-active' : ''}`}>{icon}</span>
    {label}
  </a>
);

const Sidebar = () => (
  <aside
    className="w-64 min-h-screen flex flex-col flex-shrink-0"
    style={{ background: 'linear-gradient(180deg,#0d1117 0%,#161b22 100%)', boxShadow: '4px 0 24px rgba(0,0,0,0.22)' }}
  >
    {/* Logo */}
    <div className="px-5 py-6" style={{ borderBottom: '1px solid #21262d' }}>
      <div className="h-14 flex items-center justify-center">
        <img src={logo} alt="Aluon" className="max-h-11 w-auto object-contain brightness-110" />
      </div>
    </div>

    {/* Nav label */}
    <div className="px-4 pt-6 pb-1">
      <span style={{ color: '#484f58', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Módulos</span>
    </div>

    <nav className="flex-1 px-3 space-y-1">
      <NavItem label="Dashboard" icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      } />
      <NavItem label="Clientes (CRM)" active icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      } />
      <NavItem label="Órdenes de trabajo" icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      } />

      <div className="pt-5 pb-1 px-1">
        <span style={{ color: '#484f58', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Sistema</span>
      </div>
      <NavItem label="Ajustes" icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      } />
    </nav>

    {/* CTA */}
    <div className="p-4">
      <button className="btn-primary w-full justify-center text-xs tracking-widest py-4 rounded-xl">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        NUEVA ORDEN
      </button>
    </div>
  </aside>
);

export default Sidebar;
