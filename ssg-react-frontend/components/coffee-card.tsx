import { CoffeeProduct } from "../types/coffee-product";
import styles from '../styles/coffee-card.module.scss'
import Image from 'next/image'

export function CoffeeCard(props: { product: CoffeeProduct }) {
  const { product } = props;

  return (
    <a key={product.link} href={product.link} className={styles.card}>
      {product.imageName ?
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={'/data/images/' + product.imageName} alt={product.title} /> :
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={product.imageUrl} alt={product.title} />
      }
      <div>
        <h2>{product.title}</h2>
        <p>{product.tastingNotes?.join(', ')}</p>
      </div>
    </a>
  )
}
