import AlipaySdk from 'alipay-sdk';
import dotenv from 'dotenv';
dotenv.config();

const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY?.replace(/\\\\n/g, '\n'),
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY?.replace(/\\\\n/g, '\n'),
  gateway: 'https://openapi.alipay.com/gateway.do',
  timeout: 5000,
  camelcase: true,
});

export async function createAliOrder(outTradeNo, totalAmount, subject) {
  try {
    const result = await alipaySdk.exec('alipay.trade.precreate', {
      notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
      bizContent: {
        outTradeNo: outTradeNo,
        totalAmount: totalAmount.toString(),
        subject: subject,
        timeoutExpress: '10m',
      },
    });
    if (result.code === '10000') {
      return { success: true, qrCode: result.qrCode, outTradeNo, orderId: result.tradeNo };
    } else {
      throw new Error(result.msg || '支付宝订单创建失败');
    }
  } catch (error) {
    console.error('支付宝订单创建错误:', error);
    throw error;
  }
}

export async function queryAliOrder(outTradeNo) {
  try {
    const result = await alipaySdk.exec('alipay.trade.query', {
      bizContent: { outTradeNo },
    });
    return result;
  } catch (error) {
    console.error('支付宝订单查询错误:', error);
    throw error;
  }
}
