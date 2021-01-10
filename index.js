// REQUIREMENTS: NodeJS, Node Fetch, Google API, Google Account, Shopify Account
// See README for setup instructions.
const fetch = require('node-fetch');
const {google} = require('googleapis');
const keys = require('./keys.json');
const password = keys.shopify // add your own keys.json file from Google and add your Shopify app password (see README)
// TO DO - UPDATE THESE VARIABLES
const store = 'test-store' // your store (without .myshopify.com)
const gsheetsId = 'abcdefghijklmnopqrstuvwxyz' // id of the spreadsheet workbook (in url)
const sheetName = 'Sheet1' // the sheet to write to

// auth google
const client = new google.auth.JWT(
    keys.client_email, 
    null, 
    keys.private_key, 
    ['https://www.googleapis.com/auth/spreadsheets']
);

// delay for shopify rate limits
const delay = () => {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve();
      }, 500);
    });
  };

// google sheets clear and write
async function gsRun (cl, data) {
    const gsapi = google.sheets({
        version: 'v4',
        auth: cl
    });
    
    // clear sheet params
    const clear = {
        spreadsheetId: gsheetsId,
        range: `${sheetName}!A:J`,
        resource: {
            "range": `${sheetName}!A:J`
        },
        auth: cl
    };

    // update sheet params
    const update = {
        spreadsheetId: gsheetsId,
        range: `${sheetName}!A:J`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            "range": `${sheetName}!A:J`,
            "majorDimension": "ROWS",
            "values": data,
        },
        auth: cl
    };
  
    // clear and update
    try {
      //const clearResp = (await gsapi.spreadsheets.batchUpdate(clear)).data;
      const clearResp = (await gsapi.spreadsheets.values.clear(clear)).data;
      console.log("Sheet cleared");
      const updateResp = (await gsapi.spreadsheets.values.update(update)).data;
      console.log("Update complete");
    } catch (err) {
      console.error(err);
    }
};

// shopify fetch
async function getProducts() {
    const header = {
        'X-Shopify-Access-Token': password
    }
    let nextToken
    const rootUrl = `https://${store}.myshopify.com/admin/api/2021-01/`
    let productUrl = rootUrl + `products.json?limit=50`

    let output = []

    // fetch product data - paginated results
    do {
        try {
            const res = await fetch(productUrl, {method: 'GET', headers: header});
            const data = await res.json();
            data.products.forEach(element => {
                let obj = {
                    product_id: element.id,
                    product_title: element.title
                }
                element.variants.forEach(element => {
                    obj.variant_id = element.id
                    obj.variant_title = element.title
                    obj.sku = element.sku
                    obj.price = element.price
                    obj.inventory_id = element.inventory_item_id
                    obj.inventory_quantity = element.inventory_quantity
                })
                output.push(obj)
            });
            // paginated results.. if next page is present, get token; else, stop while loop
            if (res.headers.get('link').includes("next")) {
                // parse token
                if (res.headers.get('link').includes("previous")) {
                    nextToken = res.headers.get('link').split('previous')[1].split('page_info=')[1].split('>')[0]
                    productUrl = rootUrl + `products.json?limit=50&page_info=${nextToken}`
                } else {
                    nextToken = res.headers.get('link').split('page_info=')[1].split('>')[0]
                    productUrl = rootUrl + `products.json?limit=50&page_info=${nextToken}`
                }
            } else {
                productUrl = false
            }
        } catch (err) {
            console.error(err)
        }

    } while (productUrl)

    // fetch cost data w/ delay for shopify rate limits
    for (i = (output.length - 1); i >= 0; i--) {
        let inventory_id = output[i].inventory_id
        let inventoryUrl = rootUrl + `inventory_items/${inventory_id}.json`
        const costRes = await fetch(inventoryUrl, {method: 'GET', headers: header});
        const costData = await costRes.json();
        output[i].cost = costData.inventory_item.cost
        output[i].inventory_value = output[i].cost * output[i].inventory_quantity
        console.log(i);
        await delay();
    }

    // format for google
    let writeData = output.map(function(obj) {
        return Object.keys(obj).map(function(key) { 
          return obj[key];
        });
    });

    // add headers & run datetime
    const columnHeaders = [
        'product_id', 'product_title', 'variant_id',
        'variant_title', 'sku', 'price',
        'inventory_id', 'inventory_quantity', 'cost_per_unit',
        'inventory_value'
    ]
    const currentDate = new Date().toString(); 
    writeData.unshift(columnHeaders)
    writeData.unshift([currentDate])

    // auth google and run gsRun
    client.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            return;
        } else {
            gsRun(client, writeData);
        }
    });
};

getProducts()