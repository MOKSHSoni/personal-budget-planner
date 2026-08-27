import { useEffect, useState } from "react";
import { formatCurrency } from "../../utils/formatCurrency";

/**
 * Animated number / currency counter
 * @param {number} value - Target value to count up to
 * @param {string} currency - Currency code if formatting as currency (e.g. "INR", "USD")
 * @param {boolean} isCurrency - Whether to format output using formatCurrency
 * @param {number} duration - Animation duration in ms (default 600ms)
 * @param {string} prefix - Optional prefix (e.g. "+", "-")
 * @param {string} suffix - Optional suffix (e.g. "%")
 */
export default function CountUp({
  value = 0,
  currency = null,
  isCurrency = false,
  duration = 650,
  prefix = "",
  suffix = "",
  className = "",
}) {
  const numericTarget = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId;
    const startValue = displayValue;
    const diff = numericTarget - startValue;

    if (diff === 0) return;

    // Custom ease-out curve: 1 - Math.pow(1 - progress, 3)
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(numericTarget);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [numericTarget, duration]);

  const formatted = isCurrency && currency
    ? formatCurrency(displayValue, currency)
    : `${prefix}${Math.round(displayValue).toLocaleString()}${suffix}`;

  return <span className={`tabular-nums ${className}`}>{formatted}</span>;
}

