import chrome from "chrome-aws-lambda";
import pptr, {PaperFormat} from "puppeteer-core";

import type {VercelRequest, VercelResponse} from "@vercel/node";

const str = (x: string | string[]) => (Array.isArray(x) ? x[0] : x);

const allowed: PaperFormat[] = [
  "letter",
  "legal",
  "tabloid",
  "ledger",
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
];
function validFormat(x: any): x is PaperFormat {
  return allowed.includes(x);
}
export default async (request: VercelRequest, response: VercelResponse) => {
  let {url, format = "a3"} = request.query;
  url = str(url);
  format = str(format);
  if (!validFormat(format)) {
    return response.send({error: "invalid format"});
  }
  try {
    new URL(url);
  } catch (e) {
    return response.send({error: "invalid url"});
  }
  const options = process.env.AWS_REGION
    ? {
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
      }
    : {};
  const browser = await pptr.launch(options);
  const page = await browser.newPage();
  await page.goto(url, {waitUntil: "networkidle2"});
  const resp = await page.pdf({format});
  response.setHeader("content-type", "application/pdf");
  return response.send(resp);
};
