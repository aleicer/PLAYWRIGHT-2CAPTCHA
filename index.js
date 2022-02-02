//@ts-check
// ...
//TODO: este codigo es el mas complejo puede funcionar pero hay que mejorar la espera de las promesas
const { chromium } = require('playwright')
const poll = require('promise-poller').default;
const request = require('request-promise-native')

const config = {
  sitekey: '6LcCR2cUAAAAANS1Gpq_mDIJ2pQuJphsSQaUEuc9',
  pageurl: 'https://drogueriasunoa.com/challenge',
  apiKey: 'AQUI_LA_LLAVE',
  apiSummitUrl: 'http://2captcha.com/in.php',
  apiRetrieveUrl: 'http://2captcha.com/res.php'
}
let email = 'kiplanner.app@gmail.com'
let passwoed = 'dr0gu3r13s_un0_4_KI'
// login
let loginUrl = 'https://drogueriasunoa.com/account/login'
let emailField = '#CustomerEmail'
let passwordField = '#CustomerPassword'
let loginButton = '.btn[value="Registrarse"]'
// captcha
let sendCaptcha = '.shopify-challenge__button';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(loginUrl, { waitUntil: 'networkidle' })
  await page.fill(emailField,email)
  await page.fill(passwordField, passwoed)
  await page.click(loginButton)
  // await page.waitForNavigation()
  const requestId = initiateCaptchaRequest(config.apiKey)
  await page.waitForSelector(sendCaptcha)
  const response = await pollForRequestResults(config.apiKey, requestId)
  await page.evaluate(`document.getElementById('g-recaptcha-response').innerHTML="${response}";`)
  await page.click(sendCaptcha)
  

})();

async function initiateCaptchaRequest(apiKey){
  const formData = {
    method: 'userrecaptcha',
    googlekey: config.sitekey,
    key: apiKey,
    pageurl: config.pageurl,
    json: 1
  }
  console.log(`Enviando solicitud de 2captcha ${config.pageurl}`)
  const response = await request.post(config.apiSubmitUrl, {form: formData})
  return JSON.parse(response).request;
}

async function pollForRequestResults(key, id, retries = 30, interval = 1500, delay = 15000){
  console.log(`esperando por ${delay} milisegundos`)
  await timeout(delay)
  return poll({
    taskFn: requestCaptchaResult(key, id),
    interval,
    retries
  });
}

function requestCaptchaResult(apiKey, requestId) {
  const url = `${config.apiRetrieveUrl}?key=${apiKey}&action=get&id=${requestId}&json=1`
  return async function () {
    return new Promise (async function (resolve, reject){
      console.log('sondeo de respuesta...')
      const rawResponse = await request.get(url)
      const resp = JSON.parse(rawResponse)
      if (resp.status === 0) return reject(resp.request)
      console.log('Respuesta recibida...')
      resolve(resp.request)
    })
  }
}

const timeout = ms => new Promise (res => setTimeout (res, ms))