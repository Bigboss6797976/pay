import express from "express";
import QRCode from "qrcode";

const app = express();
const PORT = process.env.PORT || 3000;

// 你的支付宝账号（必须设置！）
const ALIPAY_ACCOUNT = process.env.ALIPAY_ACCOUNT || "13800138000"; // 改成你的手机号/邮箱

app.get("/pay", async (req, res) => {
  const amount = req.query.amount || "9.99";
  const subject = req.query.subject || "付款";
  
  // 生成支付宝转账链接（金额自动填入）
  const alipayUrl = `alipays://platformapi/startapp?appId=20000123&actionType=toAccount&goBack=NO&amount=${amount}&memo=${encodeURIComponent(subject)}&account=${ALIPAY_ACCOUNT}`;
  
  // 生成二维码
  const qrImage = await QRCode.toDataURL(alipayUrl);
  
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>扫码付款 ¥${amount}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, sans-serif; background: #1677FF; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 1.2rem; opacity: 0.9; margin-bottom: 10px; }
        .amount { font-size: 3.5rem; font-weight: bold; }
        .qr-box { background: white; padding: 20px; border-radius: 20px; margin: 20px 0; }
        .qr-box img { width: 260px; height: 260px; display: block; }
        .tip { font-size: 1rem; margin: 15px 0; opacity: 0.9; text-align: center; }
        .btn { background: white; color: #1677FF; padding: 16px 50px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 1.1rem; border: none; margin-top: 10px; }
        .account { font-size: 0.85rem; opacity: 0.7; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>向 ${ALIPAY_ACCOUNT} 付款</h1>
        <div class="amount">¥${amount}</div>
      </div>
      <div class="qr-box">
        <img src="${qrImage}" alt="支付宝付款码">
      </div>
      <p class="tip">请使用支付宝扫一扫<br>或点击下方按钮</p>
      <button onclick="window.location.href='${alipayUrl}'" class="btn">打开支付宝付款</button>
      <p class="account">收款账户: ${ALIPAY_ACCOUNT}</p>
    </body>
    </html>
  `);
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>收款页面</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
        .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
        input { width: 100%; padding: 15px; font-size: 1.2rem; border: 2px solid #1677FF; border-radius: 10px; margin: 10px 0; text-align: center; }
        button { background: #1677FF; color: white; padding: 15px 50px; border: none; border-radius: 30px; font-size: 1.1rem; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>输入金额生成收款码</h2>
        <input type="number" id="amount" placeholder="0.00" step="0.01" value="9.99">
        <br>
        <button onclick="location.href='/pay?amount='+document.getElementById('amount').value">生成付款码</button>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`服务运行: http://localhost:${PORT}`);
  console.log(`收款账户: ${ALIPAY_ACCOUNT}`);
});
