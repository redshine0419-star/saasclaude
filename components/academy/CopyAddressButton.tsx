'use client';

export function CopyAddressButton({ address }: { address: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(address).catch(() => {})}
      className="h-11 px-4 rounded-[11px] border border-line bg-surface text-ink text-[14px] font-semibold cursor-pointer"
    >
      주소 복사
    </button>
  );
}
