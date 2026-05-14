import axios from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import 'dotenv/config'; 

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));


async function main() {
    const csrfToken = await getLoginToken();
    await login(csrfToken);
    await getBinDates();
    
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



async function getBinDates() {
    try {

        const response = await client.get('https://my.ecological.ie/Home/NextCollections');
       // console.log(response);
        const $ = cheerio.load(response.data);

        $('table tbody tr').each((i, element) => {
            const date = $(element).find('td').eq(0).text().trim();
            const day = $(element).find('td').eq(1).text().trim();
            const type = $(element).find('td').eq(2).find('span').first().text().trim();
            
            if (date && type) {
                console.log(`📅 ${date} (${day}): ${type}`);
            }
        });
        } catch (error) {
        console.error("Error fetching data:", error);
    }
}

main();