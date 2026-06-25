import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

const CustomSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select option...', 
  className = '',
  disabled = false,
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value?.toString() === value?.toString());
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div 
      ref={containerRef} 
      className={`custom-select-container ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={style}
    >
      {/* Toggle trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        className="form-control custom-select-trigger"
        disabled={disabled}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
          {displayLabel}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div className="custom-select-dropdown">
          {options.length === 0 ? (
            <div style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value?.toString() === value?.toString();
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`custom-select-option ${isSelected ? 'is-selected' : ''}`}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)', marginLeft: '8px' }}>
                      <Check size={16} />
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
