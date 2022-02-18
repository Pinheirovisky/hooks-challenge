import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "services/api";

// models:
import { Product, Stock } from "models";

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
  const [stock, setStock] = useState<Stock[]>([]);
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  // ? Load stock:
  useEffect(() => {
    async function loadStock() {
      const response = await api.get("/stock");
      setStock(response.data);
    }

    loadStock();
  }, []);

  const addProduct = async (productId: number) => {
    try {
      let newCart: Product[] = [];
      if (products) {
        if (cart.findIndex((item) => item.id === productId) !== -1) {
          cart.map((item) => {
            if (item.id === productId) {
              const stockAmount =
                stock.find((item) => item.id === productId)?.amount || 0;
              const hasInStock = item.amount + 1 <= stockAmount;

              newCart.push({
                ...item,
                amount: hasInStock ? item.amount + 1 : item.amount,
              });

              !hasInStock &&
                toast.error("Quantidade solicitada fora de estoque");

              return null;
            }
            return newCart.push(item);
          });
        } else {
          const newProduct =
            products.find((product) => product.id === productId) ||
            ({} as Product);
          newCart = [...cart, { ...newProduct, amount: 1 }];
        }

        if (newCart.length > 0) {
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
          setCart(newCart);
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart: Product[] = [];

      cart.map((item) => {
        if (item.id !== productId) {
          newCart.push(item);
          return null;
        }
        return null;
      });

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
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

      if (amount !== 0) {
        if (cart.findIndex((item) => item.id === productId) === -1) {
          toast.error("Erro na alteração de quantidade do produto");
        } else {
          let hasInStock = false;

          cart.map((item) => {
            if (item.id === productId) {
              const stockAmount =
                stock.find((item) => item.id === productId)?.amount || 0;
              hasInStock = item.amount - amount * -1 <= stockAmount;
              const isValidAmount =
                hasInStock && item.amount - amount * -1 >= 1;

              newCart.push({
                ...item,
                amount: isValidAmount ? item.amount - amount * -1 : item.amount,
              });

              !hasInStock &&
                toast.error("Quantidade solicitada fora de estoque");

              return null;
            }
            return newCart.push(item);
          });

          if (hasInStock) {
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
