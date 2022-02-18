import { useEffect, useMemo, useState } from "react";
import { MdAddShoppingCart } from "react-icons/md";

import { ProductList } from "./styles";
import { formatPrice } from "util/format";
import { useCart } from "hooks/useCart";
import { Product } from "models";
import { api } from "services";

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const { addProduct, cart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);

  // ? Load products:
  useEffect(() => {
    async function loadProducts() {
      const response = await api.get("/products");
      setProducts(response.data);
    }

    loadProducts();
  }, []);

  const cartItemsAmount = useMemo(
    () =>
      cart.reduce(
        (sumAmount, product) => ({
          ...sumAmount,
          [product.id]: product.amount,
        }),
        {} as CartItemsAmount
      ),
    [cart]
  );

  function handleAddProduct(id: number) {
    addProduct(id);
  }

  return (
    <ProductList>
      {products &&
        products.map((product) => (
          <li key={product.id}>
            <img src={product.image} alt={product.title} />
            <strong>{product.title}</strong>
            <span>{formatPrice(product.price)}</span>
            <button
              type="button"
              data-testid="add-product-button"
              onClick={() => handleAddProduct(product.id)}
            >
              <div data-testid="cart-product-quantity">
                <MdAddShoppingCart size={16} color="#FFF" />
                {cartItemsAmount[product.id] || 0}
              </div>

              <span>ADICIONAR AO CARRINHO</span>
            </button>
          </li>
        ))}
    </ProductList>
  );
};

export default Home;
