import { useState } from "react";
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
}

export function Notification({ message, type, onClose }: NotificationProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-secondary" />,
  };

  const baseStyles = "pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-md transition-all duration-300 ease-out";
  const typeStyles = {
    success: "bg-green-500/10 border-green-500/20 text-green-100",
    error: "bg-red-500/10 border-red-500/20 text-red-100",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-100",
    info: "bg-dark/80 border-white/10 text-light",
  };

  return (
    <div 
      className={`${baseStyles} ${typeStyles[type]} ${
        isClosing 
          ? "opacity-0 -translate-y-4 scale-95" 
          : "animate-fade-in-down"
      }`}
      onClick={handleClose}
      style={{ cursor: "pointer" }}
    >
      {icons[type]}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
}
