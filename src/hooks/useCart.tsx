import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
}

const CartContext = createContext<CartContextData>({} as CartContextData);

const KEYSTORAGE = '@RocketShoes:cart';

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(KEYSTORAGE); //Buscar dados do localStorage

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem(KEYSTORAGE, JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const stock = (await api.get<Stock>(`stock/${productId}`)).data;
      const productCart = cart.find((x, index) => x.id === productId);

      if (productCart) {
        if (productCart.amount + 1 > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          const newProducts = cart.map((prod) => {
            if (prod.id === productId) prod.amount += 1;
            return prod;
          });
          setCart(newProducts);
        }
      } else {
        const product = (await api.get<Product>(`products/${productId}`)).data;
        product.amount = 1;
        setCart([...cart, product]);
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const filtred = cart.filter((product) => productId !== product.id);
      setCart(filtred);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = (await api.get<Stock>(`stock/${productId}`)).data;

      if (amount <= stock.amount) {
        const changedProducts = cart.map((p) => {
          if (productId === p.id) {
            p.amount = amount;
          }
          return p;
        });
        setCart(changedProducts);
      } else {
        toast.error('Erro na adição do produto');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addProduct,
        removeProduct,
        updateProductAmount,
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
