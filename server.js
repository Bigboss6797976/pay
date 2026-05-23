import express from "express";
import QRCode from "qrcode";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { createAliOrder, queryAliOrder } from "./alipay.js";
import { createWxOrder, queryWxOrder } from "./wechat.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static('public'));

const activeOrders = new Map();

function detectClient(ua) {
  const userAgent = (ua || "").toLowerCase();
  if (userAgent.includes("alipayclient") || userAgent.includes("alipay")) return "alipay";
  if (userAgent.includes("micromessenger") || userAgent.includes("wechat")) return "wechat";
  return "unknown";
}

function generateOrderNo() {
  return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
}

app.get("/pay", async (req, res) => {
  try {
    const ua = req.headers["user-agent"] || "";
    const clientType = detectClient(ua);
    const amount = req.query.amount || "9.99";
    const subject = req.query.subject || "聚合支付商品";
    const orderNo = generateOrderNo();
    let payData, platform;

    if (clientType === "alipay") {
      platform = "alipay";
      payData = await createAliOrder(orderNo, parseFloat(amount), subject);
    } else if (clientType === "wechat") {
      platform = "wechat";
      payData = await createWxOrder(orderNo, parseFloat(amount), subject);
    } else {
      platform = "aggregate";
      payData = { qrCode: null };
    }

    activeOrders.set(orderNo, { platform, amount, subject, status: "pending", createdAt: new Date() });

    if (platform === "aggregate") {
      const aliOrder = await createAliOrder(orderNo + "_ALI", parseFloat(amount), subject);
      const wxOrder = await createWxOrder(orderNo + "_WX", parseFloat(amount), subject);
      const aliQr = await QRCode.toDataURL(aliOrder.qrCode || aliOrder.qr_code);
      const wxQr = await QRCode.toDataURL(wxOrder.qrCode);
      return res.send(generateAggregatePage(aliQr, wxQr, amount, subject, orderNo));
    }

    if (payData.qrCode || payData.qr_code) {
      const qrImage = await QRCode.toDataURL(payData.qrCode || payData.qr_code);
      return res.send(generatePayPage(qrImage, platform, amount, subject, orderNo));
    }
    res.status(500).send("支付二维码生成失败");
  } catch (err) {
    console.error("支付错误:", err);
    res.status(500).send(generateErrorPage(err.message));
  }
});

app.post("/api/order", async (req, res) => {
  try {
    const { amount, subject, platform } = req.body;
    const orderNo = generateOrderNo();
    let payData;
    if (platform === "alipay") {
      payData = await createAliOrder(orderNo, parseFloat(amount), subject);
    } else if (platform === "wechat") {
      payData = await createWxOrder(orderNo, parseFloat(amount), subject);
    } else {
      const aliData = await createAliOrder(orderNo + "_ALI", parseFloat(amount), subject);
      const wxData = await createWxOrder(orderNo + "_WX", parseFloat(amount), subject);
      payData = { alipay: aliData, wechat: wxData, orderNo };
    }
    activeOrders.set(orderNo, { platform: platform || "both", amount, subject, status: "pending", createdAt: new Date() });
    res.json({ success: true, orderNo, data: payData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/order/:orderNo/status", async (req, res) => {
  try {
    const { orderNo } = req.params;
    const order = activeOrders.get(orderNo);
    if (!order) return res.status(404).json({ success: false, message: "订单不存在" });
    let aliStatus, wxStatus;
    if (order.platform === "alipay" || order.platform === "both") {
      try { aliStatus = await queryAliOrder(orderNo + "_ALI"); } catch (e) { aliStatus = null; }
    }
    if (order.platform === "wechat" || order.platform === "both") {
      try { wxStatus = await queryWxOrder(orderNo + "_WX"); } catch (e) { wxStatus = null; }
    }
    res.json({ success: true, orderNo, status: order.status, aliStatus: aliStatus?.tradeStatus || "UNKNOWN", wxStatus: wxStatus?.tradeState || "UNKNOWN", amount: order.amount, subject: order.subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/notify/alipay", express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { out_trade_no, trade_status } = req.body;
    console.log("支付宝回调:", out_trade_no, trade_status);
    if (trade_status === "TRADE_SUCCESS" || trade_status === "TRADE_FINISHED") {
      const order = activeOrders.get(out_trade_no.replace("_ALI", ""));
      if (order) { order.status = "paid"; order.paidAt = new Date(); }
    }
    res.send("success");
  } catch (err) { res.status(500).send("fail"); }
});

function generateAggregatePage(aliQr, wxQr, amount, subject, orderNo) {
  const appName = process.env.APP_NAME || "聚合收款";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>${appName} - 扫码支付</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="manifest" href="/manifest.json">
</head>
<body>
  <div class="app-container">
    <header class="app-header">
      <div class="logo">💰 ${appName}</div>
      <p class="subtitle">一码多付 · 智能识别</p>
    </header>
    <main class="pay-main">
      <div class="amount-display"><span class="currency">¥</span><span class="amount">${amount}</span></div>
      <p class="subject">${subject}</p>
      <p class="order-info">订单号: ${orderNo}</p>
      <div class="qr-tabs">
        <button class="tab-btn active" data-tab="alipay"><span class="tab-icon">🔵</span><span>支付宝</span></button>
        <button class="tab-btn" data-tab="wechat"><span class="tab-icon">🟢</span><span>微信支付</span></button>
      </div>
      <div class="qr-content">
        <div class="qr-panel active" id="alipay-panel">
          <div class="qr-box"><img src="${aliQr}" alt="支付宝收款码" class="qr-img"><div class="qr-overlay"><span class="platform-badge alipay">支付宝</span></div></div>
          <p class="qr-tip">请使用支付宝扫一扫</p>
        </div>
        <div class="qr-panel" id="wechat-panel">
          <div class="qr-box"><img src="${wxQr}" alt="微信收款码" class="qr-img"><div class="qr-overlay"><span class="platform-badge wechat">微信支付</span></div></div>
          <p class="qr-tip">请使用微信扫一扫</p>
        </div>
      </div>
      <div class="countdown"><span class="timer-icon">⏱️</span><span>二维码有效期: <span id="countdown">10:00</span></span></div>
      <div class="status-bar"><span class="status-dot pending"></span><span id="status-text">等待支付...</span></div>
    </main>
    <footer class="app-footer"><p>🔒 安全支付 · 由 ${appName} 提供技术支持</p><p class="order-id">订单: ${orderNo}</p></footer>
  </div>
  <script src="/js/app.js"></script>
  <script>const orderNo="${orderNo}";pollOrderStatus(orderNo);startCountdown(600);</script>
</body>
</html>`;
}

function generatePayPage(qrImage, platform, amount, subject, orderNo) {
  const appName = process.env.APP_NAME || "聚合收款";
  const platformName = platform === "alipay" ? "支付宝" : "微信支付";
  const platformColor = platform === "alipay" ? "#1677FF" : "#07C160";
  const platformIcon = platform === "alipay" ? "🔵" : "🟢";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>${platformName}支付 - ${appName}</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="app-container single-pay">
    <header class="app-header" style="background: ${platformColor}"><div class="logo">${platformIcon} ${platformName}支付</div></header>
    <main class="pay-main">
      <div class="amount-display"><span class="currency">¥</span><span class="amount">${amount}</span></div>
      <p class="subject">${subject}</p>
      <div class="qr-box single"><img src="${qrImage}" alt="${platformName}收款码" class="qr-img"></div>
      <p class="qr-tip">请使用${platformName}扫一扫完成支付</p>
      <div class="countdown"><span class="timer-icon">⏱️</span><span>二维码有效期: <span id="countdown">10:00</span></span></div>
      <div class="status-bar"><span class="status-dot pending"></span><span id="status-text">等待支付...</span></div>
    </main>
    <footer class="app-footer"><p>${appName} · 安全支付</p></footer>
  </div>
  <script src="/js/app.js"></script>
  <script>pollOrderStatus("${orderNo}");startCountdown(600);</script>
</body>
</html>`;
}

function generateErrorPage(message) {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>支付错误</title><link rel="stylesheet" href="/css/style.css"></head><body><div class="app-container error-page"><div class="error-icon">❌</div><h2>支付初始化失败</h2><p class="error-msg">${message}</p><button onclick="location.reload()" class="retry-btn">重新尝试</button></div></body></html>`;
}

app.get("/", (req, res) => { res.sendFile("views/index.html", { root: process.cwd() }); });

app.listen(PORT, () => {
  console.log(`\\n🚀 ${process.env.APP_NAME || "聚合收款"} 服务运行中...`);
  console.log(`📱 本地访问: http://localhost:${PORT}`);
  console.log(`💳 支付入口: http://localhost:${PORT}/pay?amount=9.99&subject=测试商品`);
  console.log(`\\n⚙️  环境: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔑 支付宝: ${process.env.ALIPAY_APP_ID ? "已配置 ✓" : "未配置 ✗"}`);
  console.log(`💬 微信: ${process.env.WECHAT_MCH_ID ? "已配置 ✓" : "未配置 ✗"}`);
});
