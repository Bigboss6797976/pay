import express from "express";
import QRCode from "qrcode";

const app = express();
const PORT = process.env.PORT || 3000;

const ALIPAY_ACCOUNT = process.env.ALIPAY_ACCOUNT || "";

app.get("/pay", async (req, res) => {
  const amount = req.query.amount || "";
  const name = req.query.name || "商家";
  
  if (!ALIPAY_ACCOUNT) {
    return res.send("请设置 ALIPAY_ACCOUNT 环境变量");
  }
  
  const alipayUrl = `alipays://platformapi/startapp?appId=20000123&actionType=toAccount&goBack=NO&account=${ALIPAY_ACCOUNT}&amount=${amount}&memo=${encodeURIComponent(name)}`;
  const qrImage = await QRCode.toDataURL(alipayUrl);
  
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>支付宝收款码</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
          background: #1677FF;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
        }
        
        /* 顶部支付宝Logo */
        .header {
          padding: 15px 0 10px;
          text-align: center;
        }
        .alipay-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .alipay-icon {
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1677FF;
          font-size: 1.4rem;
          font-weight: bold;
        }
        .alipay-text {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: 2px;
        }
        
        /* 推荐使用支付宝 */
        .recommend {
          color: white;
          font-size: 1.6rem;
          font-weight: 700;
          margin: 5px 0 30px;
          letter-spacing: 3px;
        }
        
        /* 二维码区域 */
        .qr-container {
          position: relative;
          width: 300px;
          min-height: 380px;
          background: white;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          margin: 0 auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        }
        
        /* 绿色能量标签 */
        .energy-tag {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7ED321 0%, #A8E063 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #2E7D32;
          font-size: 0.65rem;
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
          width: 220px;
          height: 220px;
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
          margin-top: 15px;
        }
        
        /* 底部 */
        .footer {
          margin-top: auto;
          padding: 30px 20px 40px;
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
          letter-spacing: 1px;
        }
        .sparkle {
          color: #FFD700;
          font-size: 1.3rem;
          animation: sparkle 2s infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      </style>
    </head>
    <body>
      <!-- 顶部支付宝Logo -->
      <div class="header">
        <div class="alipay-logo">
          <div class="alipay-icon">支</div>
          <div class="alipay-text">支付宝</div>
        </div>
      </div>
      
      <!-- 推荐使用支付宝 -->
      <div class="recommend">推荐使用支付宝</div>
      
      <!-- 二维码区域 -->
      <div class="qr-container">
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
        
        <!-- 二维码 -->
        <div class="qr-box">
          <img src="${qrImage}" alt="支付宝收款码">
        </div>
        
        <!-- 扫码提示 -->
        <div class="scan-tip">打开支付宝[扫一扫]</div>
      </div>
      
      <!-- 底部 -->
      <div class="footer">
        <span class="footer-text">支付得蚂蚁森林能量</span>
        <span class="sparkle">✨</span>
      </div>
    </body>
    </html>
  `);
});

app.get("/", (req, res) => {
  res.redirect("/pay");
});

app.listen(PORT, () => {
  console.log(`运行中: http://localhost:${PORT}`);
});
