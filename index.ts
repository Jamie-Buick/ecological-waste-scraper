import axios from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import 'dotenv/config'; 

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));


async function main() {
    const csrfToken = await getLoginToken();
    await getBinDates(csrfToken);
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


async function getBinDates(csrfToken: string) {
    try {

        const formData = new URLSearchParams();

        formData.append('ReturnUrl', '/'); // Added this
        formData.append('Username', process.env.ECOLOGICAL_USER || "");
        formData.append('Password', process.env.ECOLOGICAL_PASS || "");
        formData.append('__RequestVerificationToken', csrfToken);
        formData.append('RememberMe', 'false');
       
        await client.post('https://my.ecological.ie/Account/Login', formData);

        const response = await client.get('https://my.ecological.ie/');
        const $ = cheerio.load(response.data);

        $('.info-box-content').each((i, element) => {
            const date = $(element).find('.info-box-text').text().trim();
            const type = $(element).find('.info-box-number').text().trim();
            
            if (date && type) {
                console.log(`📅 ${type}: ${date}`);
            }
        });

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

main();