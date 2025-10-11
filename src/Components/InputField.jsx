export default function InputField({
  label,
  id,
  placeholder,
  type = "text",
  value,
  onChange,
}) {
  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={id} className="pb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full p-2.5 border-2 border-solid border-[#334155] rounded-xl focus:ring-2 focus:ring-[#20c4dd] focus:outline-none"
      />
    </div>
  );
}
