import express from "express";
import QRCode from "qrcode";

const app = express();
const PORT = process.env.PORT || 3000;

// 收款账号配置
const ALIPAY_ACCOUNT = process.env.ALIPAY_ACCOUNT || "";
const WECHAT_PAY_URL = process.env.WECHAT_PAY_URL || ""; // 微信收款码链接

app.get("/pay", async (req, res) => {
  const amount = req.query.amount || "";
  const name = req.query.name || "商家";
  const ua = req.headers["user-agent"] || "";
  
  // 检测客户端
  const isAlipay = ua.includes("AlipayClient") || ua.includes("Alipay");
  const isWechat = ua.includes("MicroMessenger") || ua.includes("WeChat");
  
  // 根据客户端生成不同链接
  let payUrl, platformName, platformColor;
  
  if (isAlipay && ALIPAY_ACCOUNT) {
    // 支付宝转账链接
    payUrl = `alipays://platformapi/startapp?appId=20000123&actionType=toAccount&goBack=NO&account=${ALIPAY_ACCOUNT}&amount=${amount}&memo=${encodeURIComponent(name)}`;
    platformName = "支付宝";
    platformColor = "#1677FF";
  } else if (isWechat && WECHAT_PAY_URL) {
    // 微信支付链接
    payUrl = WECHAT_PAY_URL;
    platformName = "微信支付";
    platformColor = "#07C160";
  } else {
    // 默认支付宝
    payUrl = ALIPAY_ACCOUNT ? `alipays://platformapi/startapp?appId=20000123&actionType=toAccount&account=${ALIPAY_ACCOUNT}&amount=${amount}` : "";
    platformName = "支付宝";
    platformColor = "#1677FF";
  }
  
  // 生成二维码（聚合码，包含两个平台的链接信息）
  const qrData = JSON.stringify({
    alipay: ALIPAY_ACCOUNT ? `alipays://platformapi/startapp?appId=20000123&actionType=toAccount&account=${ALIPAY_ACCOUNT}&amount=${amount}` : "",
    wechat: WECHAT_PAY_URL,
    amount: amount,
    name: name
  });
  const qrImage = await QRCode.toDataURL(payUrl || qrData);
  
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>一码多付 - ${name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
          background: ${platformColor};
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
          transition: background 0.3s;
        }
        
        /* 顶部Logo区域 */
        .header {
          padding: 15px 0 10px;
          text-align: center;
        }
        .platform-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .platform-icon {
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${platformColor};
          font-size: 1.4rem;
          font-weight: bold;
        }
        .platform-text {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: 2px;
        }
        
        /* 推荐使用 */
        .recommend {
          color: white;
          font-size: 1.6rem;
          font-weight: 700;
          margin: 5px 0 20px;
          letter-spacing: 3px;
        }
        
        /* 平台切换标签 */
        .platform-tabs {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          padding: 0 20px;
        }
        .tab {
          padding: 10px 25px;
          border-radius: 25px;
          background: rgba(255,255,255,0.2);
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.3s;
        }
        .tab.active {
          background: white;
          color: ${platformColor};
          border-color: white;
        }
        
        /* 金额显示 */
        .amount-section {
          text-align: center;
          margin-bottom: 15px;
        }
        .amount {
          color: white;
          font-size: 3rem;
          font-weight: 700;
        }
        .amount-label {
          color: rgba(255,255,255,0.8);
          font-size: 0.9rem;
          margin-top: 5px;
        }
        
        /* 二维码区域 */
        .qr-container {
          position: relative;
          width: 300px;
          min-height: 360px;
          background: white;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          padding: 30px 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        }
        
        /* 绿色能量标签 */
        .energy-tag {
          position: absolute;
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7ED321 0%, #A8E063 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #2E7D32;
          font-size: 0.7rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(126,211,33,0.4);
          z-index: 10;
        }
        .energy-top-right {
          top: -15px;
          right: -15px;
        }
        .energy-left {
          left: -20px;
          top: 50%;
          transform: translateY(-50%);
        }
        .energy-bottom-right {
          bottom: -10px;
          right: -10px;
        }
        
        /* 二维码 */
        .qr-box {
          width: 200px;
          height: 200px;
          padding: 10px;
          border: 2px solid #f0f0f0;
          border-radius: 12px;
          margin: 20px 0;
        }
        .qr-box img {
          width: 100%;
          height: 100%;
          display: block;
        }
        
        /* 扫码提示 */
        .scan-tip {
          color: #1677FF;
          font-size: 1rem;
          font-weight: 500;
          margin-top: 10px;
        }
        
        /* 打开按钮 */
        .btn-open {
          margin-top: 15px;
          padding: 12px 40px;
          background: ${platformColor};
          color: white;
          border-radius: 25px;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        
        /* 自定义金额 */
        .custom-amount {
          display: ${amount ? 'none' : 'flex'};
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin: 15px 0;
        }
        .custom-amount input {
          width: 150px;
          padding: 10px;
          border: 2px solid ${platformColor};
          border-radius: 10px;
          font-size: 1.2rem;
          text-align: center;
        }
        .custom-amount button {
          padding: 8px 25px;
          background: ${platformColor};
          color: white;
          border: none;
          border-radius: 20px;
        }
        
        /* 底部 */
        .footer {
          margin-top: auto;
          padding: 25px 20px 35px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .footer-text {
          color: white;
          font-size: 1.2rem;
          font-weight: 500;
        }
        .sparkle {
          color: #FFD700;
          font-size: 1.3rem;
          animation: sparkle 2s infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* 一码多付提示 */
        .multi-pay-tip {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255,255,255,0.95);
          color: #333;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .multi-pay-tip::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(255,255,255,0.95);
        }
      </style>
    </head>
    <body>
      <!-- 顶部Logo -->
      <div class="header">
        <div class="platform-logo">
          <div class="platform-icon">${isWechat ? '微' : '支'}</div>
          <div class="platform-text">${platformName}</div>
        </div>
      </div>
      
      <!-- 推荐使用 -->
      <div class="recommend">推荐使用${platformName}</div>
      
      <!-- 平台切换（非微信/支付宝浏览器显示） -->
      ${!isAlipay && !isWechat ? `
      <div class="platform-tabs">
        <div class="tab active" onclick="switchPlatform('alipay')">🔵 支付宝</div>
        <div class="tab" onclick="switchPlatform('wechat')">🟢 微信支付</div>
      </div>
      ` : ''}
      
      <!-- 金额 -->
      ${amount ? `
      <div class="amount-section">
        <div class="amount">¥${amount}</div>
        <div class="amount-label">付款金额</div>
      </div>
      ` : ''}
      
      <!-- 二维码区域 -->
      <div class="qr-container">
        <div class="multi-pay-tip">🔥 一码多付 · 智能识别</div>
        
        <!-- 能量标签 -->
        <div class="energy-tag energy-top-right">
          <div>绿色</div>
          <div>能量</div>
        </div>
        <div class="energy-tag energy-left">
          <div>绿色</div>
          <div>能量</div>
        </div>
        <div class="energy-tag energy-bottom-right">
          <div>绿色</div>
          <div>能量</div>
        </div>
        
        <!-- 自定义金额 -->
        <div class="custom-amount" id="customAmountBox">
          <input type="number" id="customAmount" placeholder="输入金额" step="0.01">
          <button onclick="updateAmount()">确认金额</button>
        </div>
        
        <!-- 二维码 -->
        <div class="qr-box">
          <img src="${qrImage}" alt="收款码">
        </div>
        
        <!-- 扫码提示 -->
        <div class="scan-tip">打开${platformName}[扫一扫]</div>
        
        <!-- 打开按钮 -->
        <a href="${payUrl}" class="btn-open">打开${platformName}付款</a>
      </div>
      
      <!-- 底部 -->
      <div class="footer">
        <span class="footer-text">支付得蚂蚁森林能量</span>
        <span class="sparkle">✨</span>
      </div>
      
      <script>
        function updateAmount() {
          const amount = document.getElementById('customAmount').value;
          if (amount) {
            location.href = location.pathname + '?amount=' + amount + '&name=${encodeURIComponent(name)}';
          }
        }
        
        function switchPlatform(platform) {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          event.target.classList.add('active');
          // 实际切换需要重新生成二维码，这里简化处理
          alert('请使用' + (platform === 'alipay' ? '支付宝' : '微信') + '扫一扫');
        }
        
        // 自动检测提示
        ${!isAlipay && !isWechat ? `
        setTimeout(() => {
          alert('📱 请使用支付宝或微信扫一扫\\n系统会自动识别您的客户端');
        }, 1000);
        ` : ''}
      </script>
    </body>
    </html>
  `);
});

// 聚合支付API
app.get("/api/qr", async (req, res) => {
  const amount = req.query.amount || "9.99";
  const name = req.query.name || "商家";
  
  const data = {
    alipay: ALIPAY_ACCOUNT ? {
      url: `alipays://platformapi/startapp?appId=20000123&actionType=toAccount&account=${ALIPAY_ACCOUNT}&amount=${amount}`,
      qr: await QRCode.toDataURL(`alipays://platformapi/startapp?appId=20000123&actionType=toAccount&account=${ALIPAY_ACCOUNT}&amount=${amount}`)
    } : null,
    wechat: WECHAT_PAY_URL ? {
      url: WECHAT_PAY_URL,
      qr: await QRCode.toDataURL(WECHAT_PAY_URL)
    } : null
  };
  
  res.json({ success: true, data });
});

app.get("/", (req, res) => {
  res.redirect("/pay");
});

app.listen(PORT, () => {
  console.log(`一码多付服务运行中: http://localhost:${PORT}`);
  console.log(`支付宝: ${ALIPAY_ACCOUNT ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`微信: ${WECHAT_PAY_URL ? '已配置 ✓' : '未配置 ✗'}`);
});
