import React from 'react';

const S = {
  page: {
    background: '#0A0A0A',
    color: '#F2EFE8',
    minHeight: '100vh',
    fontFamily: "'Barlow Condensed', sans-serif",
  },
  header: {
    borderBottom: '1px solid #1e1e1e',
    padding: '100px 48px 48px',
    maxWidth: '860px',
    margin: '0 auto',
  },
  eyebrow: {
    fontSize: '11px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#C23B22',
    marginBottom: '16px',
  },
  title: {
    fontSize: 'clamp(32px, 6vw, 64px)',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    lineHeight: 1,
    margin: 0,
  },
  subtitle: {
    marginTop: '16px',
    fontSize: '15px',
    color: '#888',
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 300,
  },
  body: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '48px 48px 120px',
  },
  section: {
    marginTop: '48px',
    borderTop: '1px solid #1e1e1e',
    paddingTop: '32px',
  },
  h2: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#F2EFE8',
    marginBottom: '12px',
  },
  p: {
    fontSize: '15px',
    lineHeight: 1.7,
    color: '#aaa',
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 300,
    marginTop: '10px',
  },
  highlight: {
    color: '#F2EFE8',
    fontWeight: 500,
  },
  link: {
    color: '#C23B22',
    textDecoration: 'none',
  },
  back: {
    display: 'inline-block',
    fontSize: '13px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#555',
    textDecoration: 'none',
    borderBottom: '1px solid #333',
    paddingBottom: '2px',
  },
};

export default function Refunds() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.eyebrow}>Policy // APEX by The ARC</div>
        <h1 style={S.title}>Refunds &amp; Cancellations</h1>
        <p style={S.subtitle}>All APEX pieces are custom designed and manufactured exclusively after an order is placed.</p>
      </div>

      <div style={S.body}>
        <a href="/" style={S.back}>← Back to APEX Store</a>

        <div style={S.section}>
          <h2 style={S.h2}>1. On-Demand Custom Manufacturing</h2>
          <p style={S.p}>
            Every garment, bomber jacket, varsity outerwear piece, and hand-lasted craft footwear silhouette offered by APEX by The ARC is strictly <span style={S.highlight}>made-to-order</span>.
          </p>
          <p style={S.p}>
            Manufacturing and bespoke assembly commence only <span style={S.highlight}>after an order is placed and confirmed</span>. Because each unit is individually tailored, standard production takes approximately <strong>5–9 business days</strong> prior to carrier dispatch.
          </p>
          <p style={S.p}>
            Due to the artisanal and custom manufacturing nature of our pieces, shipping and transit times may occasionally experience delivery delays. Timelines displayed at checkout are operational estimates.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>2. Strict No-Refunds &amp; No-Returns Policy</h2>
          <p style={S.p}>
            Because all items are custom-designed, printed, and manufactured specifically upon customer demand, <span style={S.highlight}>we do not accept returns, exchanges, or refunds</span>.
          </p>
          <p style={S.p}>
            We do not issue refunds or cancellations for:
          </p>
          <p style={S.p}>• Change of mind or buyer's remorse.</p>
          <p style={S.p}>• Sizing mistakes (please inspect our comprehensive size guide before checkout).</p>
          <p style={S.p}>• Orders that have entered the custom manufacturing queue.</p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>3. Damaged Goods &amp; Manufacturing Defects</h2>
          <p style={S.p}>
            In the event that an item is delivered with physical transit damage or a verified manufacturing defect, APEX by The ARC will receive the product for inspection and make it right.
          </p>
          <p style={S.p}>
            To initiate a damaged item claim, you must notify our concierge team within <span style={S.highlight}>48 hours of delivery</span> by emailing <a href="mailto:apexbythearc@gmail.com" style={S.link}>apexbythearc@gmail.com</a> with:
          </p>
          <p style={S.p}>① Your official Shopify Order Number.</p>
          <p style={S.p}>② Clear unboxing photographs and video showing the defect or transit damage alongside the courier shipping label.</p>
          <p style={S.p}>
            Once verified and approved by our quality control desk, we will receive the damaged unit and provide an immediate free reprint/replacement or appropriate resolution.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>4. Order Cancellations</h2>
          <p style={S.p}>
            Because manufacturing starts immediately once an order is submitted to our production facility, orders cannot be cancelled or modified once placed. Please review your order summary, shipping address, and sizing carefully before completing checkout.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>5. Digital Frameworks &amp; Objects</h2>
          <p style={S.p}>
            All digital frameworks (such as The Salary Trap PDF) are delivered electronically upon payment confirmation. All digital sales are final, non-cancellable, and non-refundable.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>6. Support Concierge &amp; Merchant Information</h2>
          <p style={S.p}>
            For any inquiries, cancellations advice, or damaged shipment claims, please contact our support team:
          </p>
          <p style={S.p}>
            <strong>Legal Merchant Name:</strong> REVANTH MAPAKSHI<br />
            <strong>Brand / Trade Name:</strong> APEX by The ARC<br />
            <strong>Official Support Emails:</strong>{' '}
            <a href="mailto:revanthmapakshi15@gmail.com" style={S.link}>revanthmapakshi15@gmail.com</a>
            {' '}&bull;{' '}
            <a href="mailto:apexbythearc@gmail.com" style={S.link}>apexbythearc@gmail.com</a><br />
            <strong>Phone / Direct Contact:</strong>{' '}
            <a href="tel:+919491310928" style={S.link}>+91 9491310928</a><br />
            <strong>Operating Location:</strong> Bengaluru, Karnataka, India
          </p>
          <p style={S.p}>
            We respond to all verified inquiries within 24–48 business hours.
          </p>
        </div>
      </div>
    </div>
  );
}
