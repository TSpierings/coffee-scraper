import { Browser } from 'puppeteer';
import { CoffeeProduct } from '../types/coffee-product';
import download from 'image-downloader'
import { Scraper } from './scraper';
import { config } from '../config.mjs';

export class BeanBrothersScraper implements Scraper {
  public name = 'beanbrothers';
  private baseUrl = 'https://www.beanbrothers.nl';
  private overviewUrl = '/shop/';

  private parseTastingNotes(notes: string): Array<string> {
    if (!notes) {
      return []
    }

    const splitNotes = notes.includes(',') ? notes.split(',') : notes.split(' ');
    return splitNotes.map(it => it.trim());
  }

  public async scrape(browser: Browser): Promise<Array<CoffeeProduct>> {
    const page = await browser.newPage();
    await page.goto(this.baseUrl + this.overviewUrl);

    const allProducts = await page.$$('div.product-small.box');

    const products = await Promise.all(allProducts.map(async element => {
      if (!await element.$('table')) {
        return null;
      }

      const link = await element.$eval('div.box-image div.image-none a', it => it.getAttribute('href'));
      const productImageUrl = await element.$eval('div.box-image img', it => it.getAttribute('data-src'));
      const result = config.downloadImages ? await download.image({ url: productImageUrl, dest: '../../data/images' }) : undefined;
      const tastingNotes = await element.$eval('em', el => el.textContent).catch(() => undefined);

      const details = await Promise.all((await element.$$('table tr')).map(async row => {
        return {
          title: await row.$eval('td.rechts', it => it.textContent.toLowerCase()),
          value: await row.$eval('td.links', it => it.textContent)
        }
      }));

      return {
        link: link,
        title: await element.$eval('div.title-wrapper a', it => it.textContent.trim()),
        tastingNotes: tastingNotes ? this.parseTastingNotes(tastingNotes) : undefined,
        producer: details.find(it => it.title === 'farm')?.value,
        location: details.find(it => it.title === 'origin')?.value + ', ' + details.find(it => it.title === 'region')?.value,
        process: details.find(it => it.title === 'process')?.value,
        variety: undefined,
        elevation: details.find(it => it.title === 'altitude')?.value,
        imageUrl: productImageUrl,
        imageName: result ? /.*\\(.+)/.exec(result.filename)[1] : undefined
      } as CoffeeProduct;
    }));

    return products.filter(it => it);
  }
}
