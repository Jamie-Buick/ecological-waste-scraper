# Ecological Waste Collection - County Louth, Ireland
This is a Typescript-based Node.js script that scrapes your account balance and the  collection schedule from [Ecological](https://my.ecological.ie/). The output is a JSON object. The main objective for this simple project is to integrate into Home Assistant.

## Prerequisites
* [Node.js](https://nodejs.org/) (LTS version recommended)
* A [Home Assistant](https://www.home-assistant.io/) instance
* An active account on `my.ecological.ie


## Installation

1. **Clone or download** this repository.
2. **Install dependencies**:
   ```bash
   npm install axios cheerio axios-cookiejar-support tough-cookie dotenv
3. **Create .env within root folder and add your log in details**
    ```
    ECOLOGICAL_USER=your_username
    ECOLOGICAL_PASS=your_password


## Local Console Usage
 ```
    node index.ts