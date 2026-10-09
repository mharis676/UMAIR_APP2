import React from 'react';
import { 
  shareToWhatsApp, 
  shareProductStockToWhatsApp, 
  shareInventoryReportToWhatsApp 
} from '../utils/whatsapp';

export function WhatsAppIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.779.98-.955 1.18-.175.201-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.799-1.5-1.786-1.676-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.301.301-.502.1-.2.05-.376-.025-.527-.075-.15-.678-1.633-.929-2.235-.245-.587-.494-.508-.678-.517-.176-.009-.376-.009-.577-.009-.2 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.511s1.079 2.912 1.23 3.113c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.229 1.377.197 1.895.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.306.176-1.432-.075-.125-.276-.201-.577-.351zM12.04 2C6.527 2 2.05 6.477 2.05 11.99c0 1.761.46 3.48 1.334 4.996L2 22l5.167-1.356a9.94 9.94 0 0 0 4.873 1.256h.004c5.513 0 9.99-4.477 9.99-9.99A9.94 9.94 0 0 0 12.04 2zm0 18.23h-.004a8.27 8.27 0 0 1-4.218-1.155l-.302-.18-3.136.823.837-3.057-.197-.313a8.26 8.26 0 0 1-1.267-4.358c0-4.57 3.718-8.288 8.291-8.288a8.25 8.25 0 0 1 5.86 2.428 8.24 8.24 0 0 1 2.426 5.86c0 4.572-3.719 8.29-8.29 8.29z" />
    </svg>
  );
}

export default function WhatsAppShareButton({
  transaction,
  label = "Share on WhatsApp",
  style = {},
  variant = "solid" // "solid" | "outline"
}) {
  if (!transaction) return null;

  const isSolid = variant === "solid";

  return (
    <button
      type="button"
      className="btn"
      onClick={(e) => {
        e.stopPropagation();
        shareToWhatsApp(transaction);
      }}
      style={{
        background: isSolid ? '#25D366' : 'rgba(37, 211, 102, 0.1)',
        color: isSolid ? '#ffffff' : '#16a34a',
        border: isSolid ? 'none' : '1px solid #22c55e',
        boxShadow: isSolid ? '0 4px 14px rgba(37, 211, 102, 0.35)' : 'none',
        padding: '10px 16px',
        fontSize: '0.84rem',
        fontWeight: 600,
        borderRadius: '10px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
        ...style
      }}
      title="Share transaction slip via WhatsApp"
    >
      <WhatsAppIcon size={18} color={isSolid ? '#ffffff' : '#16a34a'} />
      <span>{label}</span>
    </button>
  );
}

/**
 * 1-Tap button to share a specific product's current stock on WhatsApp
 */
export function WhatsAppProductStockButton({
  product,
  operator,
  style = {},
  variant = "icon" // "icon" | "button"
}) {
  if (!product) return null;

  if (variant === "icon") {
    return (
      <button
        type="button"
        className="icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          shareProductStockToWhatsApp(product, operator);
        }}
        style={{
          width: '36px',
          height: '36px',
          color: '#16a34a',
          background: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 0.28)',
          ...style
        }}
        title="Share current stock balance via WhatsApp"
        aria-label="Share current stock via WhatsApp"
      >
        <WhatsAppIcon size={17} color="#16a34a" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn"
      onClick={(e) => {
        e.stopPropagation();
        shareProductStockToWhatsApp(product, operator);
      }}
      style={{
        background: '#25D366',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
        padding: '8px 14px',
        fontSize: '0.8rem',
        fontWeight: 600,
        borderRadius: '10px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        ...style
      }}
      title="Share current stock via WhatsApp"
    >
      <WhatsAppIcon size={16} color="#ffffff" />
      <span>Share Stock</span>
    </button>
  );
}

/**
 * 1-Tap button to share current filtered stock inventory report on WhatsApp
 */
export function WhatsAppReportButton({
  products = [],
  categoryName = 'All Items',
  operator,
  label = "Share Stock on WhatsApp",
  style = {}
}) {
  return (
    <button
      type="button"
      className="btn"
      onClick={(e) => {
        e.stopPropagation();
        shareInventoryReportToWhatsApp(products, { categoryName, operator });
      }}
      style={{
        background: '#25D366',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
        padding: '8px 14px',
        fontSize: '0.82rem',
        fontWeight: 600,
        borderRadius: '10px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ...style
      }}
      title="Share current inventory stock report on WhatsApp"
    >
      <WhatsAppIcon size={16} color="#ffffff" />
      <span>{label}</span>
    </button>
  );
}

