// src/components/MenuButton.jsx
export default function MenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        absolute top-4 left-4 z-50 
        bg-white shadow-md hover:bg-slate-100
        w-10 h-10 flex items-center justify-center 
        rounded-full border border-slate-300
      "
      title="Open menu"
    >
      ☰
    </button>
  );
}
