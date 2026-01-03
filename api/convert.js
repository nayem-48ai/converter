const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

export default async function handler(req, res) {
    // CORS এবং মেথড চেক
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { url, type } = req.query;

    if (!url) {
        return res.status(400).send("Error: URL parameter is missing.");
    }

    let browser = null;

    try {
        // Chromium সেটআপ
        browser = await puppeteer.launch({
            args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // ভিউপোর্ট সেটআপ
        await page.setViewport({ width: 1280, height: 800 });

        // পেজ লোড হওয়া পর্যন্ত অপেক্ষা
        await page.goto(url, { 
            waitUntil: "networkidle0", 
            timeout: 0 
        });

        if (type === "pdf") {
            const pdf = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
            });
            res.setHeader("Content-Type", "application/pdf");
            return res.send(pdf);
        } else {
            const image = await page.screenshot({ 
                fullPage: true, 
                type: "png" 
            });
            res.setHeader("Content-Type", "image/png");
            return res.send(image);
        }

    } catch (error) {
        console.error("Browser Error:", error);
        return res.status(500).send("Error generating file: " + error.message);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}
