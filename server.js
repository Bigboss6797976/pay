import express from "express";
import QRCode from "qrcode";

const app = express();
const PORT = process.env.PORT || 3000;

const QR_IMAGE = process.env.QR_IMAGE || "";

app.get("/pay", async (req, res) => {
  const amount = req.query.amount || "9.99";
  const name = req.query.name || "商家";
  const energy = Math.floor(parseFloat(amount) * 10);
  
  let qrImage;
  if (QR_IMAGE) {
    qrImage = QR_IMAGE;
  } else {
    const payUrl = `alipays://platformapi/startapp?appId=20000067&amount=${amount}`;
    qrImage = await QRCode.toDataURL(payUrl);
  }
  
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>向${name}付款 ¥${amount}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
          background: #1677FF; 
          min-height: 100vh; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          color: white;
        }
        .header { 
          padding: 40px 20px 20px; 
          text-align: center; 
          width: 100%;
        }
        .payee-name { 
          font-size: 1rem; 
          opacity: 0.9; 
          margin-bottom: 10px;
        }
        .amount { 
          font-size: 4rem; 
          font-weight: 600; 
          letter-spacing: -2px;
        }
        .currency { 
          font-size: 2rem; 
          margin-right: 4px;
        }
        .qr-section { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          padding: 20px;
        }
        .qr-box { 
          background: white; 
          padding: 15px; 
          border-radius: 16px; 
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        .qr-box img { 
          width: 260px; 
          height: 260px; 
          display: block; 
          border-radius: 8px;
        }
        .energy-tag { 
          display: flex; 
          align-items: center; 
          background: linear-gradient(135deg, #00C853, #69F0AE); 
          color: white; 
          padding: 10px 24px; 
          border-radius: 24px; 
          font-size: 0.95rem; 
          margin-top: 20px;
          box-shadow: 0 4px 12px rgba(0,200,83,0.3);
        }
        .energy-tag::before { 
          content: "🌱"; 
          margin-right: 8px; 
          font-size: 1.3rem;
        }
        .footer { 
          padding: 30px 20px 40px; 
          text-align: center;
        }
        .btn-open { 
          display: inline-block; 
          background: white; 
          color: #1677FF; 
          padding: 16px 60px; 
          border-radius: 30px; 
          text-decoration: none; 
          font-size: 1.1rem; 
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        .account { 
          margin-top: 15px; 
          font-size: 0.85rem; 
          opacity: 0.7;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="payee-name">向 ${name} 付款</div>
        <div class="amount"><span class="currency">¥</span>${amount}</div>
      </div>
      
      <div class="qr-section">
        <div class="qr-box">
          <img src="${qrImage}" alt="支付宝收款码">
        </div>
        <div class="energy-tag">🌱 付款可得 ${energy}g 蚂蚁森林能量</div>
      </div>
      
      <div class="footer">
        <a href="alipays://platformapi/startapp?appId=20000067" class="btn-open">打开支付宝</a>
        <div class="account">收款账户: ${name}</div>
      </div>
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
      <title>蚂蚁能量收款码生成器</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: white; border-radius: 20px; padding: 30px; width: 100%; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        h2 { text-align: center; color: #1677FF; margin-bottom: 25px; font-size: 1.4rem; }
        .input-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: #666; font-size: 0.9rem; }
        input { width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 1rem; }
        input:focus { border-color: #1677FF; outline: none; }
        button { width: 100%; padding: 16px; background: #1677FF; color: white; border: none; border-radius: 12px; font-size: 1.1rem; font-weight: bold; cursor: pointer; }
        .preview { margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>🌱 蚂蚁能量收款码</h2>
        <div class="input-group">
          <label>收款人名称</label>
          <input type="text" id="name" value="商家" placeholder="输入收款人名称">
        </div>
        <div class="input-group">
          <label>收款金额</label>
          <input type="number" id="amount" value="9.99" step="0.01">
        </div>
        <div class="input-group">
          <label>收款码图片链接（可选）</label>
          <input type="text" id="qrUrl" placeholder="https://i.ibb.co/xxx/qr.png">
        </div>
        <button onclick="generate()">生成蚂蚁能量收款码</button>
        <div class="preview" id="preview"></div>
      </div>
      <script>
        function generate() {
          const name = document.getElementById('name').value;
          const amount = document.getElementById('amount').value;
          const qrUrl = document.getElementById('qrUrl').value;
          const energy = Math.floor(parseFloat(amount) * 10);
          const url = location.origin + '/pay?amount=' + amount + '&name=' + encodeURIComponent(name) + (qrUrl ? '&qr=' + encodeURIComponent(qrUrl) : '');
          document.getElementById('preview').innerHTML = 
            '<p style="margin:20px 0;color:#666">🌱 预计获得 ' + energy + 'g 能量</p>' +
            '<a href="' + url + '" style="display:inline-block;padding:12px 30px;background:#1677FF;color:white;border-radius:8px;text-decoration:none;">查看收款码</a>';
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`运行中: http://localhost:${PORT}`));
