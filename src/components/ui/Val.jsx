import Empty from "./Empty";

export default function Val({ children, icon }) {
  return (
    <p className="text-sm text-gray-700 flex items-center gap-1.5">
      {icon}{children || <Empty />}
    </p>
  );
}
