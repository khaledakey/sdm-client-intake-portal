export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-midnight">
      <div className="hidden w-1/2 flex-col justify-between bg-[radial-gradient(ellipse_80%_60%_at_20%_20%,rgba(30,110,107,0.35)_0%,transparent_60%),radial-gradient(ellipse_60%_80%_at_80%_80%,rgba(45,172,114,0.2)_0%,transparent_60%)] p-14 lg:flex">
        <div>
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.6em] text-gold">SDM</p>
        </div>
        <div>
          <p className="font-label mb-6 text-xs uppercase tracking-[0.35em] text-cyan">
            Digital Marketing Partner
          </p>
          <h1 className="font-heading text-4xl font-semibold leading-tight text-white">
            Saoirse Digital
            <br />
            <span className="italic text-emerald">Marketing</span>
          </h1>
          <p className="mt-6 max-w-sm font-display text-lg italic text-mist">
            Your secure onboarding and support portal — a strategic digital marketing partner for
            Irish SMEs.
          </p>
        </div>
        <p className="font-label text-xs tracking-[0.3em] text-mist/60">CLIENT PORTAL</p>
      </div>
      <div className="flex w-full flex-1 items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
