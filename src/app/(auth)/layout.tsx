export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell" style={{ minHeight: '100vh' }}>
      <div className="auth-side">
        <div className="auth-brand">S &middot; D &middot; M</div>
        <div className="auth-headline">
          <div className="k1">DIGITAL MARKETING PARTNER</div>
          <h2>
            Saoirse Digital
            <br />
            <em>Marketing</em>
          </h2>
          <p>
            Your secure onboarding and support portal &mdash; a strategic digital marketing partner for
            Irish SMEs.
          </p>
        </div>
        <div className="auth-foot">CLIENT PORTAL</div>
      </div>
      <div className="auth-main">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
