export default function PrimaryButton({ text, type = "button", onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="px-3 py-2 rounded-lg text-[#041315] cursor-pointer bg-[#20c4dd] hover:bg-[#0891b2] transition duration-200"
    >
      {text}
    </button>
  );
}
