export default function AdBannerMock({ size = 'rectangle' }: { size?: 'rectangle' | 'leaderboard' | 'square' }) {
  const dims = {
    rectangle: 'w-full h-[90px]',
    leaderboard: 'w-full h-[60px]',
    square: 'w-full h-[250px]',
  };

  return (
    <div
      className={`${dims[size]} flex flex-col items-center justify-center rounded-xl border`}
      style={{ backgroundColor: 'rgba(212,168,67,0.05)', borderColor: 'rgba(212,168,67,0.2)', borderStyle: 'dashed' }}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--gold-dark)' }}>
        Advertisement
      </span>
      <span className="text-xs mt-1" style={{ color: 'var(--cream-muted)' }}>
        Google AdSense {size === 'rectangle' ? '(728×90)' : size === 'square' ? '(300×250)' : '(320×50)'}
      </span>
    </div>
  );
}
