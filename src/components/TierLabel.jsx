export default function TierLabel({ label }) {
  return (
    <div className="px-6 py-2 bg-gray-50 border-y border-gray-100">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}
