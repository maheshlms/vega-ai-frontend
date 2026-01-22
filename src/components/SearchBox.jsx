const SearchBox = ({ text, placeholder, className = "", icon: Icon }) => {
  const words = [
    placeholder || "Search users...",
    "Search IAM roles...",
    "Search Java services..."
  ];

  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [value, setValue] = useState("");
  const [i, setI] = useState(0);
  const [j, setJ] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (value.length > 0) return;

    const current = words[i % words.length];
    let timer;

    if (!deleting) {
      timer = setTimeout(() => {
        setTypedPlaceholder(current.substring(0, j + 1));
        setJ(j + 1);

        if (j + 1 === current.length) {
          setTimeout(() => setDeleting(true), 1200);
        }
      }, 80);
    } else {
      timer = setTimeout(() => {
        setTypedPlaceholder(current.substring(0, j - 1));
        setJ(j - 1);

        if (j - 1 === 0) {
          setDeleting(false);
          setI(i + 1);
        }
      }, 40);
    }

    return () => clearTimeout(timer);
  }, [j, deleting, i, value, placeholder]);

  return (
    <div className="relative w-[420px] max-w-full">
      <input
        type={text || "text"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={value.length > 0 ? placeholder : typedPlaceholder}
        className={`w-full h-10 pl-10 pr-3 rounded-md bg-white border border-[#CBD5E1]
          focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 ${className}`}
      />
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
          <Icon size={18} />
        </span>
      )}
    </div>
  );
};

export default SearchBox ;