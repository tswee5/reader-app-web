import React from 'react';

interface EmailTemplateProps {
  title: string;
  content: React.ReactNode;
  ctaText: string;
  ctaUrl: string;
  footerText?: string;
}

export function EmailTemplate({ title, content, ctaText, ctaUrl, footerText }: EmailTemplateProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .content p {
            margin: 0 0 20px 0;
            font-size: 16px;
            color: #4b5563;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div className="logo">📚 Reader App</div>
            <h1>{title}</h1>
          </div>
          
          <div className="content">
            {content}
            
            <a href={ctaUrl} className="cta-button">
              {ctaText}
            </a>
            
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '30px' }}>
              If the button doesn't work, copy and paste this link into your browser:<br />
              <a href={ctaUrl} style={{ color: '#667eea', wordBreak: 'break-all' }}>
                {ctaUrl}
              </a>
            </p>
          </div>
          
          <div className="footer">
            <p>{footerText || "This email was sent from Reader App. If you didn't request this, you can safely ignore it."}</p>
            <p style={{ marginTop: '10px' }}>
              © 2024 Reader App. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

export function EmailVerificationTemplate({ verificationUrl }: { verificationUrl: string }) {
  return (
    <EmailTemplate
      title="Verify Your Email Address"
      ctaText="Verify Email Address"
      ctaUrl={verificationUrl}
      footerText="Please verify your email address to complete your account setup and start using Reader App."
      content={
        <>
          <div className="icon">✉️</div>
          <p>
            Welcome to Reader App! We're excited to have you on board.
          </p>
          <p>
            To complete your account setup and start reading smarter, please verify your email address by clicking the button below.
          </p>
          <p>
            Once verified, you'll have access to all our features including AI-powered insights, text-to-speech, and smart article parsing.
          </p>
        </>
      }
    />
  );
}

export function PasswordResetTemplate({ resetUrl }: { resetUrl: string }) {
  return (
    <EmailTemplate
      title="Reset Your Password"
      ctaText="Reset Password"
      ctaUrl={resetUrl}
      footerText="This password reset link will expire in 1 hour for security reasons."
      content={
        <>
          <div className="icon">🔐</div>
          <p>
            We received a request to reset your password for your Reader App account.
          </p>
          <p>
            Click the button below to create a new password. This link will expire in 1 hour for security reasons.
          </p>
          <p>
            If you didn't request this password reset, you can safely ignore this email.
          </p>
        </>
      }
    />
  );
}

export function WelcomeEmailTemplate({ userName }: { userName?: string }) {
  return (
    <EmailTemplate
      title="Welcome to Reader App!"
      ctaText="Start Reading"
      ctaUrl="https://yourapp.com/library"
      footerText="Thank you for joining Reader App. We're here to help you read smarter."
      content={
        <>
          <div className="icon">🎉</div>
          <p>
            {userName ? `Hi ${userName},` : 'Hi there,'}
          </p>
          <p>
            Welcome to Reader App! Your account is now fully set up and ready to use.
          </p>
          <p>
            Start exploring our powerful features:
          </p>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '20px auto', paddingLeft: '20px' }}>
            <li>📖 Import and parse any article from the web</li>
            <li>🤖 Get AI-powered summaries and insights</li>
            <li>🎧 Listen to articles with text-to-speech</li>
            <li>📝 Take notes and highlight important passages</li>
          </ul>
          <p>
            Ready to start your enhanced reading journey?
          </p>
        </>
      }
    />
  );
} 