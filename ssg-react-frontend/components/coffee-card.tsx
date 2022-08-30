import { CoffeeProduct } from "../types/coffee-product";
import styles from '../styles/coffee-card.module.scss'

export function CoffeeCard(props: {product: CoffeeProduct}) {
  const { product } = props;

  return (
    <a key={product.link} href={product.link} className={styles.card}>
      {/* <Image src={'/data/images/' + product.imageName!} alt={product.title} height='200px' width='200px' layout='intrinsic' objectFit='contain'/> */}
      {/* <Image src={product.imageUrl!} alt={product.title} height='200px' width='200px' layout='intrinsic' objectFit='contain'/> */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.imageUrl} alt={product.title} />
      <div>
        <h2>{product.title}</h2>
        <p>{product.tastingNotes?.join(', ')}</p>
      </div>
    </a>
  )
}
