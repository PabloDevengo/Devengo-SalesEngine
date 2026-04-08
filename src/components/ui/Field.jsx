export default function Field({ label, icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
        {icon}{label}
      </label>
      {children}
    </div>
  );
}
