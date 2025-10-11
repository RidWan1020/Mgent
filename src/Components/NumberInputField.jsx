export default function NumberInputField({
  label,
  id,
  min,
  max,
  value,
  onChange,
  step,
}) {
  return (
    <div className="flex flex-col pb-2.5">
      <label className="pb-1.5">{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        defaultValue={value ?? ""}   
        onChange={onChange}
        step={step ?? "1"}
        className="w-full p-2.5 border-2 border-solid border-[#334155] rounded-xl focus:ring-2 focus:ring-[#20c4dd] focus:outline-none"
      />
    </div>
  );
}
