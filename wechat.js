import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

export async function createWxOrder(outTradeNo, totalAmount, subject) {
  const mchId = process.env.WECHAT_MCH_ID;
  const appId = process.env.WECHAT_APP_ID;
  if (!mchId || !appId) {
    console.warn('微信支付未配置，返回模拟数据');
    return { success: false, qrCode: `weixin://wxpay/bizpayurl?pr=${outTradeNo}`, outTradeNo, message: '微信支付未配置真实API' };
  }
  return { success: true, qrCode: `weixin://wxpay/bizpayurl?pr=${outTradeNo}`, outTradeNo, message: '微信支付订单已创建（演示模式）' };
}

export async function queryWxOrder(outTradeNo) {
  return { success: true, tradeState: 'NOTPAY', outTradeNo };
}

function generateWxSign(params, apiKey) {
  const sortedKeys = Object.keys(params).sort();
  const stringA = sortedKeys.filter(key => params[key] !== undefined && params[key] !== '').map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHash('md5').update(stringA + '&key=' + apiKey).digest('hex').toUpperCase();
}
