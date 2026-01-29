import { notFound } from 'next/navigation';
import { getPaste } from '@/lib/kv';
import { isPasteExpired, isViewLimitExceeded } from '@/lib/time';

export default async function PastePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const paste = await getPaste(id);

  if (!paste) {
    notFound();
  }

  const currentTime = Date.now();

  // Check if expired
  if (isPasteExpired(paste.expiresAt, currentTime)) {
    notFound();
  }

  // Check if view limit exceeded
  if (isViewLimitExceeded(paste.maxViews, paste.viewCount)) {
    notFound();
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        marginBottom: '20px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Paste</h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          ID: {id}
        </div>
      </div>

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        {paste.content}
      </div>

      <div style={{ marginTop: '20px' }}>
        <a 
          href="/" 
          style={{ 
            color: '#0070f3', 
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          ← Create a new paste
        </a>
      </div>
    </div>
  );
}
