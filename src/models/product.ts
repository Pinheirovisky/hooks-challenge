export interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  amount: number;
}

export interface ProductFormatted extends Product {
  priceFormatted: string;
  subTotal: string;
}
