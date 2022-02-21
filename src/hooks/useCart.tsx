import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";

// models:
import { Product } from "models";

// hooks:
import { api } from "services";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
  finalizeOrder: () => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let newCart: Product[] = [];
      let hasInStock = false;
      const response = await api.get(`/stock/${productId}`);
      const stockAmount = response.data.amount;

      if (cart.findIndex((item) => item.id === productId) !== -1) {
        cart.map((item) => {
          if (item.id === productId) {
            hasInStock = item.amount + 1 <= stockAmount;

            newCart.push({
              ...item,
              amount: hasInStock ? item.amount + 1 : item.amount,
            });

            if (!hasInStock)
              toast.error("Quantidade solicitada fora de estoque");

            return null;
          }
          return newCart.push(item);
        });
      } else {
        const response = await api.get(`/products/${productId}`);
        const newProduct = response.data;
        hasInStock = true;
        newCart = [...cart, { ...newProduct, amount: 1 }];
      }

      if (newCart.length > 0 && hasInStock) {
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        setCart(newCart);
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart: Product[] = [];

      const isFoundItem =
        cart.findIndex((item) => item.id === productId) !== -1;

      if (isFoundItem) {
        cart.map((item) => {
          if (item.id !== productId) {
            newCart.push(item);
            return null;
          }
          return null;
        });
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        setCart(newCart);
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart: Product[] = [];

      if (amount > 0) {
        if (cart.findIndex((item) => item.id === productId) === -1) {
          toast.error("Erro na alteração de quantidade do produto");
        } else {
          const response = await api.get(`/stock/${productId}`);
          const stockAmount = response.data.amount;
          const hasInStock = amount <= stockAmount;
          const isValidAmount = hasInStock && amount >= 1;

          cart.map((item) => {
            if (item.id === productId) {
              if (isValidAmount)
                newCart.push({
                  ...item,
                  amount: isValidAmount ? amount : item.amount,
                });

              !hasInStock &&
                toast.error("Quantidade solicitada fora de estoque");

              return null;
            }
            newCart.push(item);
            return null;
          });

          if (isValidAmount) {
            localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
            setCart(newCart);
          }
        }
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  const finalizeOrder = async () => {
    try {
      localStorage.removeItem("@RocketShoes:cart");
      setCart([]);
      toast.success("Pedido realizado!");
    } catch {
      toast.error("Erro ao finalizar o pedido");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addProduct,
        removeProduct,
        updateProductAmount,
        finalizeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
