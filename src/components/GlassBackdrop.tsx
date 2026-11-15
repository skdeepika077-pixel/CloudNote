export function GlassBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#F2F0FF] via-[#EDE9FF] to-[#E9E5FF]"
    >
      {/* Upper-right soft lavender orb */}
      <div
        className="absolute -right-28 -top-28 h-[520px] w-[520px] rounded-full opacity-75 blur-[110px]"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(169, 155, 255, 0.72), rgba(120, 101, 232, 0.22) 65%, transparent 100%)',
        }}
      />

      {/* Bottom-left light purple orb */}
      <div
        className="absolute -bottom-36 -left-24 h-[540px] w-[540px] rounded-full opacity-70 blur-[115px]"
        style={{
          background:
            'radial-gradient(circle at 60% 45%, rgba(188, 173, 255, 0.65), rgba(120, 101, 232, 0.2) 60%, transparent 100%)',
        }}
      />

      {/* Very subtle cool blue ambient glow */}
      <div
        className="absolute left-1/2 top-1/3 h-[460px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(168, 206, 255, 0.48), rgba(214, 228, 255, 0.2) 55%, transparent 100%)',
        }}
      />
    </div>
  );
}
