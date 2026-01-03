const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

export default async function handler(req, res) {
    const { url, type } = req.query;

    if (!url) {
        return res.status(400).send("URL is required");
    }

    let browser = null;

    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width: 1280, height: 720 },
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        // রেজাল্ট পেজ লোড হওয়া পর্যন্ত অপেক্ষা করবে
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

        if (type === "pdf") {
            const pdf = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" }
            });
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "inline; filename=result.pdf");
            return res.send(pdf);
        } else {
            const image = await page.screenshot({ fullPage: true, type: "png" });
            res.setHeader("Content-Type", "image/png");
            return res.send(image);
        }

    } catch (error) {
        console.error(error);
        return res.status(500).send("Error generating file: " + error.message);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}
