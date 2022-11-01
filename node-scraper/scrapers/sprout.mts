import { Browser, Page } from 'puppeteer';
import { CoffeeProduct } from '../types/coffee-product';
import download from 'image-downloader'
import { Scraper } from './scraper';
import { config } from '../config.mjs';

export class SproutScraper implements Scraper {
  public name = 'sprout';

  private async getText(matcher: string, page: Page): Promise<string> {
    const element = await page.waitForSelector(matcher);
    return (await page.evaluate(title => title.textContent, element)).replace('\n', '').trim();
  }

  private parseTastingNotes(notes: string): Array<string> {
    const splitNotes = notes.includes(',') ? notes.split(',') : notes.split(' ');
    return splitNotes.map(it => it.trim());
  }

  public async scrape(browser: Browser): Promise<Array<CoffeeProduct>> {
    const page = await browser.newPage();
    const baseUrl = 'https://sproutcoffeeroasters.art';

    await page.goto(baseUrl + '/collections/coffee');

    const productLinks = await Promise.all(
      (await page.$$('div.productitem > div.productitem--info > h2 > a'))
        .map(element =>
          element.evaluate(it => it.getAttribute('href'))));

    const products = await Promise.all(productLinks.map(async link => {
      const newPage = await browser.newPage();
      await newPage.goto(baseUrl + link, { waitUntil: 'networkidle2' });

      const details = await Promise.all((await newPage.$$('div.ingredient')).map(async element => {
        return {
          title: (await (await element.waitForSelector('p')).evaluate(it => it.textContent)).toLocaleLowerCase(),
          value: (await (await element.waitForSelector('span')).evaluate(it => it.textContent)).trim()
        }
      }));

      const productImageUrl = 'https:' + await (await newPage.waitForSelector('img.product-gallery--loaded-image')).evaluate(it => it.getAttribute('src'));
      const result = config.downloadImages ? await download.image({ url: productImageUrl, dest: '../../data/images' }) : undefined;

      return {
        link: baseUrl + link,
        title: await this.getText('h1.product-title', newPage),
        tastingNotes: this.parseTastingNotes(await this.getText('div.product-details p', newPage)),
        producer: details.find(it => it.title === 'producer')?.value,
        location: details.find(it => it.title === 'location')?.value,
        process: details.find(it => it.title === 'process')?.value,
        variety: details.find(it => it.title === 'variety')?.value,
        elevation: details.find(it => it.title === 'elevation')?.value,
        imageUrl: productImageUrl,
        imageName: result ? /.*\\(.+)/.exec(result.filename)[1] : undefined
      } as CoffeeProduct;
    }));

    return products;
  }
}
