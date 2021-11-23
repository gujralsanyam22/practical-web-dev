const puppeteer = require("puppeteer");
const excel = require("excel4node");
const pdfDoc = require("pdfkit");
const fs = require("fs");
const links = [
    "https://www.amazon.in",
    "https://www.flipkart.com",
    "https://paytmmall.com/",
];

let pName = "iphone 11";
let amazon_gtab;
let flipkart_gtab;
let paytmmall_gtab;


(async function () {
    try {
        let browserReference = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized"],
        });
        let page = await browserReference.pages();
        let amazonDetails = await getListingFromAmazon(
            pName,
            links[0],
            page, // follow a current tab, in current tab we open the  amazon link.
        );
        let flipkartDetails = await getListingFromFlipkart(
            pName,
            links[1],
            browserReference
        );
        let paytmmallDetails = await getListingFromPaytm(
            pName,
            links[2],
            browserReference
        );
        makeExcel(amazonDetails, paytmmallDetails, flipkartDetails);
        makePDF(amazonDetails, paytmmallDetails, flipkartDetails);
        console.table(amazonDetails);
        console.table(flipkartDetails);
        console.table(paytmmallDetails);
        await browserReference.close();
    } catch (err) {
        console.log(err);
    }
})();

async function getListingFromAmazon(pName, link, page) {
    amazon_gtab = page[0];
    await amazon_gtab.goto(link);
    await amazon_gtab.type("#twotabsearchtextbox", pName);
    await amazon_gtab.click("#nav-search-submit-button");

    await amazon_gtab.waitForSelector(".a-price-whole", { visible: true });

    function consoleFn(pNameSelector, priceSelector) {
        let pNameArr = document.querySelectorAll(pNameSelector);
        let priceArr = document.querySelectorAll(priceSelector);

        let details = [];
        for (let i = 0; i < 5; i++) {
            let productName = pNameArr[i].innerText;
            let price = priceArr[i].innerText;

            details.push({
                Name: productName,
                Price: price,
            });
        }
        return details;
    }
    return amazon_gtab.evaluate(
        consoleFn,
        ".a-size-medium.a-color-base.a-text-normal",
        ".a-price-whole"
    );
}

async function getListingFromFlipkart(pName, link, browserReference) {
    flipkart_gtab = await browserReference.newPage();

    await flipkart_gtab.goto(link);

    await flipkart_gtab.waitForSelector("._2KpZ6l._2doB4z", { visible: true });
    await flipkart_gtab.click("._2KpZ6l._2doB4z");

    await flipkart_gtab.type("._3704LK", pName);
    await flipkart_gtab.click("._34RNph");

    await flipkart_gtab.waitForSelector("._4rR01T", { visible: true });

    function consoleFn(pNameSelector, priceSelector) {
        let pNamrArr = document.querySelectorAll(pNameSelector);
        let priceArr = document.querySelectorAll(priceSelector);

        let detailsArr = [];
        for (let i = 0; i < 5; i++) {
            let pName = pNamrArr[i].innerText;
            let price = priceArr[i].innerText;
            detailsArr.push({
                Name: pName,
                Price: price,
            });
        }
        return detailsArr;
    }
    return flipkart_gtab.evaluate(consoleFn, "._4rR01T", "._30jeq3._1_WHN1");
}

async function getListingFromPaytm(pName, link, browserReference) {
    paytmmall_gtab = await browserReference.newPage();

    await paytmmall_gtab.goto(link);
    await paytmmall_gtab.type("#searchInput", pName, { delay: 100 });
    await paytmmall_gtab.keyboard.press("Enter");

    await paytmmall_gtab.waitForSelector("._1kMS", { visible: true });

    function consoleFn(pNameSelector, priceSelector) {
        let pNamrArr = document.querySelectorAll(pNameSelector);
        let priceArr = document.querySelectorAll(priceSelector);

        let detailsArr = [];
        for (let i = 0; i < 5; i++) {
            let pName = pNamrArr[i].innerText;
            let price = priceArr[i].innerText;
            detailsArr.push({
                Name: pName,
                Price: price,
            });
        }
        return detailsArr;
    }
    return paytmmall_gtab.evaluate(consoleFn, ".UGUy", "._1kMS");
}

function makeExcel(amazonDetails, paytmDetails, flipkartDetails) {
    let excelPath = __dirname + "/Results/Excel";
    if (!fs.existsSync(__dirname + "/Results") && !fs.existsSync(excelPath)) {
        fs.mkdirSync(__dirname + "/Results");
        fs.mkdirSync(excelPath);
    }

    let wb = new excel.Workbook();
    let ws1 = wb.addWorksheet("Amazon Prices");
    let ws2 = wb.addWorksheet("Paytm Prices");
    let ws3 = wb.addWorksheet("Flipkart Prices");
    ws1.cell(1, 1).string("Name");
    ws1.cell(1, 2).string("Prices");
    ws2.cell(1, 1).string("Name");
    ws2.cell(1, 2).string("Prices");
    ws3.cell(1, 1).string("Name");
    ws3.cell(1, 2).string("Prices");
    for (let i = 0; i < amazonDetails.length; i++) {
        let j = 1;
        for (let values of Object.entries(amazonDetails[i])) {
            ws1.cell(i + 2, j).string(values[1]);
            j++;
        }
    }
    for (let i = 0; i < paytmDetails.length; i++) {
        let j = 1;
        for (let values of Object.entries(paytmDetails[i])) {
            ws2.cell(i + 2, j).string(values[1]);
            j++;
        }
    }
    for (let i = 0; i < flipkartDetails.length; i++) {
        let j = 1;
        for (let values of Object.entries(flipkartDetails[i])) {
            ws3.cell(i + 2, j).string(values[1]);
            j++;
        }
    }

    wb.write(excelPath + "/" + "results.xlsx");
}

function makePDF(amazonDetails, paytmmallDetails, flipkartDetails) {
    let pdfPath = __dirname + "/Results/" + "Pdf";
    if (!fs.existsSync(__dirname + "/Results")) {
        fs.mkdirSync(__dirname + "/Results");
    }
    if (!fs.existsSync(pdfPath)) {
        fs.mkdirSync(pdfPath);
    }
    let doc = new pdfDoc();
    doc.pipe(fs.createWriteStream(pdfPath + "/" + "results.pdf"));
    doc.fontSize(35).text("Iphone 11 Price Analysis\n\n");
    doc.fontSize(25).text("AMAZON PRICES\n\n");
    for (let i = 0; i < amazonDetails.length; i++) {
        for (let values of Object.entries(amazonDetails[i])) {
            doc.fontSize(20).text(`${values[1]}`);
        }
        doc.fontSize(20).text(`\n`);
    }
    doc.fontSize(20).text(`\n\n\n`);
    doc.fontSize(25).text("PAYTM MALL  PRICES\n\n");
    for (let i = 0; i < paytmmallDetails.length; i++) {
        for (let values of Object.entries(paytmmallDetails[i])) {
            doc.fontSize(20).text(`${values[1]}`);
        }
        doc.fontSize(20).text(`\n`);
    }
    doc.fontSize(20).text(`\n\n\n`);
    doc.fontSize(25).text("FLIPKART PRICES\n\n");
    for (let i = 0; i < flipkartDetails.length; i++) {
        for (let values of Object.entries(flipkartDetails[i])) {
            doc.fontSize(20).text(`${values[1]}`);
        }
        doc.fontSize(20).text(`\n`);
    }
    doc.save();
    doc.end();
    doc = new pdfDoc();
    doc.pipe(fs.createWriteStream(pdfPath + "/" + "amazonResults.pdf"));
    doc.fontSize(35).text("Iphone 11 Price Analysis\n\n");
    doc.fontSize(25).text("AMAZON PRICES\n\n");
    for (let i = 0; i < amazonDetails.length; i++) {
        for (let values of Object.entries(amazonDetails[i])) {
            doc.fontSize(20).text(`${values[1]}`);
        }
        doc.fontSize(20).text(`\n`);
    }
    doc.save();
    doc.end();

    doc = new pdfDoc();
    doc.pipe(fs.createWriteStream(pdfPath + "/" + "paytmResults.pdf"));
    doc.fontSize(35).text("Iphone 11 Price Analysis\n\n");
    doc.fontSize(25).text("PAYTIM PRICES\n\n");
    for (let i = 0; i < paytmmallDetails.length; i++) {
        for (let values of Object.entries(paytmmallDetails[i])) {
            doc.fontSize(20).text(`${values[1]}`);
        }
        doc.fontSize(20).text(`\n`);
    }
    doc.save();
    doc.end();

    doc = new pdfDoc();
    doc.pipe(fs.createWriteStream(pdfPath + "/" + "flipkartResults.pdf"));
    doc.fontSize(35).text("Iphone 11 Price Analysis\n\n");
    doc.fontSize(25).text("FLIPKART PRICES\n\n");
    for (let i = 0; i < flipkartDetails.length; i++) {
        for (let values of Object.entries(flipkartDetails[i])) {
            doc.fontSize(20).text(`${values[1]}`);
        }
        doc.fontSize(20).text(`\n`);
    }
    doc.save();
    doc.end();
}