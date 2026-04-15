export default function BaseBottomSheet({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-end bg-black/35" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-gray-700" />
        {children}
      </div>
    </div>
  );
}
