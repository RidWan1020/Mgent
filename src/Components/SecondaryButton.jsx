export default function SecondaryButton({ text, onClick }) {
  return (
    <button className="p-2.5 border-2 rounded-lg bg-[#040b1a] text-[#e5e7eb] cursor-pointer hover:bg-red-600 transition duration-200" onClick={onClick}>
      {text}
    </button>
  );
}
