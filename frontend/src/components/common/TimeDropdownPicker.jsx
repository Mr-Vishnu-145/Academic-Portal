import React, { useState, useEffect } from 'react';
import CustomSelect from './CustomSelect';

const TimeDropdownPicker = ({ value, onChange, disabled = false, isEdit = false }) => {
  const [isManuallySet, setIsManuallySet] = useState(false);

  // Reset manual interaction tracker if parent resets value
  useEffect(() => {
    if (!value || value === '') {
      setIsManuallySet(false);
    }
  }, [value]);

  // Parse value (HH:MM or HH:MM:SS or HH:MM AM/PM) into 12-hour parts
  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: '12', minute: '00', period: 'AM' };
    
    const normalized = timeStr.trim().toUpperCase();
    
    // Determine AM/PM period
    let p = 'AM';
    if (normalized.includes('PM')) {
      p = 'PM';
    } else if (normalized.includes('AM')) {
      p = 'AM';
    } else {
      // 24-hour format: determine period from hours digits
      const hoursPart = parseInt(normalized.split(':')[0], 10);
      if (!isNaN(hoursPart)) {
        p = hoursPart >= 12 ? 'PM' : 'AM';
      }
    }
    
    // Clean text indicators to get numeric parts
    const cleanTime = normalized.replace(/[A-Z]/g, '').trim();
    const parts = cleanTime.split(':');
    if (parts.length < 2) return { hour: '12', minute: '00', period: p };
    
    let h = parseInt(parts[0], 10);
    const m = parts[1].substring(0, 2);
    
    if (isNaN(h)) h = 12;
    
    // Normalize to 12-hour format display digits
    h = h % 12;
    h = h ? h : 12;
    const hStr = h < 10 ? '0' + h : h.toString();
    
    return { hour: hStr, minute: m, period: p };
  };

  const { hour, minute, period } = parseTime(value);

  // Generate selection lists
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

  // Automatically load the latest system/device time on picker open/first interaction
  const handleInteraction = () => {
    if (!disabled && !isEdit && !isManuallySet) {
      setIsManuallySet(true);
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const formatted = `${h}:${m}`;
      onChange({ target: { value: formatted } });
    }
  };

  const handlePartChange = (changedPart, newVal) => {
    // Lock interaction tracker
    setIsManuallySet(true);

    let currentHour = hour;
    let currentMinute = minute;
    let currentPeriod = period;

    if (changedPart === 'hour') currentHour = newVal;
    else if (changedPart === 'minute') currentMinute = newVal;
    else if (changedPart === 'period') currentPeriod = newVal;

    // Convert back to 24-hour HH:MM format for parent state storage
    let h = parseInt(currentHour, 10);
    if (currentPeriod === 'PM' && h < 12) h += 12;
    if (currentPeriod === 'AM' && h === 12) h = 0;
    
    const hStr = h < 10 ? '0' + h : h.toString();
    const formatted = `${hStr}:${currentMinute}`;
    
    onChange({ target: { value: formatted } });
  };

  return (
    <div 
      style={{ display: 'flex', gap: '8px', width: '100%' }}
      onMouseDown={handleInteraction}
    >
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
