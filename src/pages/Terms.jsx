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
  },
  back: {
    display: 'inline-block',
    marginTop: '0',
    fontSize: '13px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#555',
    textDecoration: 'none',
    borderBottom: '1px solid #333',
    paddingBottom: '2px',
  },
};

export default function Terms() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.eyebrow}>Legal // APEX by The ARC</div>
        <h1 style={S.title}>Terms &amp; Conditions</h1>
        <p style={S.subtitle}>Effective 2026. All purchases through APEX by The ARC are subject to these terms.</p>
      </div>

      <div style={S.body}>
        <a href="/" style={S.back}>← Back to APEX</a>

        <div style={S.section}>
          <h2 style={S.h2}>1. General &amp; Merchant Identity</h2>
          <p style={S.p}>
            By accessing this site and purchasing any product, you agree to be bound by these terms. This platform and the brand label <strong>APEX by The ARC</strong> (The ARC) are owned and operated by <strong>REVANTH MAPAKSHI</strong> as the legal merchant and billing entity. All financial transactions, payments, invoicing, and fulfillment are administered under the legal entity of REVANTH MAPAKSHI.
          </p>
          <p style={S.p}>
            We reserve the right to update these terms at any time without prior notice. All products are subject to availability.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>2. Pricing &amp; Currency</h2>
          <p style={S.p}>
            All prices are listed and transacted in Indian Rupees (INR - ₹). For international visitors, approximate conversions may be shown for convenience, but all final order settlements are processed in INR through our secure payment partners.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>3. Made-to-Order Manufacturing &amp; Delivery</h2>
          <p style={S.p}>
            All APEX products (including craft footwear, streetwear outerwear, luxury hoodies, and physical goods) are strictly Made-to-Order. Production and custom manufacturing commence only after your order has been placed and payment is confirmed.
          </p>
          <p style={S.p}>
            Standard manufacturing and precision finishing typically require 5–10 business days before dispatch. Because each unit is individually crafted, occasional manufacturing or logistics delays may occur. Stated delivery dates are reasonable estimates and not guaranteed deadlines.
          </p>
          <p style={S.p}>
            <strong>No Returns / No Refunds:</strong> Because all merchandise is custom-manufactured specifically for each customer, all sales are strictly final. We do not support returns, exchanges, cancellations, or refunds once manufacturing has been initiated. If an item arrives physically damaged or defective, please notify us within 48 hours as detailed in our Refund Policy.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>4. Digital Products</h2>
          <p style={S.p}>
            Digital frameworks and electronic assets (such as The Salary Trap framework) are delivered electronically immediately upon confirmed payment. All digital sales are strictly final and non-refundable once delivered.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>5. Intellectual Property</h2>
          <p style={S.p}>
            All content, designs, typography, silhouettes, photography, and branding on this site are the exclusive intellectual property of The ARC / APEX. Reproduction, redistribution, reverse engineering, or commercial use without prior written authorization is strictly prohibited.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>6. Limitation of Liability</h2>
          <p style={S.p}>
            APEX by The ARC shall not be held liable for any indirect, incidental, or consequential damages arising from the use of our products or services. In any event, our total aggregate liability is strictly limited to the purchase amount paid for the affected product.
          </p>
        </div>

        <div style={S.section}>
          <h2 style={S.h2}>7. Concierge &amp; Merchant Compliance Contact</h2>
          <p style={S.p}>
            For any inquiries, customer support, or merchant compliance questions regarding these terms, reach our desk directly:
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
        </div>
      </div>
    </div>
  );
}
