import { BookOpen } from "lucide-react";
function EmptyState({
  icon: Icon = BookOpen,
  title: title,
  text: text,
  action: action,
}) {
  return (
    <div className={"empty"}>
      <span className={"empty-icon"}>
        <Icon size={25} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export default EmptyState;
