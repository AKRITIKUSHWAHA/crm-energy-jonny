import React from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from '../../utils/classNames';

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
      size = 'md',        // 'sm' | 'md' | 'lg'
      isLoading = false,
      isDisabled = false,
      icon: Icon,
      iconPosition = 'left',
      leftIcon,
      rightIcon,
      isIconOnly = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const disabled = isDisabled || isLoading;
    const iconSize = size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

    const renderIcon = (iconInput) => {
      if (!iconInput) return null;
      if (React.isValidElement(iconInput)) return iconInput;
      if (typeof iconInput === 'function' || (typeof iconInput === 'object' && iconInput !== null)) {
        const IconComponent = iconInput;
        return <IconComponent size={iconSize} />;
      }
      return null;
    };

    const effectiveLeftIcon = leftIcon || (iconPosition === 'left' ? Icon : null);
    const effectiveRightIcon = rightIcon || (iconPosition === 'right' ? Icon : null);

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cx(
          'btn',
          `btn-${variant}`,
          `btn-${size}`,
          isIconOnly && 'btn-icon-only',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" size={iconSize} />}
        {!isLoading && effectiveLeftIcon && renderIcon(effectiveLeftIcon)}
        {!isIconOnly && children && <span>{children}</span>}
        {!isLoading && effectiveRightIcon && renderIcon(effectiveRightIcon)}
      </button>
    );
  }
);

Button.displayName = 'Button';
