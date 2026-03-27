/**
 * ToggleSwitch Component
 * Reusable toggle switch for settings
 */

import React from 'react';
import './ToggleSwitch.css';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
}) => {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <label className="mnbara-toggle-switch">
      <input
        type="checkbox"
        className="mnbara-toggle-switch__input"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <span 
        className={`mnbara-toggle-switch__slider ${checked ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      />
      {label && <span className="mnbara-toggle-switch__label">{label}</span>}
    </label>
  );
};

export default ToggleSwitch;
