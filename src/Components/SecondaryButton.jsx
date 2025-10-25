export default function SecondaryButton({ text, type="button", onClick }) {
  return (
    <button type={type} className="px-3 pt-2 pb-1 border-2 rounded-lg bg-[#040b1a] text-[#e5e7eb] text-base cursor-pointer hover:bg-red-600 transition duration-200" onClick={onClick}>
      {text}
    </button>
  );
}
