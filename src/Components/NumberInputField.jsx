export default function NumberInputField({
  label,
  id,
  min,
  max,
  value,
  onChange,
  placeholder,
  step,
}) {
  return (
    <div className="flex flex-col pb-2.5">
      <label className="pb-1.5 text-base">{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        placeholder={placeholder}
        max={max}
        value={value ?? ""}   
        onChange={onChange}
        step={step ?? "1"}
        className="w-full p-2.5 border-2 border-solid border-[#334155] rounded-xl focus:ring-2 focus:ring-[#20c4dd] focus:outline-none"
      />
    </div>
  );
}
