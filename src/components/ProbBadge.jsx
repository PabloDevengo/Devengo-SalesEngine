export default function ProbBadge({ prob }) {
  let bg, text;
  if (prob >= 60)      { bg = "bg-emerald-50 border-emerald-100"; text = "text-emerald-700"; }
  else if (prob >= 25) { bg = "bg-amber-50 border-amber-100";     text = "text-amber-700";   }
  else                 { bg = "bg-gray-100 border-gray-200";       text = "text-gray-500";    }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium tabular-nums ${bg} ${text}`}>
      {prob}%
    </span>
  );
}
