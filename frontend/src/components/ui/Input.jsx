import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cx } from '../../utils/classNames';

export const Input = React.forwardRef(
  (
    {
      label,
      helperText,
      errorMessage,
      startIcon,
      endIcon,
      icon,
      leftIcon,
      rightIcon,
      isClearable = false,
      onClear,
      value,
      onChange,
      className = '',
      id,
      disabled,
      required,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const effectiveStartIcon = startIcon || leftIcon || icon;
    const effectiveEndIcon = endIcon || rightIcon;

    const renderIcon = (iconInput, defaultSize = 18) => {
      if (!iconInput) return null;
      if (React.isValidElement(iconInput)) return iconInput;
      if (typeof iconInput === 'function' || (typeof iconInput === 'object' && iconInput !== null)) {
        const IconComponent = iconInput;
        return <IconComponent size={defaultSize} />;
      }
      return null;
    };

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            <span>
              {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
            </span>
          </label>
        )}

        <div className="form-control-wrapper">
          {effectiveStartIcon && (
            <span className="input-icon-start">
              {renderIcon(effectiveStartIcon, 18)}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={cx(
              'form-control',
              effectiveStartIcon && 'form-control-has-icon-start',
              (effectiveEndIcon || isClearable) && 'form-control-has-icon-end',
              errorMessage && 'form-control-error',
              className
            )}
            {...props}
          />

          {isClearable && value && (
            <button
              type="button"
              onClick={onClear}
              className="input-icon-end"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}

          {!isClearable && effectiveEndIcon && (
            <span className="input-icon-end">
              {renderIcon(effectiveEndIcon, 18)}
            </span>
          )}
        </div>

        {errorMessage ? (
          <div className="form-error-msg">
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        ) : helperText ? (
          <div className="form-helper">{helperText}</div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
