import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/coffee-list.module.scss'

import fsPromises from 'fs/promises';
import path from 'path'
import { CoffeeProduct } from '../../node-scraper/types/coffee-product';
import { CoffeeCard } from '../components/coffee-card';

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'public/data/products.json');
  const jsonData = await fsPromises.readFile(filePath, 'utf-8');
  const objectData = JSON.parse(jsonData);

  return {
    props: {
      data: objectData
    }
  }
}

interface CoffeeListProps {
  data: Array<{
    name: string,
    products: Array<CoffeeProduct>
  }>
}

const CoffeeList: NextPage<CoffeeListProps> = ({ data }: CoffeeListProps) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Hot coffees in your neighborhood</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Looking for some seed?
        </h1>

        <p>Check out the selection below:</p>

        <div className={styles.list}>
          {data.map(roaster => (
            <div key={roaster.name} className={styles.roaster}>
              <h2>{roaster.name.toUpperCase()}</h2>
              <div className={styles.grid}>
                {roaster.products.map(product =>
                  <CoffeeCard key={product.title} product={product} />
                )}
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}

export default CoffeeList
