/**
 * Auto-start initialization for message monitoring
 * This runs when the server starts to automatically enable monitoring
 */

let isInitialized = false;

export async function initializeAutoStart() {
  if (isInitialized) {
    console.log('📡 Auto-start already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing auto-start for message monitoring...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/monitor/auto-start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Auto-start initialization completed:', data.message);
      isInitialized = true;
    } else {
      console.error('❌ Auto-start initialization failed:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Auto-start initialization error:', error);
  }
}

// Auto-initialize when this module is imported
if (typeof window === 'undefined') {
  // Only run on server side
  initializeAutoStart().catch(console.error);
}
