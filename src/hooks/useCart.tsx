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
  products: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  deleteProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
  finalizeOrder: () => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [stock, setStock] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

  // ? Load products:
  useEffect(() => {
    async function loadProducts() {
      const response = await api.get("/products");
      setProducts(response.data);
    }

    loadProducts();
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
        if (item.id === productId && item.amount > 1) {
          newCart.push({
            ...item,
            amount: item.amount - 1,
          });

          return null;
        }

        newCart.push(item);
        return null;
      });

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const deleteProduct = (productId: number) => {
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
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart: Product[] = [];

      cart.map((item) => {
        if (item.id === productId) {
          const stockAmount =
            stock.find((item) => item.id === productId)?.amount || 0;
          const hasInStock = item.amount + 1 <= stockAmount;

          newCart.push({
            ...item,
            amount: hasInStock ? item.amount + 1 : item.amount,
          });

          !hasInStock && toast.error("Quantidade solicitada fora de estoque");

          return null;
        }
        return newCart.push(item);
      });

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
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
        products,
        addProduct,
        removeProduct,
        updateProductAmount,
        deleteProduct,
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
