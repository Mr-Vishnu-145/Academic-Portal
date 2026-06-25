import React from 'react';
import CustomSelect from './CustomSelect';

const TimeDropdownPicker = ({ value, onChange, disabled = false }) => {
  // Parse value (HH:MM) into 12-hour parts
  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: '12', minute: '00', period: 'AM' };
    const parts = timeStr.split(':');
    if (parts.length < 2) return { hour: '12', minute: '00', period: 'AM' };
    
    let h = parseInt(parts[0], 10);
    const m = parts[1].substring(0, 2);
    const p = h >= 12 ? 'PM' : 'AM';
    
    h = h % 12;
    h = h ? h : 12; // 0 becomes 12
    const hStr = h < 10 ? '0' + h : h.toString();
    
    return { hour: hStr, minute: m, period: p };
  };

  const { hour, minute, period } = parseTime(value);

  // Generate options
  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const val = (i + 1) < 10 ? '0' + (i + 1) : (i + 1).toString();
    return { value: val, label: val };
  });

  const minuteOptions = Array.from({ length: 60 }, (_, i) => {
    const val = i < 10 ? '0' + i : i.toString();
    return { value: val, label: val };
  });

  const periodOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' }
  ];

  const handlePartChange = (changedPart, newVal) => {
    let currentHour = hour;
    let currentMinute = minute;
    let currentPeriod = period;

    if (changedPart === 'hour') currentHour = newVal;
    else if (changedPart === 'minute') currentMinute = newVal;
    else if (changedPart === 'period') currentPeriod = newVal;

    // Convert back to 24-hour HH:MM
    let h = parseInt(currentHour, 10);
    if (currentPeriod === 'PM' && h < 12) h += 12;
    if (currentPeriod === 'AM' && h === 12) h = 0;
    
    const hStr = h < 10 ? '0' + h : h.toString();
    const formatted = `${hStr}:${currentMinute}`;
    
    onChange({ target: { value: formatted } });
  };

  return (
    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
      <div style={{ flex: 1 }}>
        <CustomSelect
          value={hour}
          onChange={(e) => handlePartChange('hour', e.target.value)}
          options={hourOptions}
          placeholder="Hour"
          disabled={disabled}
        />
      </div>
      <div style={{ flex: 1 }}>
        <CustomSelect
          value={minute}
          onChange={(e) => handlePartChange('minute', e.target.value)}
          options={minuteOptions}
          placeholder="Min"
          disabled={disabled}
        />
      </div>
      <div style={{ flex: 1 }}>
        <CustomSelect
          value={period}
          onChange={(e) => handlePartChange('period', e.target.value)}
          options={periodOptions}
          placeholder="AM/PM"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default TimeDropdownPicker;
