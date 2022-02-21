import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MdDelete,
  MdAddCircleOutline,
  MdRemoveCircleOutline,
} from "react-icons/md";

import { useCart } from "hooks/useCart";

// utils:
import { formatPrice } from "util/format";

// model:
import { ProductFormatted } from "models";

// styles:
import { Container, ProductTable, Total, BackButton } from "./styles";

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  amount: number;
}

const Cart = (): JSX.Element => {
  const { cart, removeProduct, updateProductAmount, finalizeOrder } = useCart();

  const cartFormatted: ProductFormatted[] = useMemo(
    () =>
      cart.map((product) => ({
        ...product,
        priceFormatted: formatPrice(product.price),
        subTotal: formatPrice(product.amount * product.price),
      })),
    [cart]
  );

  const total = useMemo(
    () =>
      formatPrice(
        cart.reduce((sumTotal, product) => {
          return sumTotal + product.price * product.amount;
        }, 0)
      ),
    [cart]
  );

  function handleProductIncrement(product: Product) {
    updateProductAmount({ productId: product.id, amount: product.amount + 1 });
  }

  function handleProductDecrement(product: Product) {
    updateProductAmount({ productId: product.id, amount: product.amount - 1 });
  }

  function handleRemoveProduct(productId: number) {
    removeProduct(productId);
  }

  function handleFinalizeOrder() {
    finalizeOrder();
  }

  return (
    <Container>
      {cart.length > 0 ? (
        <>
          <ProductTable>
            <thead>
              <tr>
                <th aria-label="product image" />
                <th>PRODUTO</th>
                <th>QTD</th>
                <th>SUBTOTAL</th>
                <th aria-label="delete icon" />
              </tr>
            </thead>
            <tbody>
              {cartFormatted.map((item) => (
                <tr key={item.id} data-testid="product">
                  <td>
                    <img src={item.image} alt={item.title} />
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                    <span>{item.price}</span>
                  </td>
                  <td>
                    <div>
                      <button
                        type="button"
                        data-testid="decrement-product"
                        disabled={item.amount <= 1}
                        onClick={() => handleProductDecrement(item)}
                      >
                        <MdRemoveCircleOutline size={20} />
                      </button>
                      <input
                        type="text"
                        data-testid="product-amount"
                        readOnly
                        value={item.amount}
                      />
                      <button
                        type="button"
                        data-testid="increment-product"
                        onClick={() => handleProductIncrement(item)}
                      >
                        <MdAddCircleOutline size={20} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <strong>{item.subTotal}</strong>
                  </td>
                  <td>
                    <button
                      type="button"
                      data-testid="remove-product"
                      onClick={() => handleRemoveProduct(item.id)}
                    >
                      <MdDelete size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </ProductTable>

          <footer>
            <button type="button" onClick={handleFinalizeOrder}>
              Finalizar pedido
            </button>

            <Total>
              <span>TOTAL</span>
              <strong>{total}</strong>
            </Total>
          </footer>
        </>
      ) : (
        <>
          <h3>Pedido realizado com sucesso!</h3>
          <BackButton to="/">Voltar</BackButton>
        </>
      )}
    </Container>
  );
};

export default Cart;
