export default function PrimaryButton({ text, type = "button", onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="px-3 pt-2 pb-1 rounded-lg text-[#041315] text-base font-normal cursor-pointer bg-[#20c4dd] hover:bg-[#0891b2] transition duration-200"
    >
      {text}
    </button>
  );
}
