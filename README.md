# Shopify to Google Sheets

This is a function to pull inventory quantity and value for each variant in a Shopify store and output to a Google Sheet. 

This can be run locally or hosted and scheduled on a cadence. 

### Requirements:
1. Node, Google Account, Shopify Account

### Setup:

1. `npm install`
    - Installs fetch; `npm install node-fetch`
    - Installs google api; `npm install googleapis@39`
2. Create project in [Google Developer Console](https://console.developers.google.com/)
    - New project
    - Enable Google Sheets API
    - Create credentials:
        - API: Google Sheets API
        - Calling from: Web server
        - Accessing: Application data
        - App or compute engine: No
        - Service account name: Your choice (save service account email for later)
        - Role: Editor
        - Key type: JSON
3. Rename downloaded credentials file to keys.json and add to your project folder.
4. Add app in [Shopify](https://accounts.shopify.com/store-login)
    - Apps (left sidebar)
    - Manage private apps (very bottom)
    - Enable private app development
    - Accept terms
    - Create private app
    - Add name and email
    - Add 2 permissions:
        - Products - Read access
        - Inventory - Read access
    - Save. Create app.
    - Copy password to clipboard
5. In keys.json file, add another line item: `"shopify": "password"` (replace password)
6. Create a new Google Sheets spreadsheet.
    - In Share (top right), add the email of the service account you created in #2 and give it Editor permissions.
7. At the top of index.js file, update 3 variables:
    - Shopify store name (without .myshopify.com)
    - ID of the spreadsheet created in #6 (in URL)
    - Name of the sheet to write to


