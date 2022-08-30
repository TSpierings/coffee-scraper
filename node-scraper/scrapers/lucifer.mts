import { Browser, Page } from 'puppeteer';
import { CoffeeProduct } from '../types/coffee-product';
import download from 'image-downloader'
import { Scraper } from './scraper';
import { config } from '../config.mjs';

export class LuciferScraper implements Scraper {
  public name = 'lucifer';

  private async getText(matcher: string, page: Page): Promise<string> {
    const element = await page.waitForSelector(matcher);
    return (await page.evaluate(title => title.textContent, element)).replace('\n', '').trim();
  }

  private parseTastingNotes(notes: string): Array<string> {
    if (!notes) {
      return []
    }

    const splitNotes = notes.includes(',') ? notes.split(',') : notes.split(' ');
    return splitNotes.map(it => it.trim());
  }

  private parseTitle(title: string): string {
    if (!title) {
      console.error('no title found for lucifer product');
      return 'No title'
    }

    let name = title.split(',')[0].trim();

    if (title.toLowerCase().includes('filter') && !name.toLowerCase().includes('filter')) {
      name += ' filter';
    } else if (title.toLowerCase().includes('espresso') && !name.toLowerCase().includes('espresso')) {
      name += ' espresso'
    }

    return name;
  }

  public async scrape(browser: Browser): Promise<Array<CoffeeProduct>> {
    const page = await browser.newPage();
    const baseUrl = 'https://www.lucifercoffeeroasters.com';

    await page.goto(baseUrl + '/winkel');

    const productLinks = await Promise.all([
      ...(await page.$$('#coffee_espresso article h2 a'))
        .map(element =>
          element.evaluate(it => it.getAttribute('href'))),
      ...(await page.$$('#coffee_filter article h2 a'))
        .map(element =>
          element.evaluate(it => it.getAttribute('href')))]);

    const products = await Promise.all(productLinks.map(async link => {
      const newPage = await browser.newPage();
      await newPage.goto(link, { waitUntil: 'networkidle2' });

      const details = (await (await newPage.waitForSelector('div.summary div p')).evaluate(it => it.textContent)).split('\n').map(line => {
        const matches = /(.+?):(.+?)[.*?]/.exec(line);
        if (matches?.length >= 3) {
          return {
            title: matches[1].trim().toLowerCase(),
            value: matches[2].trim()
          }
        }
        return null
      }).filter(it => it);

      const productImageUrl = await (await newPage.waitForSelector('figure div a img')).evaluate(it => it.getAttribute('src'));
      const result = config.downloadImages ? await download.image({ url: productImageUrl, dest: '../../data/images' }) : undefined;

      return {
        link: link,
        title: this.parseTitle(await this.getText('h1.product_title', newPage)),
        tastingNotes: this.parseTastingNotes(details.find(it => it.title === 'taste' || it.title === 'flavour')?.value),
        producer: undefined,
        location: details.find(it => it.title === 'origin')?.value,
        process: details.find(it => it.title === 'processing')?.value,
        variety: details.find(it => it.title === 'variety')?.value,
        elevation: undefined,
        imageUrl: productImageUrl,
        imageName: result ? /.*\\(.+)/.exec(result.filename)[1] : undefined
      } as CoffeeProduct;
    }));

    return products;
  }
}
