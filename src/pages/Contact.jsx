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
  link: {
    color: '#C23B22',
    textDecoration: 'none',
    fontWeight: 500,
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
  emailBlock: {
    display: 'inline-block',
    marginTop: '24px',
    padding: '20px 32px',
    border: '1px solid #1e1e1e',
    background: '#111',
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: '#F2EFE8',
  },
};

export default function Contact() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.eyebrow}>Get in Touch // APEX by The ARC</div>
        <h1 style={S.title}>Direct Desk</h1>
        <p style={S.subtitle}>Questions, order issues, or anything else — we respond within 24–48 hours.</p>
      </div>

      <div style={S.body}>
        <a href="/" style={S.back}>← Back to APEX Store</a>

        <div style={S.section}>
          <h2 style={S.h2}>Customer Concierge &amp; Inquiries</h2>
          <p style={S.p}>For order assistance, defect or damaged goods reporting, and general inquiries:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
            <a href="mailto:revanthmapakshi15@gmail.com" style={S.link}>
              <div style={S.emailBlock}>revanthmapakshi15@gmail.com</div>
            </a>
            <a href="mailto:apexbythearc@gmail.com" style={S.link}>
              <div style={{ ...S.emailBlock, marginTop: 0, fontSize: '15px', color: '#aaa', fontWeight: 500 }}>
                Alternate Desk: apexbythearc@gmail.com
              </div>
            </a>
          </div>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>Merchant &amp; Business Information</h2>
          <p style={S.p}>
            <strong>Legal Name / Proprietor:</strong> REVANTH MAPAKSHI
          </p>
          <p style={S.p}>
            <strong>Brand / Trade Name:</strong> APEX by The ARC
          </p>
          <p style={S.p}>
            <strong>Official Email:</strong>{' '}
            <a href="mailto:revanthmapakshi15@gmail.com" style={S.link}>revanthmapakshi15@gmail.com</a>
            {' '}&bull;{' '}
            <a href="mailto:apexbythearc@gmail.com" style={S.link}>apexbythearc@gmail.com</a>
          </p>
          <p style={S.p}>
            <strong>Contact Number:</strong>{' '}
            <a href="tel:+919491310928" style={S.link}>+91 9491310928</a>
          </p>
          <p style={S.p}>
            <strong>Operating Location:</strong> Bengaluru, Karnataka, India
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>Damaged or Defective Shipments</h2>
          <p style={S.p}>
            All our pieces are custom manufactured and inspected after your order is placed. If your shipment arrives damaged or with a verified defect, please email us at <a href="mailto:revanthmapakshi15@gmail.com" style={S.link}>revanthmapakshi15@gmail.com</a> or <a href="mailto:apexbythearc@gmail.com" style={S.link}>apexbythearc@gmail.com</a> within 48 hours of delivery with your order number, unboxing video/photos, and details of the damage so our team can immediately assist.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>Response Time</h2>
          <p style={S.p}>
            Our team reviews every inquiry and typically responds within <strong style={{ color: '#F2EFE8' }}>24–48 hours</strong>.
            Please include your Order Number in the email subject line for priority handling.
          </p>
        </div>
      </div>
    </div>
  );
}
