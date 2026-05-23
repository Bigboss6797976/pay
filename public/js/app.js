document.addEventListener('click', function(e) {
  const tabBtn = e.target.closest('.tab-btn');
  if (!tabBtn) return;
  const tabId = tabBtn.dataset.tab;
  if (!tabId) return;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  tabBtn.classList.add('active');
  document.querySelectorAll('.qr-panel').forEach(panel => panel.classList.remove('active'));
  const panel = document.getElementById(tabId + '-panel');
  if (panel) panel.classList.add('active');
});

function startCountdown(seconds) {
  const el = document.getElementById('countdown');
  if (!el) return;
  let remaining = seconds;
  const timer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(timer);
      el.textContent = '已过期';
      el.style.color = '#ff4d4f';
      return;
    }
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    el.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }, 1000);
}

function pollOrderStatus(orderNo) {
  if (!orderNo) return;
  const statusText = document.getElementById('status-text');
  const statusDot = document.querySelector('.status-dot');
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/order/' + orderNo + '/status');
      const data = await res.json();
      if (data.success) {
        if (data.status === 'paid' || data.aliStatus === 'TRADE_SUCCESS' || data.wxStatus === 'SUCCESS') {
          statusText.textContent = '✅ 支付成功！';
          statusText.style.color = '#07C160';
          statusDot.classList.remove('pending');
          statusDot.classList.add('success');
          playSuccessSound();
          setTimeout(() => { window.location.href = '/?success=1'; }, 3000);
          return true;
        }
      }
    } catch (err) { console.error('状态查询失败:', err); }
    return false;
  };
  checkStatus().then(paid => {
    if (!paid) {
      const interval = setInterval(async () => {
        const paid = await checkStatus();
        if (paid) clearInterval(interval);
      }, 3000);
      setTimeout(() => clearInterval(interval), 600000);
    }
  });
}

function playSuccessSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) { console.log('音效播放失败'); }
}

document.addEventListener('DOMContentLoaded', function() {
  const payForm = document.getElementById('pay-form');
  if (payForm) {
    payForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const amount = document.getElementById('amount').value;
      const subject = document.getElementById('subject').value;
      if (!amount || amount <= 0) { alert('请输入有效金额'); return; }
      window.location.href = '/pay?amount=' + amount + '&subject=' + encodeURIComponent(subject);
    });
  }
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === '1') { showToast('🎉 支付成功！感谢您的使用'); }
});

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#07C160;color:white;padding:12px 24px;border-radius:24px;font-size:0.9rem;font-weight:600;z-index:9999;animation:slideDown 0.3s ease;box-shadow:0 4px 12px rgba(7,193,96,0.3);';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW registration failed'));
  });
}

const style = document.createElement('style');
style.textContent = '@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes slideUp{from{opacity:1;transform:translateX(-50%) translateY(0)}to{opacity:0;transform:translateX(-50%) translateY(-20px)}}';
document.head.appendChild(style);
