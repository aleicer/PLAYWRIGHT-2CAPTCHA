//@ts-check
// ...
//TODO: este fue el primer codigo que use en un principio me dio una respuesta pero no se que paso y no volvio a funcionar
//* https://www.npmjs.com/package/@extra/recaptcha
const Client = require('@infosimples/node_two_captcha');
let client = new Client('8d88b41ce8eed43ed8bcbd83bfe7f740', {
  timeout: 60000,
  polling: 5000,
  throwErrors: true});
  
  client.decodeRecaptchaV3 ({
    googlekey: '6LeoeSkTAAAAAA9rkZs5oS82l69OEYjKRZAiKdaF',
    pageurl: 'https://drogueriasunoa.com/challenge',
    action: 'test',
    enterprise: false
  }).then(function(response) {
    console.log(response.text);
  });
  
//TODO: Con este codigo no he probado pero se ve prometedor es directamente un ejemplo de playwright y 2captcha
//* https://blog.outsider.ne.kr/1547
const playwright = require('playwright');
const {got} = require('got');

const ID = process.env.ID;
const PASSWORD = process.env.PASSWORD;

(async () => {
  const browser = await playwright.chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // login page
  await page.goto('https://www.walmart.com/account/login');

  // enter email
  await page.type('#email', ID, {delay: 100});
  await page.screenshot({ path: 'img/id.png' });

  // check password field in a form
  const hasPassword = await page.$('#sign-in-form');
  if (hasPassword) {
    console.log('has password field')
    // enter password
    await page.type('#password', PASSWORD, {delay: 100});
    await page.screenshot({ path: 'img/password.png' });
  } else {
    console.log('no password field')
    await page.click('#sign-in-with-email-validation [type=submit]');

    // enter password
    await page.type('#sign-in-password-no-otp', PASSWORD, {delay: 100});
    await page.screenshot({ path: 'img/password.png' });

    // login
    await page.click('#sign-in-with-password-form [type=submit]');
  }

  // login
  await page.click('#sign-in-form [type=submit]');

  // retrive data from recaptcha
  const recaptcha = await page.waitForSelector('.g-recaptcha');
  const sitekey = await recaptcha.getAttribute('data-sitekey');
  const currentUrl = await page.url();

  // 2captcha
  const APIKEY = process.env.APIKEY;
  const twoCaptchaURL = `https://2captcha.com/in.php?key=${APIKEY}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${currentUrl}`;

  let requestId;
  try {
    const response = await got(twoCaptchaURL);
    const result = response.body;
    if (result.startsWith('OK|')) {
      requestId = result.split('|')[1];
      console.log('RequestId: ' + requestId);
    } else {
      throw new Error(`Wrong response: ${result}`);
    }
  } catch(e) {
    console.log(e.response.body);
    await browser.close();
  }

  const resultUrl = `https://2captcha.com/res.php?key=${APIKEY}&action=get&id=${requestId}`;
  const getCaptchaResult = () => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const response = await got(resultUrl);
          resolve(response.body);
        } catch(e) {
          reject(e.response.body);
        }
      }, 10000);
    });
  };


  let answer;
  let isNotSolved = true;
  while(isNotSolved) {
    try {
      const result = await getCaptchaResult();
      if (result.startsWith('OK|')) {
        answer = result.split('|')[1];
        isNotSolved = false;
      } else {
        throw new Error(`Wrong response: ${result}`);
      }
      console.log(result);
    } catch(e) {
      console.log('error')
      console.log(e);
    }
  }

  // enter recaptcha answer
  await page.$eval('#g-recaptcha-response', el => {
    el.style.display = 'block';
  });
  await page.fill('#g-recaptcha-response', answer, { delay: 30 });

  await page.evaluate((answer) => {
    handleCaptcha(answer);
  }, answer);

  setTimeout(async () => {
    await page.screenshot({ path: 'img/complated.png' });
    await browser.close();
  }, 5000);
})();