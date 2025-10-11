export default function SelectInput({
  label,
  id,
  value,
  placeholder,
  options = [],
  onChange,
}) {
  return (
    <div className="flex flex-col">
      <label className="pb-1.5">{label}</label>
      <select
        id={id}
        onChange={onChange}
        value={value}
        className="w-full p-2.5 border-2 border-solid bg-[#0b1024] cursor-pointer border-[#334155] rounded-xl focus:ring-2 focus:ring-[#20c4dd] focus:outline-none"
      >
        <option value="" disabled>{placeholder || "Select an option"}</option>
        {options.map((item) => {
          const optValue = typeof item === "object" ? item.value : item;
          const optLabel = typeof item === "object" ? item.label : item;
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}
//
//
