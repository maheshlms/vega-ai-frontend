function InputField({ className = "", children, ...props }) {
  return (
    <div className="relative w-full">
      <input
        {...props}
        
        style={{
          background: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--input-text)"
        }}
        className={`w-full px-4 py-2 rounded-lg border outline-none
          placeholder:text-[var(--input-placeholder)]
          focus:ring-2 focus:ring-blue-500/40 transition ${className}`}
      />
      {children}
    </div>
  )
}

export default InputField
