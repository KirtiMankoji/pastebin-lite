export default function NotFound() {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>404</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        Paste not found or has expired
      </p>
      <a 
        href="/" 
        style={{ 
          color: '#0070f3', 
          textDecoration: 'none',
          fontSize: '16px',
          padding: '10px 20px',
          border: '1px solid #0070f3',
          borderRadius: '4px',
          display: 'inline-block'
        }}
      >
        Create a new paste
      </a>
    </div>
  );
}
