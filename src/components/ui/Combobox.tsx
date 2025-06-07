import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';

interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    searchable?: boolean;
    onSearch?: (query: string) => void;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = 'Select an option...',
    className = '',
    disabled = false,
    required = false,
    name,
    searchable = false,
    onSearch
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<ComboboxOption[]>(options);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get the selected option label
    const selectedOption = options.find(option => option.value === value);

    // Filter options based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredOptions(options);
            return;
        }

        const lowercasedSearch = searchTerm.toLowerCase();
        const filtered = options.filter(option =>
            option.label.toLowerCase().includes(lowercasedSearch)
        );

        setFilteredOptions(filtered);

        // If onSearch is provided, call it with the search term
        if (onSearch && searchable) {
            onSearch(searchTerm);
        }
    }, [searchTerm, options, onSearch, searchable]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    const handleOptionClick = (option: ComboboxOption) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && filteredOptions.length > 0) {
            e.preventDefault();
            handleOptionClick(filteredOptions[0]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    return (
        <div
            ref={containerRef}
            className={clsx(
                "relative w-full",
                className
            )}
        >
            <div
                className={clsx(
                    "flex items-center border border-gray-300 rounded-lg p-2 bg-white cursor-pointer",
                    disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary",
                    isOpen ? "ring-1 ring-primary border-primary" : ""
                )}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(!isOpen);
                        if (!isOpen) {
                            setTimeout(() => {
                                inputRef.current?.focus();
                            }, 0);
                        }
                    }
                }}
            >
                {isOpen ? (
                    <div className="flex items-center w-full">
                        <Search className="w-4 h-4 text-black mr-2" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 outline-none bg-transparent text-black"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Search..."
                            onClick={(e) => e.stopPropagation()}
                            disabled={disabled}
                            autoComplete="off"
                            name={name}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full text-black">
                        <span className={clsx("truncate", !selectedOption && "text-gray-500")}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <Search className="w-4 h-4 text-black ml-2 flex-shrink-0" />
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute z-[99999] w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-y-auto mt-1"
                    style={{
                        maxHeight: '200px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
                        top: '100%',
                        left: 0
                    }}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={clsx(
                                    "p-2 cursor-pointer hover:bg-gray-100 text-black border-b border-gray-100 last:border-b-0",
                                    option.value === value ? "bg-gray-100 font-medium" : ""
                                )}
                                onClick={() => handleOptionClick(option)}
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className="p-2 text-black">No options found</div>
                    )}
                </div>
            )}

            {/* Hidden input for form submission */}
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={value}
                    required={required}
                />
            )}
        </div>
    );
}