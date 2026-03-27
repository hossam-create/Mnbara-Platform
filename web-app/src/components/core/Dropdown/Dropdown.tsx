import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import './Dropdown.css';

export interface DropdownItem {
  label: string;
  value: string | number;
  icon?: ReactNode;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  value,
  onChange,
  placement = 'bottom-start',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && !item.divider) {
      onChange?.(item.value);
      setIsOpen(false);
    }
  };

  const dropdownClassNames = [
    'mnbara-dropdown',
    `mnbara-dropdown--${placement}`,
    isOpen && 'mnbara-dropdown--open',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={dropdownClassNames} ref={dropdownRef}>
      <div className="mnbara-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="mnbara-dropdown-menu">
          {items.map((item, index) => (
            <React.Fragment key={item.value || index}>
              {item.divider ? (
                <div className="mnbara-dropdown-divider" />
              ) : (
                <button
                  className={`mnbara-dropdown-item ${item.danger ? 'mnbara-dropdown-item--danger' : ''} ${item.value === value ? 'mnbara-dropdown-item--active' : ''} ${item.disabled ? 'mnbara-dropdown-item--disabled' : ''}`}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                >
                  {item.icon && <span className="mnbara-dropdown-item-icon">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
