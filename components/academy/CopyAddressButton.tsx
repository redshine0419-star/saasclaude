'use client';

export function CopyAddressButton({ address }: { address: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(address).catch(() => {})}
      className="h-11 px-4 rounded-[10px] border border-input-line bg-white text-[14px] font-medium cursor-pointer"
    >
      주소 복사
    </button>
  );
}
