import axios from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import 'dotenv/config'; 

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const HA_URL = process.env.HA_URL; 
const HA_TOKEN = process.env.HA_TOKEN;

interface BinData {
    balance: string | null;
    collections: { date: string; day: string; type: string }[];
}


async function main() {

    const data : BinData = {
        balance: null,
        collections: []
    };

    // Get CSRF Token and log in 
    const csrfToken = await getLoginToken();
    await login(csrfToken);


   data.balance = await getAccountBalance() ?? "Unknown" ;
   await getBinDates(data);

   //console.log(JSON.stringify(data));

    // Send the array as an attribute
    await updateHomeAssistant('input_text.binschedule', 'Updated', {
        collections: data.collections 
    });
   
}

async function updateHomeAssistant(entityId: string, state: string, attributes: object) {
  try {
    await axios.post(
      `${HA_URL}/api/states/${entityId}`,
      { state: state, attributes: attributes },
      {
        headers: {
          'Authorization': `Bearer ${HA_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`Updated ${entityId} with ${Object.keys(attributes).length} collections.`);
  } catch (error: any) {
    console.error(`Failed to update ${entityId}:`, error.message);
  }
}



async function getLoginToken() : Promise<string>{
    let token : string = "";

    const loginPage = await client.get('https://my.ecological.ie/Account/Login');

    // Load the HTML into Cheerio
    const $login = cheerio.load(loginPage.data);
    
    token = $login('input[name="__RequestVerificationToken"]').val()?.toString() ?? "";

    if (token) {
        return token;
    }else{
        throw new Error("Could not find the __RequestVerificationToken in the HTML!");
    }

}

async function login(csrfToken: string) {
    try {

        const formData = new URLSearchParams();

        formData.append('ReturnUrl', '/'); // Added this
        formData.append('Username', process.env.ECOLOGICAL_USER || "");
        formData.append('Password', process.env.ECOLOGICAL_PASS || "");
        formData.append('__RequestVerificationToken', csrfToken);
        formData.append('RememberMe', 'false');
       
        await client.post('https://my.ecological.ie/Account/Login', formData);

    }catch (error) {
        console.error("Error fetching data:", error);
    }
}



async function getBinDates(data : BinData) {
    try {
        const response = await client.get('https://my.ecological.ie/Home/NextCollections');
        const $ = cheerio.load(response.data);

        $('table tbody tr').each((i, element) => {
            const date = $(element).find('td').eq(0).text().trim();
            const day = $(element).find('td').eq(1).text().trim();
            const type = $(element).find('td').eq(2).find('span').first().text().trim();
            
            if (date && type) {

                data.collections.push({
                    date: date,
                    day: day,
                    type: type
                });
            }
        });
        } catch (error) {
        console.error("Error fetching data:", error);
    }
}

async function getAccountBalance() {
    try {
        const response = await client.get('https://my.ecological.ie/');
        const $ = cheerio.load(response.data);

        const balance = $('#PayNowBox b').text().trim();

        if (balance) {
            return balance;
        }
    } catch (error) {
        console.error("Error fetching balance:", error);
        return null;
    }
}

main();

