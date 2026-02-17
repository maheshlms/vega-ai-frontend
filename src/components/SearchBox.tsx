import React, { useState, useEffect } from "react";

interface SearchBoxProps {
  text?: string;
  placeholder?: string;
  className?: string;
  icon?: React.ElementType;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  text,
  placeholder,
  className = "",
  icon: Icon,
}) => {
  const words: string[] = [
    placeholder || "Search users...",
    "Search IAM roles...",
    "Search Java services...",
  ];

  const [typedPlaceholder, setTypedPlaceholder] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [i, setI] = useState<number>(0);
  const [j, setJ] = useState<number>(0);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (value.length > 0) return;

    const current: string = words[i % words.length];
    let timer: ReturnType<typeof setTimeout>;

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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
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

export default SearchBox;
