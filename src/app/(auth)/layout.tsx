export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell" style={{ minHeight: '100vh' }}>
      <div className="auth-side">
        <a href="https://saoirsedigital.com" className="auth-brand">
          <img src="/assets/sdm-seal.png" alt="Saoirse Digital Marketing seal" />
          <span>
            <span className="auth-brand-name">SAOIRSE DIGITAL</span>
            <span className="auth-brand-sub">MARKETING &middot; IRELAND</span>
          </span>
        </a>
        <div className="auth-headline">
          <div className="k1">DIGITAL MARKETING PARTNER</div>
          <h2>
            Saoirse Digital
            <br />
            <em>Marketing</em>
          </h2>
          <p>
            Your secure onboarding and support portal, a strategic digital marketing partner for
            Irish SMEs.
          </p>
        </div>
        <div className="auth-foot">CLIENT PORTAL</div>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <a href="https://saoirsedigital.com" className="auth-card-brand">
            <img src="/assets/sdm-seal.png" alt="Saoirse Digital Marketing seal" />
            <span>
              <span className="auth-brand-name">SAOIRSE DIGITAL</span>
              <span className="auth-brand-sub">MARKETING &middot; IRELAND</span>
            </span>
          </a>
          {children}
        </div>
      </div>
    </div>
  );
}
